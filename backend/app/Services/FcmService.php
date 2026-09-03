<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class FcmService
{
    private static function getAccessToken(): ?string
    {
        return Cache::remember('fcm_access_token', 3000, function () {
            $credentials = json_decode(config('services.firebase.credentials'), true);
            if (!$credentials) return null;

            $now  = time();
            $header  = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $payload = base64_encode(json_encode([
                'iss'   => $credentials['client_email'],
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud'   => 'https://oauth2.googleapis.com/token',
                'iat'   => $now,
                'exp'   => $now + 3600,
            ]));

            $header  = rtrim(strtr($header, '+/', '-_'), '=');
            $payload = rtrim(strtr($payload, '+/', '-_'), '=');

            $key = $credentials['private_key'];
            openssl_sign("{$header}.{$payload}", $sig, $key, 'SHA256');
            $signature = rtrim(strtr(base64_encode($sig), '+/', '-_'), '=');

            $jwt = "{$header}.{$payload}.{$signature}";

            $res = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]);

            return $res->successful() ? $res->json('access_token') : null;
        });
    }

    public static function send(string $token, string $title, string $body, array $data = []): bool
    {
        $projectId   = config('services.firebase.project_id');
        $accessToken = self::getAccessToken();

        if (!$accessToken || !$projectId) {
            Log::warning('FCM: missing access token or project_id');
            return false;
        }

        $res = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                'message' => [
                    'token'        => $token,
                    'notification' => ['title' => $title, 'body' => $body],
                    'data'         => array_map('strval', $data),
                    'webpush'      => [
                        'notification' => [
                            'title' => $title,
                            'body'  => $body,
                            'icon'  => '/icon-192x192.png',
                            'badge' => '/icon-192x192.png',
                            'click_action' => config('app.frontend_url'),
                        ],
                    ],
                ],
            ]);

        if (!$res->successful()) {
            Log::warning('FCM send failed: ' . $res->body());
        }

        return $res->successful();
    }

    public static function sendMulticast(array $tokens, string $title, string $body, array $data = []): void
    {
        foreach ($tokens as $token) {
            self::send($token, $title, $body, $data);
        }
    }
}
