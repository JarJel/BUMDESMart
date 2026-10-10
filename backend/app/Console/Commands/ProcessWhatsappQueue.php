<?php

namespace App\Console\Commands;

use App\Models\WhatsappLog;
use App\Models\WhatsappQueue;
use App\Services\OpenWAService;
use Illuminate\Console\Command;

class ProcessWhatsappQueue extends Command
{
    protected $signature   = 'whatsapp:process-queue';
    protected $description = 'Proses antrian pengiriman WhatsApp';

    public function handle(): void
    {
        $items = WhatsappQueue::query()
            ->whereIn('status', ['pending', 'retrying'])
            ->where(fn ($q) => $q->whereNull('next_retry_at')->orWhere('next_retry_at', '<=', now()))
            ->orderBy('created_at')
            ->limit(20)
            ->get();

        if ($items->isEmpty()) {
            return;
        }

        foreach ($items as $index => $item) {
            // Delay 3-6 detik per pesan (+ jitter) untuk cegah pemblokiran spam oleh WhatsApp
            if ($index > 0) {
                $delay = random_int(3, 6);
                sleep($delay);
            }

            $item->update(['status' => 'processing']);

            $result  = OpenWAService::send($item->phone, $item->message);
            $attempt = $item->attempt + 1;
            $isSent  = (bool) ($result['status'] ?? false);

            WhatsappLog::create([
                'queue_id'    => $item->id,
                'attempt'     => $attempt,
                'status'      => $isSent ? 'sent' : 'failed',
                'error'       => $isSent ? null : ($result['error'] ?? 'Unknown error'),
                'executed_at' => now(),
            ]);

            if ($isSent) {
                $item->update([
                    'status'  => 'sent',
                    'attempt' => $attempt,
                    'sent_at' => now(),
                ]);
            } elseif ($attempt >= $item->max_attempts) {
                $item->update([
                    'status'     => 'failed',
                    'attempt'    => $attempt,
                    'last_error' => $result['error'] ?? 'Unknown error',
                ]);
            } else {
                $item->update([
                    'status'        => 'retrying',
                    'attempt'       => $attempt,
                    'last_error'    => $result['error'] ?? 'Unknown error',
                    'next_retry_at' => now()->addSeconds($item->retry_delay),
                ]);
            }
        }
    }
}
