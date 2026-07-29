<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsappService
{
    /**
     * Send WhatsApp message via Fonnte.
     *
     * @param string $target
     * @param string $message
     * @return array
     */
    public static function send(string $target, string $message): array
    {
        if (empty($target)) {
            return [
                'status' => false,
                'error' => 'Target phone number is empty.'
            ];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => config('services.fonnte.token'),
            ])->withoutVerifying()->post(config('services.fonnte.endpoint'), [
                'target' => $target,
                'message' => $message,
                'countryCode' => '62',
            ]);

            $responseData = $response->json();

            if ($response->successful() && ($responseData['status'] ?? false) === true) {
                return [
                    'status' => true,
                    'data' => $responseData
                ];
            }

            Log::error('Fonnte send error: ' . ($responseData['reason'] ?? $response->body() ?? 'Unknown error'));

            return [
                'status' => false,
                'error' => $responseData['reason'] ?? $response->body() ?? 'Failed to send message.'
            ];
        } catch (\Exception $e) {
            Log::error('Fonnte connection exception: ' . $e->getMessage());
            return [
                'status' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
