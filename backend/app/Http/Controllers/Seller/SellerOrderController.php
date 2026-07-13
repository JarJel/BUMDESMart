<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
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

        // Transisi yang diizinkan untuk seller (shipped ditangani driver)
        $allowed = [
            'pending'   => ['confirmed', 'cancelled'],
            'confirmed' => ['processing', 'cancelled'],
        ];

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['confirmed', 'processing', 'cancelled'])],
            'note'   => 'nullable|string|max:300',
        ]);

        $newStatus    = $validated['status'];
        $canTransition = in_array($newStatus, $allowed[$order->status] ?? []);

        if (!$canTransition) {
            return response()->json([
                'message' => "Tidak dapat mengubah status dari '{$order->status}' ke '{$newStatus}'.",
            ], 422);
        }

        $order->update(['status' => $newStatus]);

        $descriptions = [
            'confirmed'  => 'Pesanan dikonfirmasi oleh penjual.',
            'processing' => 'Pesanan sedang diproses/dikemas.',
            'shipped'    => 'Pesanan telah dikirim.',
            'cancelled'  => 'Pesanan dibatalkan oleh penjual.',
        ];

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
