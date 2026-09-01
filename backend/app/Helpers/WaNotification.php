<?php

namespace App\Helpers;

use App\Jobs\SendWhatsappJob;

class WaNotification
{
    private static function fe(string $path = ''): string
    {
        return rtrim(config('app.frontend_url', env('FRONTEND_URL', '')), '/') . $path;
    }

    private static function dispatch(string $phone, string $message, int $priority = SendWhatsappJob::PRIORITY_P2, ?int $bumdesId = null): void
    {
        if (empty(trim($phone))) return;
        SendWhatsappJob::dispatch($phone, $message, $priority, $bumdesId);
    }

    // ─── P1: Kritis (delay 3 detik) ──────────────────────────────────────────

    // 1. Order masuk → Seller
    public static function orderMasukSeller(string $phone, string $sellerName, string $orderCode, int $total): void
    {
        $rp  = 'Rp ' . number_format($total, 0, ',', '.');
        $url = self::fe('/seller/pesanan');
        $msg = "Halo *{$sellerName}*,\n\n"
             . "Ada pesanan baru masuk! 🛒\n"
             . "Kode: *#{$orderCode}*\n"
             . "Total: *{$rp}*\n\n"
             . "Segera konfirmasi pesanan melalui dashboard:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P1);
    }

    // 2. Kurir di-assign → Kurir
    public static function kurirAssigned(string $phone, string $driverName, string $orderCode, int $orderId): void
    {
        $url = self::fe("/driver/pesanan/{$orderId}");
        $msg = "Halo *{$driverName}*,\n\n"
             . "Kamu mendapat tugas pengantaran baru! 🚚\n"
             . "Kode Pesanan: *#{$orderCode}*\n\n"
             . "Segera ambil pesanan dari toko:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P1);
    }

    // ─── P2: Penting (delay 8 detik) ─────────────────────────────────────────

    // 3. Pesanan dikonfirmasi → Buyer
    public static function pesananDikonfirmasi(string $phone, string $buyerName, string $orderCode, int $orderId): void
    {
        $url = self::fe("/pesanan/{$orderId}");
        $msg = "Halo *{$buyerName}*,\n\n"
             . "Pesananmu *#{$orderCode}* sudah dikonfirmasi penjual dan sedang disiapkan. ✅\n\n"
             . "Pantau status di sini:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P2);
    }

    // 4. Siap diambil (pickup) → Buyer
    public static function siapDiambil(string $phone, string $buyerName, string $orderCode, int $orderId, string $shopName): void
    {
        $url = self::fe("/pesanan/{$orderId}");
        $msg = "Halo *{$buyerName}*,\n\n"
             . "Pesananmu *#{$orderCode}* sudah siap diambil di *{$shopName}*! 🏪\n\n"
             . "Detail pesanan:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P2);
    }

    // 5. Ekspedisi dikirim → Buyer
    public static function dikirimEkspedisi(string $phone, string $buyerName, string $orderCode, int $orderId, string $trackingNumber): void
    {
        $url = self::fe("/pesanan/{$orderId}");
        $msg = "Halo *{$buyerName}*,\n\n"
             . "Pesananmu *#{$orderCode}* sudah dikirim via ekspedisi! 📦\n"
             . "No. Resi: *{$trackingNumber}*\n\n"
             . "Cek status:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P2);
    }

    // 6. Kurir OTW antar → Buyer
    public static function kurirOtwAntar(string $phone, string $buyerName, string $orderCode, int $orderId, string $driverName): void
    {
        $url = self::fe("/pesanan/{$orderId}");
        $msg = "Halo *{$buyerName}*,\n\n"
             . "Pesananmu *#{$orderCode}* sedang dalam perjalanan ke alamatmu! 🚚\n"
             . "Kurir: *{$driverName}*\n\n"
             . "Pantau di sini:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P2);
    }

    // 7. Pesanan sampai → Buyer
    public static function pesananSampai(string $phone, string $buyerName, string $orderCode, int $orderId): void
    {
        $url = self::fe("/pesanan/{$orderId}");
        $msg = "Halo *{$buyerName}*,\n\n"
             . "Pesananmu *#{$orderCode}* sudah sampai! 🎉\n\n"
             . "Jangan lupa konfirmasi penerimaan dan beri ulasan ya.\n\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P2);
    }

    // 8. Bukti bayar diunggah → Seller
    public static function buktiBayarDiunggahSeller(string $phone, string $sellerName, string $orderCode, int $total): void
    {
        $rp  = 'Rp ' . number_format($total, 0, ',', '.');
        $url = self::fe('/seller/pesanan');
        $msg = "Halo *{$sellerName}*,\n\n"
             . "Pembeli telah mengunggah bukti transfer untuk pesanan *#{$orderCode}* ({$rp}). 📸\n\n"
             . "Periksa dan verifikasi pembayaran:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P2);
    }

    // 9. Bukti bayar ditolak → Buyer
    public static function buktiBayarDitolakBuyer(string $phone, string $buyerName, string $orderCode, int $orderId, string $reason): void
    {
        $url = self::fe("/pesanan/{$orderId}");
        $msg = "Halo *{$buyerName}*,\n\n"
             . "Bukti transfer untuk pesanan *#{$orderCode}* ditolak penjual.\n"
             . "Alasan: _{$reason}_\n\n"
             . "Unggah ulang bukti yang valid:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P2);
    }

    // 10. Pesanan dibatalkan → Seller
    public static function pesananDibatalkanSeller(string $phone, string $sellerName, string $orderCode, int $orderId): void
    {
        $url = self::fe('/seller/pesanan');
        $msg = "Halo *{$sellerName}*,\n\n"
             . "Pesanan *#{$orderCode}* telah dibatalkan. ❌\n\n"
             . "Lihat detail di dashboard:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P2);
    }

    // 11. Pesanan dibatalkan → Buyer
    public static function pesananDibatalkanBuyer(string $phone, string $buyerName, string $orderCode, int $orderId): void
    {
        $url = self::fe("/pesanan/{$orderId}");
        $msg = "Halo *{$buyerName}*,\n\n"
             . "Pesananmu *#{$orderCode}* telah dibatalkan oleh penjual. ❌\n\n"
             . "Jika kamu sudah membayar, dana akan dikembalikan. Hubungi BUMDes untuk info lebih lanjut.\n\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P2);
    }

    // 12. Akun UMKM diverifikasi → UMKM owner
    public static function akUnVerifikasi(string $phone, string $shopName, string $bumdesName): void
    {
        $url = self::fe('/seller');
        $msg = "Halo *{$shopName}*,\n\n"
             . "Selamat! Toko kamu telah *diverifikasi* oleh *{$bumdesName}*. ✅\n\n"
             . "Kamu sudah bisa mulai berjualan. Masuk ke dashboard:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P2);
    }

    // 13. Akun UMKM ditolak → UMKM owner
    public static function akUnDitolak(string $phone, string $shopName, string $bumdesName, string $reason = ''): void
    {
        $url = self::fe('/seller/dokumen');
        $msg = "Halo *{$shopName}*,\n\n"
             . "Maaf, pendaftaran toko kamu *ditolak* oleh *{$bumdesName}*."
             . ($reason ? "\nAlasan: _{$reason}_" : '') . "\n\n"
             . "Silakan perbaiki dokumen dan ajukan ulang:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P2);
    }

    // ─── P3: Informasi (delay 15 detik) ──────────────────────────────────────

    // 14. Saldo siap dicairkan → UMKM / BUMDes
    public static function saldoSiapCair(string $phone, string $name, string $rp): void
    {
        $url = self::fe('/seller/saldo');
        $msg = "Halo *{$name}*,\n\n"
             . "Saldo sebesar *{$rp}* siap untuk dicairkan ke rekening kamu. 💰\n\n"
             . "Ajukan pencairan di sini:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P3);
    }

    // 15. Permintaan pencairan masuk → BUMDes admin
    public static function pencairanDiminta(string $phone, string $bumdesAdminName, string $shopName, string $rp, ?int $bumdesId = null): void
    {
        $url = self::fe('/bumdes/saldo');
        $msg = "Halo *{$bumdesAdminName}*,\n\n"
             . "*{$shopName}* mengajukan pencairan saldo *{$rp}*. 📋\n\n"
             . "Segera proses di dashboard BUMDes:\n"
             . "{$url}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P3, $bumdesId);
    }

    // 16. Broadcast BUMDes → penerima (via job dengan delay P3)
    public static function broadcast(string $phone, string $bumdesName, string $title, string $content, ?int $bumdesId = null): void
    {
        $msg = "*[{$bumdesName}]*\n\n"
             . "*{$title}*\n\n"
             . "{$content}\n\n"
             . "_BumDesMartNukita_";
        self::dispatch($phone, $msg, SendWhatsappJob::PRIORITY_P3, $bumdesId);
    }

    // 17. Custom (untuk keperluan khusus)
    public static function custom(string $phone, string $message, int $priority = SendWhatsappJob::PRIORITY_P2, ?int $bumdesId = null): void
    {
        self::dispatch($phone, $message, $priority, $bumdesId);
    }
}
