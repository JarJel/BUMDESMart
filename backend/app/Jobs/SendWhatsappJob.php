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
    public int $timeout = 60;

    // Prioritas pesan: P1 kritis, P2 penting, P3 informasi
    const PRIORITY_P1 = 1; // order masuk, kurir assigned
    const PRIORITY_P2 = 2; // konfirmasi, pembatalan, verifikasi
    const PRIORITY_P3 = 3; // broadcast, saldo, pencairan

    // Delay antar pesan sesuai prioritas (detik)
    private const DELAY_SECONDS = [
        self::PRIORITY_P1 => 3,
        self::PRIORITY_P2 => 8,
        self::PRIORITY_P3 => 15,
    ];

    // Maks pesan per nomor per jam (anti-spam ke 1 orang)
    private const MAX_PER_PHONE_PER_HOUR = 5;

    // Maks broadcast (P3) per hari per bumdes
    private const MAX_BROADCAST_PER_DAY = 200;

    // Jam operasional WIB — di luar jam ini pesan ditunda
    private const SEND_HOUR_START = 7;
    private const SEND_HOUR_END   = 22;

    public function __construct(
        public readonly string $phone,
        public readonly string $message,
        public readonly int    $priority = self::PRIORITY_P2,
        public readonly ?int   $bumdesId = null, // wajib diisi untuk broadcast P3
    ) {}

    public function handle(): void
    {
        // P1 tidak dibatasi jam — kirim kapanpun (notif kritis)
        if ($this->priority !== self::PRIORITY_P1) {
            $hour = (int) now('Asia/Jakarta')->format('G');
            if ($hour < self::SEND_HOUR_START || $hour >= self::SEND_HOUR_END) {
                $nextSend = now('Asia/Jakarta')->setTime(self::SEND_HOUR_START, 0);
                if ($hour >= self::SEND_HOUR_END) {
                    $nextSend->addDay();
                }
                $this->release($nextSend->diffInSeconds(now()));
                return;
            }
        }

        // Rate limit per nomor: maks 5 pesan/jam ke nomor yang sama
        $phoneKey   = 'wa_phone_' . preg_replace('/\D/', '', $this->phone) . '_' . now('Asia/Jakarta')->format('YmdH');
        $phoneCount = (int) Cache::get($phoneKey, 0);
        if ($phoneCount >= self::MAX_PER_PHONE_PER_HOUR) {
            // P1 tetap dikirim walau limit tercapai (darurat)
            if ($this->priority !== self::PRIORITY_P1) {
                Log::info("SendWhatsappJob: skip {$this->phone} — limit {$phoneCount}/jam tercapai (P{$this->priority})");
                return;
            }
        }
        Cache::put($phoneKey, $phoneCount + 1, 3600);

        // Rate limit broadcast P3 per bumdes per hari
        if ($this->priority === self::PRIORITY_P3 && $this->bumdesId) {
            $broadcastKey   = 'wa_broadcast_' . $this->bumdesId . '_' . now('Asia/Jakarta')->format('Ymd');
            $broadcastCount = (int) Cache::get($broadcastKey, 0);
            if ($broadcastCount >= self::MAX_BROADCAST_PER_DAY) {
                Log::warning("SendWhatsappJob: broadcast BUMDes #{$this->bumdesId} sudah {$broadcastCount}/hari, dilewati.");
                return;
            }
            Cache::put($broadcastKey, $broadcastCount + 1, 86400);
        }

        // Delay sesuai prioritas
        $delaySec = self::DELAY_SECONDS[$this->priority] ?? 8;
        // Tambah jitter kecil agar tidak terlihat terlalu robotic
        $jitter   = random_int(0, (int) ($delaySec * 0.4));
        sleep($delaySec + $jitter);

        $driver = config('services.whatsapp_driver', 'fonnte');
        $result = $driver === 'openwa'
            ? OpenWAService::send($this->phone, $this->message)
            : WhatsappService::send($this->phone, $this->message);

        if (!($result['status'] ?? false)) {
            Log::warning("SendWhatsappJob: gagal kirim ke {$this->phone} (P{$this->priority}) — " . ($result['error'] ?? 'unknown'));
        }
    }

    public function backoff(): array
    {
        return [60, 180, 600];
    }

    public function failed(\Throwable $e): void
    {
        Log::error("SendWhatsappJob gagal permanen ke {$this->phone} (P{$this->priority}): " . $e->getMessage());
    }
}
