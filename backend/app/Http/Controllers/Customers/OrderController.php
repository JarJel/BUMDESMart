<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\WebhookController;
use App\Models\Order;
use App\Models\OrderHistory;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $customerId = $request->user()->customer->id;

        $query = Order::with([
            'items.product:id,name,slug',
            'umkmProfile:id,shop_name,logo,slug',
            'payment:id,order_id,status,xendit_data',
        ])->where('customer_id', $customerId);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->latest()->paginate(10);

        return response()->json(['data' => $orders]);
    }

    public function show(Request $request, $id)
    {
        $customerId = $request->user()->customer->id;

        $order = Order::with([
            'items.product:id,name,slug,weight',
            'items.variantOption:id,value',
            'umkmProfile:id,shop_name,logo,slug,phone',
            'address',
            'payment',
            'driver:id,name,phone',
            'driver.driverProfile:user_id,vehicle_type,vehicle_brand,vehicle_plate,rating',
            'histories' => fn($q) => $q->latest(),
        ])->where('customer_id', $customerId)->findOrFail($id);

        return response()->json(['data' => $order]);
    }

    public function confirmDelivered(Request $request, $id)
    {
        $customerId = $request->user()->customer->id;

        $order = Order::where('customer_id', $customerId)
            ->where('status', 'shipped')
            ->findOrFail($id);

        $order->update(['status' => 'delivered']);

        OrderHistory::create([
            'order_id'    => $order->id,
            'user_id'     => $request->user()->id,
            'status'      => 'delivered',
            'description' => 'Pesanan diterima oleh pembeli.',
        ]);

        // Trigger disbursement ke UMKM dan driver
        app(WebhookController::class)->triggerDisbursement($order->fresh(['payment']));

        return response()->json([
            'message' => 'Pesanan berhasil dikonfirmasi diterima.',
            'data'    => $order->fresh(),
        ]);
    }
}
