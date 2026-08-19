<?php

namespace App\Jobs;

use App\Services\OpenWAService;
use App\Services\WhatsappService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendWhatsappJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 2;
    public int $timeout = 30;

    public function __construct(
        public readonly string $phone,
        public readonly string $message,
    ) {}

    public function handle(): void
    {
        // Delay acak 1-3 detik antar pesan agar tidak dianggap spam
        usleep(random_int(1_000_000, 3_000_000));

        $driver = config('services.whatsapp_driver', 'fonnte');

        if ($driver === 'openwa') {
            OpenWAService::send($this->phone, $this->message);
        } else {
            WhatsappService::send($this->phone, $this->message);
        }
    }

    public function failed(\Throwable $e): void
    {
        Log::error("SendWhatsappJob gagal ke {$this->phone}: " . $e->getMessage());
    }
}
