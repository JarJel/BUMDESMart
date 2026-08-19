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
        $baseUrl = rtrim(config('services.openwa.url', 'http://localhost:2785'), '/');
        $apiKey  = config('services.openwa.api_key', '');

        $http = Http::baseUrl($baseUrl)->withoutVerifying()->timeout(10);
        if ($apiKey) {
            $http = $http->withHeaders(['x-api-key' => $apiKey]);
        }
        return $http;
    }

    private function sessionId(): string
    {
        return config('services.openwa.session_id', 'bumdesmart');
    }

    /** GET /admin/whatsapp/status */
    public function status()
    {
        try {
            $session = $this->sessionId();
            $res = $this->openwaHttp()->get("/api/sessions/{$session}");

            if ($res->status() === 404) {
                return response()->json(['connected' => false, 'status' => 'not_found']);
            }

            $data = $res->json();
            return response()->json([
                'connected' => ($data['status'] ?? '') === 'CONNECTED',
                'status'    => $data['status'] ?? 'UNKNOWN',
                'name'      => $data['name']   ?? null,
                'phone'     => $data['phone']  ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json(['connected' => false, 'status' => 'error', 'error' => $e->getMessage()]);
        }
    }

    /** GET /admin/whatsapp/qr */
    public function qr()
    {
        try {
            $session = $this->sessionId();

            // Buat session kalau belum ada
            $this->openwaHttp()->post('/api/sessions', ['id' => $session])->json();

            // Start session
            $this->openwaHttp()->post("/api/sessions/{$session}/start")->json();

            // Ambil QR
            $res = $this->openwaHttp()->get("/api/sessions/{$session}/qr");
            $data = $res->json();

            return response()->json([
                'qr'      => $data['qr']      ?? $data['data'] ?? null,
                'timeout' => $data['timeout'] ?? 60,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
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
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
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
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
