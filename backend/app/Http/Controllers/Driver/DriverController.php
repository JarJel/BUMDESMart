<?php

namespace App\Http\Controllers\Driver;

use App\Http\Controllers\Controller;
use App\Http\Controllers\WebhookController;
use App\Models\DeviceToken;
use App\Models\DriverProfile;
use App\Models\Order;
use App\Models\OrderHistory;
use App\Models\UmkmBalance;
use App\Helpers\HaversineHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DriverController extends Controller
{
    private const VEHICLE_CAPACITY = [
        'motor'       => 10_000,
        'mobil'       => 50_000,
        'pickup_box'  => 200_000,
        'pickup_bak'  => 500_000,
    ];

    private function getProfile(Request $request): DriverProfile
    {
        $profile = DriverProfile::where('user_id', $request->user()->id)->first();
        if (!$profile) {
            abort(response()->json(['message' => 'Profil pengirim tidak ditemukan.'], 404));
        }
        return $profile;
    }

    private function requireVerified(DriverProfile $profile): void
    {
        if (!$profile->is_verified) {
            abort(response()->json([
                'message'     => 'Akun kamu belum diverifikasi. Silakan tunggu konfirmasi admin BUMDes (1–2 hari kerja).',
                'is_verified' => false,
            ], 403));
        }
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
            'vehicle_type'        => 'sometimes|in:motor,mobil,pickup_box,pickup_bak',
            'vehicle_brand'       => 'sometimes|nullable|string|max:100',
            'vehicle_plate'       => 'sometimes|string|max:20',
            'vehicle_year'        => 'sometimes|nullable|integer|min:1990|max:2030',
            'sim_type'            => 'sometimes|nullable|in:A,B,C,A1,B1',
            'name'                => 'sometimes|string|max:255',
            'phone'               => 'sometimes|string|max:20',
            'bank_name'           => 'sometimes|nullable|string|max:100',
            'bank_account_number' => 'sometimes|nullable|string|max:50',
            'bank_account_name'   => 'sometimes|nullable|string|max:100',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $profile->update($request->only([
            'vehicle_type', 'vehicle_brand', 'vehicle_plate', 'vehicle_year', 'sim_type',
            'bank_name', 'bank_account_number', 'bank_account_name',
        ]));

        $request->user()->update(array_filter($request->only(['name', 'phone'])));

        return response()->json(['message' => 'Profil berhasil diperbarui.', 'data' => $profile->fresh()]);
    }

    public function toggleAvailability(Request $request)
    {
        $profile = $this->getProfile($request);
        $this->requireVerified($profile);

        $profile->update(['is_available' => !$profile->is_available]);
        return response()->json([
            'message'      => $profile->is_available ? 'Anda sekarang Online.' : 'Anda sekarang Offline.',
            'is_available' => $profile->is_available,
        ]);
    }

    public function registerDeviceToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token'     => 'required|string|max:500',
            'platform'  => 'required|in:android,ios,web',
            'device_id' => 'nullable|string|max:255',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DeviceToken::updateOrCreate(
            ['user_id' => $request->user()->id, 'device_id' => $request->device_id ?? $request->token],
            ['token' => $request->token, 'platform' => $request->platform, 'last_used_at' => now()]
        );

        return response()->json(['message' => 'Token terdaftar.']);
    }

    // Pesanan yang bisa diambil kurir: status confirmed, belum punya driver
    public function availableOrders(Request $request)
    {
        $profile     = $this->getProfile($request);
        $this->requireVerified($profile);

        $vehicleType = $profile->vehicle_type;
        $maxWeight   = self::VEHICLE_CAPACITY[$vehicleType] ?? 10_000;

        $orders = Order::where('status', 'confirmed')
            ->whereNull('driver_id')
            ->with([
                'items.product',
                'address',
                'umkmProfile:id,shop_name,logo,address,latitude,longitude,phone',
                'customer.user:id,name,phone',
            ])
            ->latest()
            ->get();

        $result = $orders->map(function (Order $order) use ($maxWeight) {
            $totalWeight = $order->items->sum(fn($i) => ($i->product?->weight ?? 0) * $i->quantity);
            if ($totalWeight > $maxWeight) return null;

            $umkm = $order->umkmProfile;
            $addr = $order->address;

            $distance = null;
            if ($umkm?->latitude && $umkm?->longitude && $addr?->latitude && $addr?->longitude) {
                $distance = round(HaversineHelper::distanceKm(
                    (float)$umkm->latitude, (float)$umkm->longitude,
                    (float)$addr->latitude,  (float)$addr->longitude,
                ), 1);
            }

            return array_merge($order->toArray(), [
                'total_weight_gram' => $totalWeight,
                'total_weight_kg'   => round($totalWeight / 1000, 2),
                'distance_km'       => $distance,
                'earning'           => (float) $order->shipping_cost,
                'pickup_from'       => [
                    'name'    => $umkm?->shop_name,
                    'address' => $umkm?->address,
                    'phone'   => $umkm?->phone,
                    'lat'     => $umkm?->latitude,
                    'lng'     => $umkm?->longitude,
                ],
                'deliver_to'        => [
                    'recipient_name' => $addr?->recipient_name,
                    'phone'          => $addr?->phone,
                    'label'          => $addr?->label ?? 'Rumah',
                    'address'        => $addr?->address,
                    'city'           => $addr?->city,
                    'province'       => $addr?->province,
                    'lat'            => $addr?->latitude,
                    'lng'            => $addr?->longitude,
                ],
            ]);
        })->filter()->values();

        return response()->json(['data' => $result]);
    }

    // Pesanan aktif milik kurir ini
    public function activeOrders(Request $request)
    {
        $userId = $request->user()->id;
        $orders = Order::where('driver_id', $userId)
            ->whereNotIn('status', ['delivered', 'cancelled'])
            ->with([
                'items.product.primaryImage',
                'address',
                'customer.user:id,name,phone',
                'umkmProfile:id,shop_name,address,phone,latitude,longitude',
            ])
            ->latest()
            ->get()
            ->map(function (Order $order) {
                $arr = $order->toArray();
                $umkm = $order->umkmProfile;
                $addr = $order->address;
                $arr['pickup_from'] = [
                    'name'    => $umkm?->shop_name,
                    'address' => $umkm?->address,
                    'phone'   => $umkm?->phone,
                ];
                $arr['deliver_to'] = [
                    'recipient_name' => $addr?->recipient_name,
                    'phone'          => $addr?->phone,
                    'address'        => $addr?->address,
                    'city'           => $addr?->city,
                ];
                $arr['earning'] = (float) $order->shipping_cost;
                return $arr;
            });

        return response()->json(['data' => $orders]);
    }

    // Kurir terima pesanan → status: picking_up (OTW ke toko)
    public function acceptOrder(Request $request, int $id)
    {
        $profile = $this->getProfile($request);
        $this->requireVerified($profile);

        // Maks 1 order aktif sekaligus
        $activeCount = Order::where('driver_id', $request->user()->id)
            ->whereNotIn('status', ['delivered', 'cancelled'])
            ->count();
        if ($activeCount >= 1) {
            return response()->json([
                'message' => 'Kamu masih punya pesanan aktif. Selesaikan dulu sebelum ambil yang baru.',
            ], 422);
        }

        $order = Order::whereNull('driver_id')
            ->where('status', 'confirmed')
            ->with('items.product')
            ->findOrFail($id);

        $totalWeight = $order->items->sum(fn($i) => ($i->product?->weight ?? 0) * $i->quantity);
        $maxWeight   = self::VEHICLE_CAPACITY[$profile->vehicle_type] ?? 10_000;
        if ($totalWeight > $maxWeight) {
            $maxKg   = round($maxWeight / 1000, 1);
            $totalKg = round($totalWeight / 1000, 2);
            return response()->json([
                'message' => "Order ini beratnya {$totalKg} kg, melebihi kapasitas kendaraanmu ({$maxKg} kg).",
            ], 422);
        }

        $order->update([
            'driver_id' => $request->user()->id,
            'status'    => 'picking_up',
        ]);

        OrderHistory::create([
            'order_id'    => $order->id,
            'user_id'     => $request->user()->id,
            'status'      => 'picking_up',
            'description' => 'Kurir sedang menuju toko untuk mengambil pesanan.',
        ]);

        return response()->json([
            'message' => 'Pesanan berhasil diambil. Segera menuju toko!',
            'data'    => $order->fresh(['items.product', 'address', 'umkmProfile']),
        ]);
    }

    // Kurir update status: picking_up → shipped, shipped → delivered
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
            'picking_up' => 'shipped',
            'shipped'    => 'delivered',
        ];

        $newStatus = $request->status;
        if (!isset($allowed[$order->status]) || $allowed[$order->status] !== $newStatus) {
            return response()->json(['message' => 'Perubahan status tidak valid.'], 422);
        }

        $order->update(['status' => $newStatus]);

        $descriptions = [
            'shipped'   => 'Kurir telah mengambil barang dari toko dan sedang mengantarkan.',
            'delivered' => 'Barang telah diantarkan ke penerima.',
        ];

        OrderHistory::create([
            'order_id'    => $order->id,
            'user_id'     => $userId,
            'status'      => $newStatus,
            'description' => $descriptions[$newStatus],
        ]);

        if ($newStatus === 'delivered') {
            $this->getProfile($request)->increment('total_deliveries');
            app(WebhookController::class)->triggerDisbursement($order->fresh(['payment']));
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

        $total     = Order::where('driver_id', $userId)->where('status', 'delivered')->count();
        $active    = Order::where('driver_id', $userId)->whereNotIn('status', ['delivered', 'cancelled'])->count();
        $today     = Order::where('driver_id', $userId)->where('status', 'delivered')->whereDate('updated_at', today())->count();
        $available = Order::where('status', 'confirmed')->whereNull('driver_id')->count();
        $balance   = UmkmBalance::findOrCreateFor($userId, 'driver');

        return response()->json([
            'data' => [
                'total_deliveries'  => $total,
                'active_deliveries' => $active,
                'today_deliveries'  => $today,
                'available_orders'  => $available,
                'balance'           => [
                    'available' => (float) $balance->available,
                    'pending'   => (float) $balance->pending,
                    'withdrawn' => (float) $balance->withdrawn,
                ],
                'is_available'      => $profile->is_available,
                'rating'            => $profile->rating,
                'is_verified'       => $profile->is_verified,
            ]
        ]);
    }
}
