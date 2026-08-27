<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * WhatsApp gateway via OpenWA (self-hosted).
 * Interface-compatible dengan WhatsappService (Fonnte) —
 * untuk migrasi cukup ganti nama class di controller/AuthService.
 *
 * Env vars yang dibutuhkan:
 *   OPENWA_URL         = http://localhost:2785   (atau URL tunnel Cloudflare)
 *   OPENWA_SESSION_ID  = BumDesMartNukita              (nama/label session, BUKAN UUID)
 *   OPENWA_API_KEY     = (API key dari dashboard OpenWA, kosongkan jika belum diset)
 *
 * OpenWA API mensyaratkan session diidentifikasi via UUID yang di-generate
 * server saat create — nama di .env cuma label. resolveSessionId() otomatis
 * cari UUID berdasarkan nama (atau create baru kalau belum ada), lalu cache.
 */
class OpenWAService
{
    /**
     * Resolve UUID session OpenWA dari nama/label (config: OPENWA_SESSION_ID).
     * Auto-create session baru di OpenWA kalau belum ada.
     */
    public static function resolveSessionId(): ?string
    {
        $baseUrl = rtrim(config('services.openwa.url', 'http://localhost:2785'), '/');
        $name    = config('services.openwa.session_id', 'BumDesMartNukita');
        $apiKey  = config('services.openwa.api_key', '');
        $cacheKey = 'openwa_session_uuid_' . $name;

        return Cache::remember($cacheKey, 3600, function () use ($baseUrl, $name, $apiKey) {
            $headers = ['Content-Type' => 'application/json'];
            if ($apiKey) {
                $headers['x-api-key'] = $apiKey;
            }
            $http = Http::withHeaders($headers)->withoutVerifying()->timeout(10);

            // Cari session yang sudah ada dengan nama ini
            $list = $http->get("{$baseUrl}/api/sessions");
            if ($list->successful()) {
                foreach ((array) $list->json() as $session) {
                    if (($session['name'] ?? null) === $name) {
                        return $session['id'];
                    }
                }
            }

            // Belum ada — buat session baru
            $created = $http->post("{$baseUrl}/api/sessions", ['name' => $name]);
            if ($created->successful()) {
                return $created->json('id');
            }

            Log::error('OpenWA gagal resolve/buat session: ' . $created->body());
            return null;
        });
    }

    public static function send(string $target, string $message): array
    {
        if (empty($target)) {
            return ['status' => false, 'error' => 'Target phone number is empty.'];
        }

        $baseUrl   = rtrim(config('services.openwa.url', 'http://localhost:2785'), '/');
        $sessionId = self::resolveSessionId();
        $apiKey    = config('services.openwa.api_key', '');

        if (!$sessionId) {
            return ['status' => false, 'error' => 'Gagal resolve session OpenWA.'];
        }

        // Normalise nomor: hilangkan + dan awalan 0, tambah 62
        $phone = preg_replace('/\D/', '', $target);
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        } elseif (!str_starts_with($phone, '62')) {
            $phone = '62' . $phone;
        }

        try {
            $headers = ['Content-Type' => 'application/json'];
            if ($apiKey) {
                $headers['x-api-key'] = $apiKey;
            }

            $response = Http::withHeaders($headers)
                ->withoutVerifying()
                ->post("{$baseUrl}/api/sessions/{$sessionId}/messages/send-text", [
                    'chatId'  => "{$phone}@c.us",
                    'content' => $message,
                ]);

            if ($response->successful()) {
                return ['status' => true, 'data' => $response->json()];
            }

            Log::error('OpenWA send error: ' . $response->body());
            return ['status' => false, 'error' => $response->json('message') ?? $response->body()];
        } catch (\Exception $e) {
            Log::error('OpenWA connection exception: ' . $e->getMessage());
            return ['status' => false, 'error' => $e->getMessage()];
        }
    }
}
