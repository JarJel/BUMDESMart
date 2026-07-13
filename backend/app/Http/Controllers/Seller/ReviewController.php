<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $umkmProfile = $request->user()->umkmProfile;
        $productIds  = $umkmProfile->products()->pluck('id');

        $reviews = ProductReview::whereIn('product_id', $productIds)
            ->with([
                'product:id,name,slug',
                'customer.user:id,name',
            ])
            ->latest()
            ->paginate(20);

        $stats = [
            'total'   => ProductReview::whereIn('product_id', $productIds)->count(),
            'average' => round((float) ProductReview::whereIn('product_id', $productIds)->avg('rating'), 2),
        ];

        return response()->json(['data' => $reviews, 'stats' => $stats]);
    }
}
