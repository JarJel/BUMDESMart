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
                OpenWAService::clearSessionCache();
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

            // 1. Cek status session saat ini
            $statusRes = $this->openwaHttp()->timeout(10)->get("/api/sessions/{$session}");
            
            // Jika 404 (session belum pernah dibuat di OpenWA)
            if ($statusRes->status() === 404) {
                OpenWAService::clearSessionCache();
                $createRes = $this->openwaHttp()->timeout(10)->post("/api/sessions", [
                    'name' => config('services.openwa.session_id', 'BumDesMartNukita'),
                ]);
                if ($createRes->successful()) {
                    $session = $createRes->json('id') ?? $session;
                }
                $status = 'created';
            } else {
                $status = strtolower($statusRes->json('status') ?? '');
            }

            // Jika WhatsApp sudah terhubung
            if (in_array($status, ['connected', 'ready'])) {
                return response()->json([
                    'qr'        => null,
                    'connected' => true,
                    'error'     => 'WhatsApp sudah terhubung. Tidak perlu scan QR.',
                ]);
            }

            // 2. Trigger start jika status belum qr_ready
            if ($status !== 'qr_ready') {
                $this->openwaHttp()->timeout(15)->post("/api/sessions/{$session}/start");
                sleep(2);
            }

            // 3. Retry polling QR code sampai 12 kali (24 detik)
            $qr = null;
            $lastApiError = null;

            for ($i = 0; $i < 12; $i++) {
                $res = $this->openwaHttp()->timeout(10)->get("/api/sessions/{$session}/qr");
                if ($res->successful()) {
                    $data = $res->json();
                    $qr   = is_array($data) ? ($data['qrCode'] ?? $data['qr'] ?? $data['data'] ?? null) : null;
                    if ($qr) {
                        break;
                    }
                } else {
                    $lastApiError = $res->json('message') ?? $res->body();
                }

                // Jika di pertengahan loop status berubah jadi ready/connected
                $checkRes = $this->openwaHttp()->timeout(5)->get("/api/sessions/{$session}");
                if ($checkRes->successful()) {
                    $currStatus = strtolower($checkRes->json('status') ?? '');
                    if (in_array($currStatus, ['connected', 'ready'])) {
                        return response()->json([
                            'qr'        => null,
                            'connected' => true,
                            'error'     => 'WhatsApp sudah terhubung.',
                        ]);
                    }
                }

                // Jika di percobaan ke-5 masih belum ada QR, paksa restart session
                if ($i === 4 && !$qr) {
                    $this->openwaHttp()->timeout(10)->post("/api/sessions/{$session}/stop");
                    sleep(1);
                    $this->openwaHttp()->timeout(15)->post("/api/sessions/{$session}/start");
                }

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
                $errDetail = $lastApiError ?: "Status: {$status}";
                return response()->json([
                    'qr'    => null,
                    'error' => "QR Code sedang disiapkan oleh OpenWA ({$errDetail}). Silakan klik 'Ambil QR Code' sekali lagi.",
                ]);
            }

            return response()->json(['qr' => $qr, 'timeout' => 60]);
        } catch (\Throwable $e) {
            $baseUrl = OpenWAService::getBaseUrl();
            return response()->json([
                'qr'    => null,
                'error' => "Gagal mengambil QR. Server OpenWA di {$baseUrl} mengalami kendala: " . $e->getMessage(),
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
