<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Models\DriverProfile;
use App\Models\DriverReview;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    public function store(Request $request, int $orderId)
    {
        $customerId = $request->user()->customer->id;

        $order = Order::with('items')
            ->where('customer_id', $customerId)
            ->where('status', 'delivered')
            ->findOrFail($orderId);

        $validator = Validator::make($request->all(), [
            'reviews'              => 'required|array|min:1',
            'reviews.*.product_id' => 'required|integer|exists:products,id',
            'reviews.*.rating'     => 'required|integer|min:1|max:5',
            'reviews.*.comment'    => 'nullable|string|max:1000',
            'courier_rating'       => 'nullable|integer|min:1|max:5',
            'courier_comment'      => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Update ulasan kurir jika ada
        if ($request->has('courier_rating') && $order->driver_id) {
            $order->update([
                'courier_rating'  => $request->courier_rating,
                'courier_comment' => $request->courier_comment,
            ]);

            // Hitung rata-rata rating driver
            $avgRating = Order::where('driver_id', $order->driver_id)
                ->whereNotNull('courier_rating')
                ->avg('courier_rating');

            // Simpan ke DriverProfile
            \App\Models\DriverProfile::where('user_id', $order->driver_id)
                ->update(['rating' => round($avgRating ?? 0, 2)]);
        }

        $validProductIds = $order->items->pluck('product_id')->toArray();
        $updatedUmkmIds  = [];

        foreach ($request->reviews as $reviewData) {
            $productId = (int) $reviewData['product_id'];
            if (!in_array($productId, $validProductIds)) {
                continue;
            }

            ProductReview::updateOrCreate(
                ['order_id' => $orderId, 'product_id' => $productId],
                [
                    'customer_id' => $customerId,
                    'rating'      => $reviewData['rating'],
                    'comment'     => $reviewData['comment'] ?? null,
                ]
            );

            $product = Product::find($productId);
            if ($product && !in_array($product->umkm_profile_id, $updatedUmkmIds)) {
                $product->umkmProfile->recalculateRating();
                $updatedUmkmIds[] = $product->umkm_profile_id;
            }
        }

        return response()->json(['message' => 'Ulasan berhasil disimpan.']);
    }

    public function showByOrder(Request $request, int $orderId)
    {
        $customerId = $request->user()->customer->id;

        Order::where('customer_id', $customerId)->findOrFail($orderId);

        $reviews = ProductReview::where('order_id', $orderId)
            ->where('customer_id', $customerId)
            ->get(['product_id', 'rating', 'comment']);

        return response()->json(['data' => $reviews]);
    }

    public function storeDriverReview(Request $request, int $orderId)
    {
        $customer = $request->user()->customer;
        if (!$customer) {
            return response()->json(['message' => 'Bukan customer.'], 403);
        }

        $order = Order::where('customer_id', $customer->id)
            ->whereIn('status', ['delivered', 'completed'])
            ->findOrFail($orderId);

        if (!$order->driver_id) {
            return response()->json(['message' => 'Pesanan ini tidak memiliki kurir.'], 422);
        }

        $driverProfile = DriverProfile::where('user_id', $order->driver_id)->first();
        if (!$driverProfile) {
            return response()->json(['message' => 'Profil kurir tidak ditemukan.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DriverReview::updateOrCreate(
            ['order_id' => $orderId, 'customer_id' => $customer->id],
            [
                'driver_profile_id' => $driverProfile->id,
                'rating'            => $request->rating,
                'comment'           => $request->comment ?? null,
            ]
        );

        $driverProfile->recalculateRating();

        return response()->json(['message' => 'Ulasan kurir berhasil disimpan.']);
    }

    public function showDriverReview(Request $request, int $orderId)
    {
        $customer = $request->user()->customer;
        if (!$customer) {
            return response()->json(['message' => 'Bukan customer.'], 403);
        }

        Order::where('customer_id', $customer->id)->findOrFail($orderId);

        $review = DriverReview::where('order_id', $orderId)
            ->where('customer_id', $customer->id)
            ->first(['rating', 'comment']);

        return response()->json(['data' => $review]);
    }
}
