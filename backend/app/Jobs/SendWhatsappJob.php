<?php

namespace App\Jobs;

use App\Services\OpenWAService;
use App\Services\WhatsappService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SendWhatsappJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 45;

    // Batas maksimal pesan per jam (per seluruh aplikasi)
    private const MAX_PER_HOUR = 30;

    // Jam operasional kirim pesan (07:00 – 22:00 WIB)
    private const SEND_HOUR_START = 7;
    private const SEND_HOUR_END   = 22;

    public function __construct(
        public readonly string $phone,
        public readonly string $message,
    ) {}

    public function handle(): void
    {
        // Tunda pengiriman ke jam operasional jika di luar waktu
        $hour = (int) now('Asia/Jakarta')->format('G');
        if ($hour < self::SEND_HOUR_START || $hour >= self::SEND_HOUR_END) {
            $nextSend = now('Asia/Jakarta')->setTime(self::SEND_HOUR_START, 0);
            if ($hour >= self::SEND_HOUR_END) {
                $nextSend->addDay();
            }
            $this->release($nextSend->diffInSeconds(now()));
            return;
        }

        // Rate limiter: max MAX_PER_HOUR pesan per jam
        $key   = 'wa_send_count_' . now('Asia/Jakarta')->format('YmdH');
        $count = (int) Cache::get($key, 0);
        if ($count >= self::MAX_PER_HOUR) {
            // Tunda 5 menit dan coba lagi
            $this->release(300);
            return;
        }
        Cache::put($key, $count + 1, 3600);

        // Delay random 5–12 detik antar pesan (aman untuk OpenWA maupun Fonnte)
        usleep(random_int(5_000_000, 12_000_000));

        $driver = config('services.whatsapp_driver', 'fonnte');
        $result = $driver === 'openwa'
            ? OpenWAService::send($this->phone, $this->message)
            : WhatsappService::send($this->phone, $this->message);

        if (!($result['status'] ?? false)) {
            Log::warning("SendWhatsappJob: gagal kirim ke {$this->phone} — " . ($result['error'] ?? 'unknown'));
        }
    }

    public function backoff(): array
    {
        // Exponential backoff: retry ke-1 tunggu 60 detik, ke-2 tunggu 180 detik
        return [60, 180];
    }

    public function failed(\Throwable $e): void
    {
        Log::error("SendWhatsappJob gagal permanen ke {$this->phone}: " . $e->getMessage());
    }
}
