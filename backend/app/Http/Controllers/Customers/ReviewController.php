<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
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
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
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
}
