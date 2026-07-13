<?php

namespace App\Http\Controllers\Driver;

use App\Http\Controllers\Controller;
use App\Models\DriverProfile;
use App\Models\Order;
use App\Models\OrderHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DriverController extends Controller
{
    private function getProfile(Request $request): DriverProfile
    {
        $profile = DriverProfile::where('user_id', $request->user()->id)->first();
        if (!$profile) {
            abort(response()->json(['message' => 'Profil pengirim tidak ditemukan.'], 404));
        }
        return $profile;
    }

    public function profile(Request $request)
    {
        $profile = $this->getProfile($request);
        $user    = $request->user();
        return response()->json([
            'data' => array_merge($profile->toArray(), [
                'name'  => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ])
        ]);
    }

    public function updateProfile(Request $request)
    {
        $profile = $this->getProfile($request);
        $validator = Validator::make($request->all(), [
            'vehicle_type'  => 'sometimes|in:motor,mobil,pickup,sepeda',
            'vehicle_brand' => 'sometimes|nullable|string|max:100',
            'vehicle_plate' => 'sometimes|string|max:20',
            'vehicle_year'  => 'sometimes|nullable|integer|min:1990|max:2030',
            'sim_type'      => 'sometimes|nullable|in:A,B,C,A1,B1',
            'name'          => 'sometimes|string|max:255',
            'phone'         => 'sometimes|string|max:20',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $profile->update($request->only(['vehicle_type', 'vehicle_brand', 'vehicle_plate', 'vehicle_year', 'sim_type']));

        $user = $request->user();
        $user->update(array_filter($request->only(['name', 'phone'])));

        return response()->json(['message' => 'Profil berhasil diperbarui.', 'data' => $profile->fresh()]);
    }

    public function toggleAvailability(Request $request)
    {
        $profile = $this->getProfile($request);
        $profile->update(['is_available' => !$profile->is_available]);
        return response()->json([
            'message'      => $profile->is_available ? 'Anda sekarang Online.' : 'Anda sekarang Offline.',
            'is_available' => $profile->is_available,
        ]);
    }

    public function availableOrders(Request $request)
    {
        $orders = Order::where('status', 'processing')
            ->whereNull('driver_id')
            ->with(['items.product.primaryImage', 'address', 'umkmProfile:id,shop_name,logo,address,phone'])
            ->latest()
            ->get();
        return response()->json(['data' => $orders]);
    }

    public function activeOrders(Request $request)
    {
        $userId = $request->user()->id;
        $orders = Order::where('driver_id', $userId)
            ->whereNotIn('status', ['delivered', 'cancelled'])
            ->with(['items.product.primaryImage', 'address', 'customer.user'])
            ->latest()
            ->get();
        return response()->json(['data' => $orders]);
    }

    public function acceptOrder(Request $request, int $id)
    {
        $order = Order::whereNull('driver_id')
            ->where('status', 'processing')
            ->findOrFail($id);

        $order->update(['driver_id' => $request->user()->id]);

        OrderHistory::create([
            'order_id' => $order->id,
            'status'   => $order->status,
            'description' => 'Pesanan diterima pengirim.',
        ]);

        return response()->json(['message' => 'Pesanan berhasil diambil.', 'data' => $order->fresh(['items.product', 'address'])]);
    }

    public function updateOrderStatus(Request $request, int $id)
    {
        $userId = $request->user()->id;
        $order  = Order::where('driver_id', $userId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:shipped,delivered',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $allowed = [
            'processing' => 'shipped',
            'shipped'    => 'delivered',
        ];

        $newStatus = $request->status;
        if (!isset($allowed[$order->status]) || $allowed[$order->status] !== $newStatus) {
            return response()->json(['message' => 'Perubahan status tidak valid.'], 422);
        }

        $order->update(['status' => $newStatus]);
        OrderHistory::create([
            'order_id' => $order->id,
            'status'   => $newStatus,
            'description' => $newStatus === 'shipped' ? 'Barang sedang dalam pengiriman.' : 'Barang telah diantarkan ke tujuan.',
        ]);

        if ($newStatus === 'delivered') {
            $this->getProfile($request)->increment('total_deliveries');
        }

        return response()->json(['message' => 'Status diperbarui.', 'data' => $order->fresh()]);
    }

    public function orderHistory(Request $request)
    {
        $userId = $request->user()->id;
        $orders = Order::where('driver_id', $userId)
            ->whereIn('status', ['delivered', 'cancelled'])
            ->with(['items.product', 'address', 'customer.user'])
            ->latest()
            ->paginate(20);
        return response()->json(['data' => $orders]);
    }

    public function stats(Request $request)
    {
        $userId  = $request->user()->id;
        $profile = $this->getProfile($request);

        $total   = Order::where('driver_id', $userId)->where('status', 'delivered')->count();
        $active  = Order::where('driver_id', $userId)->whereNotIn('status', ['delivered', 'cancelled'])->count();
        $today   = Order::where('driver_id', $userId)
            ->where('status', 'delivered')
            ->whereDate('updated_at', today())
            ->count();
        $available = Order::where('status', 'processing')->whereNull('driver_id')->count();

        return response()->json([
            'data' => [
                'total_deliveries'    => $total,
                'active_deliveries'   => $active,
                'today_deliveries'    => $today,
                'available_orders'    => $available,
                'is_available'        => $profile->is_available,
                'rating'              => $profile->rating,
                'is_verified'         => $profile->is_verified,
            ]
        ]);
    }
}
