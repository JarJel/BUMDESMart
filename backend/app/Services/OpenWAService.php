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
     * Dapatkan URL OpenWA. Auto-detect jika berjalan di dalam container Docker.
     */
    public static function getBaseUrl(): string
    {
        $url = rtrim(config('services.openwa.url', 'http://localhost:2785'), '/');

        // Jika URL merujuk ke localhost/127.0.0.1, cek apakah ada container OpenWA di Docker network
        if (str_contains($url, 'localhost') || str_contains($url, '127.0.0.1')) {
            if (gethostbyname('openwa') !== 'openwa') {
                return 'http://openwa:2785';
            }
            if (gethostbyname('bumdesmart_openwa') !== 'bumdesmart_openwa') {
                return 'http://bumdesmart_openwa:2785';
            }
        }

        return $url;
    }

    public static function getApiKey(): string
    {
        $key = config('services.openwa.api_key', '');
        if (empty($key) || strlen($key) < 32) {
            return 'owa_master_8d92f7a1e04b8c31276aef9045b8123c8a9012bc563d7e89012a34b56c7890ef';
        }
        return $key;
    }

    /**
     * Resolve UUID session OpenWA dari nama/label (config: OPENWA_SESSION_ID).
     * Auto-create session baru di OpenWA kalau belum ada.
     */
    public static function resolveSessionId(): ?string
    {
        $baseUrl   = self::getBaseUrl();
        $sessionId = config('services.openwa.session_id', 'BumDesMartNukita');
        $apiKey    = self::getApiKey();

        if (empty($sessionId)) {
            $sessionId = 'BumDesMartNukita';
        }

        // Jika env sudah berisi UUID, kembalikan langsung tanpa lookup nama
        $isUuid = (bool) preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $sessionId
        );
        if ($isUuid) {
            return $sessionId;
        }

        $name     = $sessionId;
        $cacheKey = 'openwa_session_uuid_' . $name;

        $cached = Cache::get($cacheKey);
        if ($cached) {
            return $cached;
        }

        try {
            $headers = ['Content-Type' => 'application/json'];
            if ($apiKey) {
                $headers['x-api-key'] = $apiKey;
            }
            $http = Http::withHeaders($headers)->withoutVerifying()->timeout(5);

            // 1. Cari session dengan nama / pushName spesifik
            $list = $http->get("{$baseUrl}/api/sessions", ['name' => $name]);
            if ($list->successful() && is_array($list->json())) {
                foreach ($list->json() as $session) {
                    if (($session['name'] ?? null) === $name || ($session['id'] ?? null) === $name || ($session['pushName'] ?? null) === $name) {
                        $id = $session['id'] ?? null;
                        if ($id) {
                            Cache::put($cacheKey, $id, 3600);
                            return $id;
                        }
                    }
                }
            }

            // 2. Fallback: Cari dari seluruh daftar session
            $all = $http->get("{$baseUrl}/api/sessions");
            if ($all->successful() && is_array($all->json())) {
                foreach ($all->json() as $session) {
                    if (($session['name'] ?? null) === $name || ($session['id'] ?? null) === $name || ($session['pushName'] ?? null) === $name) {
                        $id = $session['id'] ?? null;
                        if ($id) {
                            Cache::put($cacheKey, $id, 3600);
                            return $id;
                        }
                    }
                }
            }

            // 3. Buat session baru jika belum ada
            $created = $http->post("{$baseUrl}/api/sessions", ['name' => $name]);
            if ($created->successful()) {
                $id = $created->json('id') ?? null;
                if ($id) {
                    Cache::put($cacheKey, $id, 3600);
                    return $id;
                }
            }

            Log::warning('OpenWA gagal resolve/buat session: ' . $created->body());
        } catch (\Throwable $e) {
            Log::warning('OpenWA resolveSessionId exception: ' . $e->getMessage());
        }

        return $name;
    }

    public static function clearSessionCache(): void
    {
        $sessionId = config('services.openwa.session_id', 'BumDesMartNukita');
        Cache::forget('openwa_session_uuid_' . $sessionId);
    }

    public static function send(string $target, string $message): array
    {
        if (empty($target)) {
            return ['status' => false, 'error' => 'Target phone number is empty.'];
        }

        $baseUrl   = self::getBaseUrl();
        $sessionId = self::resolveSessionId();
        $apiKey    = self::getApiKey();

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
                    'chatId' => "{$phone}@c.us",
                    'text'   => $message,
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
