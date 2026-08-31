<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Controllers\WebhookController;
use App\Models\DriverProfile;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderHistory;
use App\Models\Shipment;
use Illuminate\Http\Request;

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

    private function deliveryMode(Order $order): string
    {
        if ($order->delivery_type === 'pickup') return 'pickup';
        if ($order->shipping_method && !str_starts_with($order->shipping_method, 'kurir-lokal')) {
            return 'ekspedisi';
        }
        return 'kurir_lokal';
    }

    public function count(Request $request)
    {
        $umkm = $this->getUmkm($request);

        $activeStatuses = ['pending', 'confirmed', 'ready_for_pickup', 'picking_up', 'shipped'];

        $count = Order::where('umkm_profile_id', $umkm->id)
            ->whereIn('status', $activeStatuses)
            ->where(function ($q) {
                $q->whereDoesntHave('payment', function ($pq) {
                    $pq->where('payment_type', 'manual_umkm')
                       ->where('status', '!=', 'paid')
                       ->whereNull('proof_of_payment');
                });
            })
            ->count();

        return response()->json(['count' => $count]);
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
            'shipment:id,order_id,tracking_number,status',
            'payment',
        ])->where('umkm_profile_id', $umkm->id);

        // Jangan tampilkan pesanan manual UMKM yang belum bayar dan belum upload bukti transfer
        // KECUALI jika status pesanan sudah dibatalkan (cancelled) atau status lainnya
        $query->where(function ($q) {
            $q->where('status', 'cancelled')
              ->orWhereDoesntHave('payment', function ($pq) {
                  $pq->where('payment_type', 'manual_umkm')
                     ->where('status', '!=', 'paid')
                     ->whereNull('proof_of_payment');
              });
        });

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
            'payment',
            'shipment:id,order_id,tracking_number,status,shipped_at',
            'histories' => fn($q) => $q->latest(),
        ])->where('umkm_profile_id', $umkm->id)->findOrFail($id);

        return response()->json(['data' => $order]);
    }

    public function verifyPayment(Request $request, $id)
    {
        $umkm  = $this->getUmkm($request);
        $order = Order::with(['payment', 'customer.user'])->where('umkm_profile_id', $umkm->id)->findOrFail($id);

        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'reason' => 'required_if:action,reject|nullable|string|max:255',
        ]);

        $payment = $order->payment;
        if (!$payment) {
            return response()->json(['message' => 'Data pembayaran tidak ditemukan.'], 404);
        }

        $buyerUserId = $order->customer?->user?->id;
        $buyerPhone  = $order->customer?->user?->phone;
        $buyerName   = $order->customer?->user?->name ?? 'Pelanggan';

        if ($validated['action'] === 'approve') {
            $payment->update([
                'status'           => 'paid',
                'paid_at'          => now(),
                'rejection_reason' => null,
            ]);

            if ($order->status === 'pending') {
                $order->update(['status' => 'confirmed']);
            }

            OrderHistory::create([
                'order_id'    => $order->id,
                'user_id'     => $request->user()->id,
                'status'      => $order->fresh()->status,
                'description' => 'Pembayaran langsung telah diverifikasi dan diterima oleh penjual.',
            ]);

            if ($buyerUserId) {
                Notification::send(
                    $buyerUserId,
                    '✅ Pembayaran Diterima Toko',
                    "Pembayaran untuk pesanan #{$order->order_code} telah diterima oleh penjual.",
                    'payment_approved',
                    'order',
                    $order->id
                );
            }

            if ($buyerPhone) {
                \App\Helpers\WaNotification::custom(
                    $buyerPhone,
                    "Halo {$buyerName},\n\nPembayaran untuk pesanan *#{$order->order_code}* telah diverifikasi dan DITERIMA oleh toko. Pesanan Anda akan segera disiapkan."
                );
            }

            return response()->json([
                'message' => 'Pembayaran berhasil diverifikasi.',
                'data'    => $order->fresh(['payment']),
            ]);
        } else {
            $reason = $validated['reason'] ?? 'Bukti pembayaran tidak sesuai atau dana belum masuk.';
            $payment->update([
                'status'           => 'pending',
                'proof_of_payment' => null,
                'rejection_reason' => $reason,
            ]);

            OrderHistory::create([
                'order_id'    => $order->id,
                'user_id'     => $request->user()->id,
                'status'      => $order->status,
                'description' => 'Bukti pembayaran ditolak oleh penjual: ' . $reason,
            ]);

            if ($buyerUserId) {
                Notification::send(
                    $buyerUserId,
                    '❌ Bukti Pembayaran Ditolak',
                    "Bukti pembayaran untuk pesanan #{$order->order_code} ditolak: {$reason}. Silakan unggah bukti baru.",
                    'payment_rejected',
                    'order',
                    $order->id
                );
            }

            if ($buyerPhone) {
                \App\Helpers\WaNotification::custom(
                    $buyerPhone,
                    "Halo {$buyerName},\n\nMohon maaf, bukti pembayaran untuk pesanan *#{$order->order_code}* ditolak oleh penjual dengan alasan: *{$reason}*.\n\nSilakan cek detail pesanan Anda di website untuk mengunggah ulang bukti transfer."
                );
            }

            return response()->json([
                'message' => 'Bukti pembayaran ditolak.',
                'data'    => $order->fresh(['payment']),
            ]);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $umkm  = $this->getUmkm($request);
        $order = Order::where('umkm_profile_id', $umkm->id)->findOrFail($id);
        $mode  = $this->deliveryMode($order);

        // Transisi yang diizinkan per mode pengiriman
        $allowed = match($mode) {
            'pickup' => [
                'pending'          => ['confirmed', 'ready_for_pickup', 'cancelled'],
                'confirmed'        => ['ready_for_pickup', 'completed', 'cancelled'],
                'ready_for_pickup' => ['completed', 'cancelled'],
            ],
            'ekspedisi' => [
                'pending'   => ['confirmed', 'shipped', 'cancelled'],
                'confirmed' => ['shipped', 'cancelled'],
            ],
            default => [ // kurir_lokal — kurir yang handle setelah confirmed
                'pending'   => ['confirmed', 'cancelled'],
                'confirmed' => ['cancelled'],
            ],
        };

        $validNext = $allowed[$order->status] ?? [];

        $validated = $request->validate([
            'status'          => ['required', 'string', 'in:' . implode(',', array_merge(
                ['confirmed', 'cancelled', 'ready_for_pickup', 'completed', 'shipped']
            ))],
            'tracking_number' => 'required_if:status,shipped|nullable|string|max:100',
            'note'            => 'nullable|string|max:300',
        ]);

        $newStatus = $validated['status'];

        if (!in_array($newStatus, $validNext)) {
            return response()->json([
                'message' => "Tidak dapat mengubah status dari '{$order->status}' ke '{$newStatus}'.",
            ], 422);
        }

        $order->update(['status' => $newStatus]);

        // Pickup selesai diambil pembeli — langsung cairkan ke seller & BUMDes
        if ($newStatus === 'completed' && $mode === 'pickup') {
            app(WebhookController::class)->triggerDisbursement($order->fresh(['payment', 'umkmProfile.bumdesProfile']));
        }

        // Buat record Shipment saat ekspedisi di-shipped
        if ($newStatus === 'shipped' && $mode === 'ekspedisi') {
            Shipment::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'tracking_number' => $validated['tracking_number'],
                    'shipping_cost'   => $order->shipping_cost ?? 0,
                    'status'          => 'in_transit',
                    'shipped_at'      => now(),
                ]
            );
        }

        // Notifikasi ke pembeli
        $order->load('customer.user', 'umkmProfile');
        $buyerUserId = $order->customer?->user?->id;
        $buyerPhone  = $order->customer?->user?->phone;
        $buyerName   = $order->customer?->user?->name ?? 'Pelanggan';

        $buyerNotifs = [
            'confirmed'        => ['Pesanan Sedang Disiapkan',     "Pesanan #{$order->order_code} sedang disiapkan oleh penjual.", 'order'],
            'cancelled'        => ['Pesanan Dibatalkan',            "Pesanan #{$order->order_code} dibatalkan oleh penjual.", 'order'],
            'ready_for_pickup' => ['Pesanan Siap Diambil',          "Pesanan #{$order->order_code} siap diambil! Silakan datang ke toko.", 'order'],
            'shipped'          => ['Pesanan Telah Dikirim',         "Pesanan #{$order->order_code} telah dikirim via ekspedisi. Cek nomor resi di detail pesanan.", 'order'],
            'completed'        => ['Pesanan Selesai',               "Pesanan #{$order->order_code} telah selesai. Terima kasih!", 'order'],
        ];

        if ($buyerUserId && isset($buyerNotifs[$newStatus])) {
            [$title, $body, $type] = $buyerNotifs[$newStatus];
            Notification::send($buyerUserId, $title, $body, 'order_' . $newStatus, $type, $order->id);
        }

        // WA vital ke pembeli
        if ($buyerPhone) {
            $shopName = $order->umkmProfile?->shop_name ?? 'Toko';
            match($newStatus) {
                'confirmed'        => \App\Helpers\WaNotification::pesananDikonfirmasi($buyerPhone, $buyerName, $order->order_code, $order->id),
                'ready_for_pickup' => \App\Helpers\WaNotification::siapDiambil($buyerPhone, $buyerName, $order->order_code, $order->id, $shopName),
                'shipped'          => \App\Helpers\WaNotification::dikirimEkspedisi($buyerPhone, $buyerName, $order->order_code, $order->id, $validated['tracking_number'] ?? '-'),
                default            => null,
            };
        }

        // Notifikasi ke kurir yang available saat order kurir_lokal dikonfirmasi
        if ($newStatus === 'confirmed' && $mode === 'kurir_lokal') {
            $driverUserIds = DriverProfile::where('is_available', true)->pluck('user_id')->toArray();
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

        $descriptions = [
            'confirmed'        => 'Pesanan dikonfirmasi oleh penjual.',
            'cancelled'        => 'Pesanan dibatalkan oleh penjual.',
            'ready_for_pickup' => 'Pesanan siap diambil oleh pembeli.',
            'shipped'          => 'Pesanan dikirim via ekspedisi. No. resi: ' . ($validated['tracking_number'] ?? '-'),
            'completed'        => 'Pesanan selesai — pembeli telah mengambil barang.',
        ];

        OrderHistory::create([
            'order_id'    => $order->id,
            'user_id'     => $request->user()->id,
            'status'      => $newStatus,
            'description' => $validated['note'] ?? ($descriptions[$newStatus] ?? "Status diubah ke {$newStatus}."),
        ]);

        return response()->json([
            'message' => 'Status pesanan berhasil diperbarui.',
            'data'    => $order->fresh(['shipment']),
        ]);
    }
}
