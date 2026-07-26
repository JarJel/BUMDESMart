<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\DriverProfile;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderHistory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SellerOrderController extends Controller
{
    private function getUmkm(Request $request)
    {
        $umkm = $request->user()->umkmProfile;
        if (!$umkm || $umkm->status !== 'active') {
            abort(response()->json(['message' => 'Profil UMKM tidak ditemukan atau belum aktif.'], 403));
        }
        return $umkm;
    }

    public function index(Request $request)
    {
        $umkm = $this->getUmkm($request);

        $query = Order::with([
            'items.product:id,name,slug',
            'items.variantOption:id,value',
            'customer.user:id,name,email,phone',
            'address:id,label,address,city,province,postal_code,recipient_name,phone',
            'driver:id,name,phone',
        ])->where('umkm_profile_id', $umkm->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('order_code', 'like', '%' . $request->search . '%');
        }

        $orders = $query->latest()->paginate(15);

        return response()->json(['data' => $orders]);
    }

    public function show(Request $request, $id)
    {
        $umkm = $this->getUmkm($request);

        $order = Order::with([
            'items.product:id,name,slug,weight',
            'items.variantOption:id,value',
            'customer.user:id,name,email,phone',
            'address',
            'histories' => fn($q) => $q->latest(),
        ])->where('umkm_profile_id', $umkm->id)->findOrFail($id);

        return response()->json(['data' => $order]);
    }

    public function updateStatus(Request $request, $id)
    {
        $umkm  = $this->getUmkm($request);
        $order = Order::where('umkm_profile_id', $umkm->id)->findOrFail($id);

        // Seller hanya bisa konfirmasi atau batalkan (kurir yang handle sisanya)
        $allowed = [
            'pending' => ['confirmed', 'cancelled'],
        ];

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['confirmed', 'cancelled'])],
            'note'   => 'nullable|string|max:300',
        ]);

        $newStatus    = $validated['status'];
        $canTransition = in_array($newStatus, $allowed[$order->status] ?? []);

        if (!$canTransition) {
            return response()->json([
                'message' => "Tidak dapat mengubah status dari '{$order->status}' ke '{$newStatus}'.",
            ], 422);
        }

        // Self-pickup: saat seller confirm, langsung selesai tanpa perlu kurir
        $isPickup = $order->delivery_type === 'pickup';
        $finalStatus = ($newStatus === 'confirmed' && $isPickup) ? 'delivered' : $newStatus;

        $order->update(['status' => $finalStatus]);

        $order->load('customer.user');
        $buyerUserId = $order->customer?->user?->id;
        if ($buyerUserId) {
            if ($finalStatus === 'delivered') {
                Notification::send(
                    $buyerUserId,
                    '✅ Pesanan Siap Diambil!',
                    "Pesanan #{$order->order_code} sudah siap. Silakan ambil di toko.",
                    'order_delivered', 'order', $order->id
                );
            } elseif ($finalStatus === 'cancelled') {
                Notification::send(
                    $buyerUserId,
                    'Pesanan Dibatalkan',
                    "Pesanan #{$order->order_code} dibatalkan oleh penjual.",
                    'order_cancelled', 'order', $order->id
                );
            } elseif ($finalStatus === 'confirmed') {
                Notification::send(
                    $buyerUserId,
                    'Pesanan Sedang Disiapkan',
                    "Pesanan #{$order->order_code} sedang disiapkan oleh penjual.",
                    'order_confirmed', 'order', $order->id
                );
            }
        }

        $descriptions = [
            'confirmed'  => 'Pesanan dikonfirmasi oleh penjual.',
            'delivered'  => 'Pesanan siap diambil oleh pembeli (ambil sendiri).',
            'cancelled'  => 'Pesanan dibatalkan oleh penjual.',
        ];

        // Notifikasi ke kurir hanya untuk order yang perlu diantar (bukan pickup)
        if ($finalStatus === 'confirmed' && !$isPickup) {
            $driverUserIds = DriverProfile::where('is_available', true)
                ->pluck('user_id')
                ->toArray();
            foreach ($driverUserIds as $driverUserId) {
                Notification::send(
                    $driverUserId,
                    '📦 Ada Pesanan Baru!',
                    "Pesanan #{$order->order_code} siap diambil. Cek sekarang dan ambil pengirimannya.",
                    'order_new',
                    'order',
                    $order->id
                );
            }
        }

        OrderHistory::create([
            'order_id'    => $order->id,
            'user_id'     => $request->user()->id,
            'status'      => $newStatus,
            'description' => $validated['note'] ?? ($descriptions[$newStatus] ?? "Status diubah ke {$newStatus}."),
        ]);

        return response()->json([
            'message' => 'Status pesanan berhasil diperbarui.',
            'data'    => $order->fresh(),
        ]);
    }
}
