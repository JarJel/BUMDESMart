<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SentryWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('sentry-hook-signature');
        $resource = $request->header('sentry-hook-resource');

        Log::info('Sentry webhook received.', ['resource' => $resource]);

        // Verifikasi Signature HMAC SHA256 (jika dikonfigurasi)
        $secret = config('services.sentry.webhook_secret');
        if (!empty($secret)) {
            $expectedSignature = hash_hmac('sha256', $payload, $secret);
            if (!hash_equals($expectedSignature, (string)$signature)) {
                Log::error('Sentry webhook signature mismatch.', [
                    'expected' => $expectedSignature,
                    'received' => $signature
                ]);
                return response()->json(['message' => 'Unauthorized'], 401);
            }
        }

        // Hanya proses resource 'event_alert' sesuai permintaan
        if ($resource !== 'event_alert') {
            Log::info('Sentry webhook ignored non-event_alert resource.', ['resource' => $resource]);
            return response()->json(['message' => 'Ignored'], 200);
        }

        $data = json_decode($payload, true) ?? [];
        
        // Extract data dengan fallback
        $eventData = $data['data']['event'] ?? [];
        
        $title = $eventData['title'] ?? $data['message'] ?? 'Unknown Error';
        $culprit = $eventData['culprit'] ?? 'Unknown Culprit';
        $level = $eventData['level'] ?? 'error';
        $environment = $eventData['environment'] ?? 'production';
        $projectSlug = $data['data']['project'] ?? $eventData['project'] ?? 'BumDesMartNukita';
        $url = $eventData['web_url'] ?? $data['url'] ?? '';

        // Emoji mapping
        $emoji = match (strtolower($level)) {
            'fatal' => '🔥',
            'error' => '🚨',
            'warning' => '⚠️',
            'info' => 'ℹ️',
            default => '🐛',
        };

        $text = "{$emoji} *Sentry Alert: {$projectSlug}*\n\n";
        $text .= "*Level:* `{$level}`\n";
        $text .= "*Environment:* `{$environment}`\n";
        $text .= "*Title:* {$title}\n";
        
        if ($culprit !== 'Unknown Culprit' && !empty($culprit)) {
            $text .= "*Culprit:* `{$culprit}`\n";
        }
        
        if (!empty($url)) {
            $text .= "\n*URL:* [View Issue in Sentry]({$url})";
        }

        $botToken = config('services.telegram.bot_token');
        $chatId = config('services.telegram.chat_id');

        if (empty($botToken) || empty($chatId)) {
            Log::error('Telegram bot token or chat ID is missing in config.');
            return response()->json(['message' => 'Telegram config missing'], 500);
        }

        // Kirim ke Telegram
        $response = Http::post("https://api.telegram.org/bot{$botToken}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'Markdown',
            'disable_web_page_preview' => true,
        ]);

        if ($response->successful()) {
            Log::info('Sentry alert successfully sent to Telegram.');
        } else {
            Log::error('Failed to send Sentry alert to Telegram.', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
        }

        return response()->json(['message' => 'ok']);
    }
}
