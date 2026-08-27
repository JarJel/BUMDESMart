<?php

namespace App\Helpers;

use App\Jobs\SendWhatsappJob;

class WaNotification
{
    private static function fe(string $path = ''): string
    {
        return rtrim(config('app.frontend_url', env('FRONTEND_URL', '')), '/') . $path;
    }

    private static function dispatch(string $phone, string $message): void
    {
        if (empty(trim($phone))) return;
        SendWhatsappJob::dispatch($phone, $message);
    }

    // ─── 1. Order masuk → Seller ─────────────────────────────────────────────
    public static function orderMasukSeller(string $phone, string $sellerName, string $orderCode, int $total): void
    {
        $rp  = 'Rp ' . number_format($total, 0, ',', '.');
        $url = self::fe('/seller/pesanan');
        $msg = "Halo *{$sellerName}*,\n\n"
             . "Ada pesanan baru masuk! 🛒\n"
             . "Kode: *#{$orderCode}*\n"
             . "Total: *{$rp}*\n\n"
             . "Segera konfirmasi pesanan melalui dashboard seller:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg);
    }

    // ─── 2. Pesanan dikonfirmasi → Customer ──────────────────────────────────
    public static function pesananDikonfirmasi(string $phone, string $buyerName, string $orderCode, int $orderId): void
    {
        $url = self::fe("/pesanan/{$orderId}");
        $msg = "Halo *{$buyerName}*,\n\n"
             . "Pesananmu *#{$orderCode}* sudah dikonfirmasi oleh penjual dan sedang disiapkan. ✅\n\n"
             . "Pantau status pesanan di sini:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg);
    }

    // ─── 3. Siap diambil (pickup) → Customer ─────────────────────────────────
    public static function siapDiambil(string $phone, string $buyerName, string $orderCode, int $orderId, string $shopName): void
    {
        $url = self::fe("/pesanan/{$orderId}");
        $msg = "Halo *{$buyerName}*,\n\n"
             . "Pesananmu *#{$orderCode}* sudah siap diambil di *{$shopName}*! 🏪\n\n"
             . "Silakan datang ke toko dan tunjukkan kode pesanan ini.\n\n"
             . "Detail pesanan:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg);
    }

    // ─── 4. Ekspedisi dikirim → Customer ─────────────────────────────────────
    public static function dikirimEkspedisi(string $phone, string $buyerName, string $orderCode, int $orderId, string $trackingNumber): void
    {
        $url = self::fe("/pesanan/{$orderId}");
        $msg = "Halo *{$buyerName}*,\n\n"
             . "Pesananmu *#{$orderCode}* sudah dikirim via ekspedisi! 📦\n"
             . "No. Resi: *{$trackingNumber}*\n\n"
             . "Cek status pengiriman:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg);
    }

    // ─── 5. Kurir OTW antar → Customer ───────────────────────────────────────
    public static function kurirOtwAntar(string $phone, string $buyerName, string $orderCode, int $orderId, string $driverName): void
    {
        $url = self::fe("/pesanan/{$orderId}");
        $msg = "Halo *{$buyerName}*,\n\n"
             . "Pesananmu *#{$orderCode}* sedang dalam perjalanan ke alamatmu! 🚚\n"
             . "Kurir: *{$driverName}*\n\n"
             . "Siap-siap menerima ya. Pantau di sini:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg);
    }

    // ─── 6. Pesanan sampai → Customer ────────────────────────────────────────
    public static function pesananSampai(string $phone, string $buyerName, string $orderCode, int $orderId): void
    {
        $url = self::fe("/pesanan/{$orderId}");
        $msg = "Halo *{$buyerName}*,\n\n"
             . "Pesananmu *#{$orderCode}* sudah sampai! 🎉\n\n"
             . "Jangan lupa konfirmasi penerimaan dan beri ulasan untuk penjual ya.\n\n"
             . "Buka pesanan:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg);
    }
}
