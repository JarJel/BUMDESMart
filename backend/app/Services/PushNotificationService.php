<?php

namespace App\Services;

use App\Models\DeviceToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    private string $appId;
    private string $apiKey;
    private string $baseUrl = 'https://onesignal.com/api/v1/notifications';

    public function __construct()
    {
        $this->appId  = config('services.onesignal.app_id', '');
        $this->apiKey = config('services.onesignal.api_key', '');
    }

    /**
     * Kirim push notification ke satu user berdasarkan user_id.
     */
    public function sendToUser(int $userId, string $title, string $body, array $data = []): void
    {
        if (!$this->appId || !$this->apiKey) return;

        $playerIds = DeviceToken::where('user_id', $userId)
            ->where('platform', 'web')
            ->pluck('token')
            ->toArray();

        if (empty($playerIds)) return;

        $this->send($playerIds, $title, $body, $data);
    }

    /**
     * Kirim push ke banyak user sekaligus.
     */
    public function sendToUsers(array $userIds, string $title, string $body, array $data = []): void
    {
        if (!$this->appId || !$this->apiKey || empty($userIds)) return;

        $playerIds = DeviceToken::whereIn('user_id', $userIds)
            ->where('platform', 'web')
            ->pluck('token')
            ->toArray();

        if (empty($playerIds)) return;

        $this->send($playerIds, $title, $body, $data);
    }

    private function send(array $playerIds, string $title, string $body, array $data = []): void
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . $this->apiKey,
                'Content-Type'  => 'application/json',
            ])->post($this->baseUrl, [
                'app_id'             => $this->appId,
                'include_player_ids' => $playerIds,
                'headings'           => ['en' => $title],
                'contents'           => ['en' => $body],
                'data'               => $data,
                'web_url'            => $data['url'] ?? null,
            ]);

            if (!$response->successful()) {
                Log::warning('OneSignal push failed', ['response' => $response->json()]);
            }
        } catch (\Exception $e) {
            Log::error('OneSignal push exception', ['message' => $e->getMessage()]);
        }
    }
}
