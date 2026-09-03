<?php

namespace App\Helpers;

use App\Models\FcmToken;
use App\Services\FcmService;

class PushNotification
{
    private static function sendToUser(int $userId, string $title, string $body, array $data = []): void
    {
        $tokens = FcmToken::where('user_id', $userId)->pluck('token')->toArray();
        if (empty($tokens)) return;
        FcmService::sendMulticast($tokens, $title, $body, $data);
    }

    // Order masuk → Seller
    public static function orderMasukSeller(int $userId, string $orderCode, int $total): void
    {
        self::sendToUser($userId,
            '🛒 Pesanan Baru Masuk',
            "Pesanan #{$orderCode} · Rp " . number_format($total, 0, ',', '.'),
            ['type' => 'order', 'code' => $orderCode]
        );
    }

    // Kurir di-assign → Kurir
    public static function kurirAssigned(int $userId, string $orderCode): void
    {
        self::sendToUser($userId,
            '🚚 Tugas Pengantaran Baru',
            "Pesanan #{$orderCode} menunggu pengambilan.",
            ['type' => 'delivery', 'code' => $orderCode]
        );
    }

    // Status pesanan berubah → Buyer
    public static function statusPesanan(int $userId, string $orderCode, string $status): void
    {
        $labels = [
            'confirmed'  => ['✅ Pesanan Dikonfirmasi', "Pesanan #{$orderCode} sedang disiapkan."],
            'shipped'    => ['📦 Pesanan Dikirim', "Pesanan #{$orderCode} sedang dalam perjalanan."],
            'delivered'  => ['🎉 Pesanan Tiba', "Pesanan #{$orderCode} sudah sampai!"],
            'cancelled'  => ['❌ Pesanan Dibatalkan', "Pesanan #{$orderCode} telah dibatalkan."],
        ];
        [$title, $body] = $labels[$status] ?? ["Update Pesanan", "Status #{$orderCode} berubah."];
        self::sendToUser($userId, $title, $body, ['type' => 'order', 'code' => $orderCode]);
    }

    // Broadcast pengumuman → list user
    public static function broadcast(array $userIds, string $bumdesName, string $title): void
    {
        foreach ($userIds as $userId) {
            self::sendToUser($userId,
                "📢 {$bumdesName}",
                $title,
                ['type' => 'broadcast']
            );
        }
    }

    // Verifikasi UMKM
    public static function verifikasiUmkm(int $userId, string $shopName, bool $approved, string $reason = ''): void
    {
        if ($approved) {
            self::sendToUser($userId, '✅ Toko Diverifikasi', "{$shopName} sudah bisa berjualan!", ['type' => 'verification']);
        } else {
            self::sendToUser($userId, '❌ Verifikasi Ditolak', $reason ?: "{$shopName} perlu perbaikan dokumen.", ['type' => 'verification']);
        }
    }

    // Custom
    public static function custom(int $userId, string $title, string $body, array $data = []): void
    {
        self::sendToUser($userId, $title, $body, $data);
    }
}
