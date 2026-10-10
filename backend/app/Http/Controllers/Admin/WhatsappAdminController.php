<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\OpenWAService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsappAdminController extends Controller
{
    private function openwaHttp()
    {
        $baseUrl = OpenWAService::getBaseUrl();
        $apiKey  = config('services.openwa.api_key', '');

        $http = Http::baseUrl($baseUrl)->withoutVerifying()->timeout(10);
        if ($apiKey) {
            $http = $http->withHeaders(['x-api-key' => $apiKey]);
        }
        return $http;
    }

    private function sessionId(): ?string
    {
        return OpenWAService::resolveSessionId();
    }

    /** GET /admin/whatsapp/status */
    public function status()
    {
        try {
            $session = $this->sessionId();
            if (!$session) {
                return response()->json([
                    'connected' => false,
                    'status'    => 'error',
                    'error'     => 'Gagal resolve session OpenWA.',
                ]);
            }
            $res = $this->openwaHttp()->get("/api/sessions/{$session}");

            if ($res->status() === 404) {
                return response()->json(['connected' => false, 'status' => 'not_found']);
            }

            $data = $res->json();
            $sessionStatus = strtolower($data['status'] ?? '');
            $isConnected = in_array($sessionStatus, ['connected', 'ready']);
            return response()->json([
                'connected' => $isConnected,
                'status'    => $isConnected ? 'CONNECTED' : ($data['status'] ?? 'UNKNOWN'),
                'name'      => $data['pushName'] ?? $data['name'] ?? null,
                'phone'     => $data['phone']  ?? null,
            ]);
        } catch (\Throwable $e) {
            $baseUrl = OpenWAService::getBaseUrl();
            return response()->json([
                'connected' => false,
                'status'    => 'OFFLINE',
                'error'     => "Server OpenWA belum aktif di {$baseUrl}. Silakan jalankan OpenWA terlebih dahulu.",
            ]);
        }
    }

    /** GET /admin/whatsapp/qr */
    public function qr()
    {
        try {
            $session = $this->sessionId();
            if (!$session) {
                return response()->json(['error' => 'Gagal resolve session OpenWA.'], 500);
            }

            // Cek status session — restart jika failed/stopped, start jika lum di-start
            $statusRes = $this->openwaHttp()->timeout(10)->get("/api/sessions/{$session}");
            $status    = strtolower($statusRes->json('status') ?? '');

            if (in_array($status, ['failed', 'stopped'])) {
                $this->openwaHttp()->timeout(10)->post("/api/sessions/{$session}/stop");
                sleep(1);
                $this->openwaHttp()->timeout(30)->post("/api/sessions/{$session}/start");
                sleep(3);
            } else if (!in_array($status, ['qr_ready', 'connected', 'ready'])) {
                $this->openwaHttp()->timeout(30)->post("/api/sessions/{$session}/start");
                sleep(3);
            }

            // Retry ambil QR sampai 10x (20 detik max)
            $qr = null;
            for ($i = 0; $i < 10; $i++) {
                $res  = $this->openwaHttp()->timeout(10)->get("/api/sessions/{$session}/qr");
                $data = $res->json();
                $qr   = $data['qrCode'] ?? $data['qr'] ?? $data['data'] ?? null;
                if ($qr) break;
                sleep(2);
            }

            if ($qr && !str_starts_with($qr, 'data:image') && !str_starts_with($qr, 'http')) {
                if (base64_encode(base64_decode($qr, true)) === $qr) {
                    $qr = 'data:image/png;base64,' . $qr;
                } else {
                    $qr = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' . urlencode($qr);
                }
            }

            if (!$qr) {
                return response()->json([
                    'qr' => null,
                    'error' => "QR Code tidak tersedia. Pastikan session WhatsApp tidak sedang terhubung.",
                ]);
            }

            return response()->json(['qr' => $qr, 'timeout' => 60]);
        } catch (\Throwable $e) {
            $baseUrl = OpenWAService::getBaseUrl();
            return response()->json([
                'qr' => null,
                'error' => "Gagal mengambil QR. Server OpenWA belum aktif di {$baseUrl}. Silakan jalankan OpenWA terlebih dahulu.",
            ]);
        }
    }

    /** POST /admin/whatsapp/send-test */
    public function sendTest(Request $request)
    {
        $request->validate([
            'phone'   => 'required|string',
            'message' => 'required|string|max:500',
        ]);

        $result = OpenWAService::send($request->phone, $request->message);

        if ($result['status']) {
            return response()->json(['message' => 'Pesan berhasil dikirim.']);
        }

        return response()->json(['message' => $result['error'] ?? 'Gagal mengirim.'], 422);
    }

    /** POST /admin/whatsapp/disconnect */
    public function disconnect()
    {
        try {
            $session = $this->sessionId();
            $this->openwaHttp()->post("/api/sessions/{$session}/stop");
            return response()->json(['message' => 'Session diputus.']);
        } catch (\Throwable $e) {
            $baseUrl = OpenWAService::getBaseUrl();
            return response()->json(['message' => "Server OpenWA belum aktif di {$baseUrl}."], 400);
        }
    }

    /** POST /admin/whatsapp/restart */
    public function restart()
    {
        try {
            $session = $this->sessionId();
            $this->openwaHttp()->post("/api/sessions/{$session}/stop");
            sleep(2);
            $this->openwaHttp()->post("/api/sessions/{$session}/start");
            return response()->json(['message' => 'Session direstart.']);
        } catch (\Throwable $e) {
            $baseUrl = OpenWAService::getBaseUrl();
            return response()->json(['message' => "Server OpenWA belum aktif di {$baseUrl}."], 400);
        }
    }
}
