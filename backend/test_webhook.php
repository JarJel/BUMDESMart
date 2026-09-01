<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$secret = config('services.sentry.webhook_secret');
$payload = json_encode([
    'action' => 'triggered',
    'data' => [
        'event' => [
            'title' => 'Tada! Pesan Pertama dari SentryWebhookController!',
            'level' => 'fatal',
            'environment' => 'local',
            'project' => 'BumDesMartNukita',
            'culprit' => 'Testing dari Script PHP'
        ]
    ]
]);
$signature = hash_hmac('sha256', $payload, $secret);

$ch = curl_init('http://localhost:8000/api/v1/webhooks/sentry');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'sentry-hook-resource: event_alert',
    'sentry-hook-signature: ' . $signature
]);
$response = curl_exec($ch
curl_close($ch);
echo "RESPONSE:\n";
echo $response;
