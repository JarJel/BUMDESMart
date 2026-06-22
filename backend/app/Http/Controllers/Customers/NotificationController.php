<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Notification;
use Exception;

class NotificationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat mengakses notifikasi.'
            ], 403);
        }

        $customerId = $user->customer->id;

        try {
            $count = Notification::where('customer_id', $customerId)->count();

            if ($count === 0) {
                // Auto-seed mock premium notifications
                Notification::create([
                    'customer_id' => $customerId,
                    'title' => 'Pembayaran Terkonfirmasi',
                    'content' => 'Pembayaran untuk pesanan #ORD-20260620001 Anda sebesar Rp 145.000 telah terkonfirmasi. Penjual sedang memproses pesanan Anda.',
                    'type' => 'order',
                    'is_read' => false,
                ]);

                Notification::create([
                    'customer_id' => $customerId,
                    'title' => 'Produk Wishlist Tersedia Kembali!',
                    'content' => 'Kabar gembira! Produk \'Keripik Tempe Rejeki\' yang ada di wishlist Anda kini sudah ready stock kembali. Yuk checkout sekarang sebelum kehabisan!',
                    'type' => 'promo',
                    'is_read' => false,
                ]);

                Notification::create([
                    'customer_id' => $customerId,
                    'title' => 'Pembaruan Profil BUMDESMart',
                    'content' => 'Selamat datang di platform BUMDESMart versi terbaru. Anda sekarang dapat menambahkan alamat pengiriman kustom, mengunggah foto profil, dan melihat riwayat belanja langsung dari halaman pengaturan.',
                    'type' => 'info',
                    'is_read' => true,
                ]);
            }

            $notifications = Notification::where('customer_id', $customerId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $notifications
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil notifikasi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat mengubah status notifikasi.'
            ], 403);
        }

        try {
            $notification = Notification::where('id', $id)
                ->where('customer_id', $user->customer->id)
                ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notifikasi tidak ditemukan.'
                ], 404);
            }

            $notification->update(['is_read' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Notifikasi ditandai sebagai terbaca.',
                'data' => $notification
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui notifikasi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all notifications of the customer as read.
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat mengubah status notifikasi.'
            ], 403);
        }

        try {
            Notification::where('customer_id', $user->customer->id)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Semua notifikasi ditandai sebagai terbaca.'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui semua notifikasi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat menghapus notifikasi.'
            ], 403);
        }

        try {
            $notification = Notification::where('id', $id)
                ->where('customer_id', $user->customer->id)
                ->first();

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notifikasi tidak ditemukan.'
                ], 404);
            }

            $notification->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notifikasi berhasil dihapus.'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus notifikasi: ' . $e->getMessage()
            ], 500);
        }
    }
}
