<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductDiscount;
use App\Models\ProductVariant;
use App\Models\Address;
use Exception;

class CheckoutController extends Controller
{
    public function preview(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat melakukan checkout.'
            ], 403);
        }

        try {
            $customerId = $user->customer->id;

            // 1. Fetch Items (Direct Checkout "Buy Now" OR Active Cart Items)
            $items = [];
            if ($request->has('product_id')) {
                $productId = (int) $request->input('product_id');
                $quantity = (int) $request->input('quantity', 1);
                $variantId = $request->filled('variant_id') ? (int) $request->input('variant_id') : null;

                $product = Product::with(['images', 'umkmProfile', 'activeDiscount'])->find($productId);
                if (!$product) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Produk tidak ditemukan.'
                    ], 404);
                }

                $variant = null;
                if ($variantId) {
                    $variant = ProductVariant::where('id', $variantId)
                        ->where('product_id', $productId)
                        ->first();
                    if (!$variant) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Varian produk tidak valid.'
                        ], 422);
                    }
                }

                $basePrice      = $variant ? $variant->price : $product->price;
                $discount       = $product->activeDiscount;
                $discountAmount = $discount ? ($basePrice - $discount->calculateDiscountedPrice((float) $basePrice)) : 0;
                $finalPrice     = $basePrice - $discountAmount;

                $items[] = [
                    'id' => 0,
                    'cart_id' => 0,
                    'product_id' => $productId,
                    'variant_id' => $variantId,
                    'quantity' => $quantity,
                    'product' => [
                        'id' => $product->id,
                        'name' => $product->name,
                        'slug' => $product->slug,
                        'price' => $basePrice,
                        'discount_amount' => $discountAmount,
                        'final_price' => $finalPrice,
                        'stock' => $variant ? $variant->stock : $product->stock,
                        'weight' => $product->weight,
                        'umkm_profile' => $product->umkmProfile ? [
                            'id' => $product->umkmProfile->id,
                            'name_umkm' => $product->umkmProfile->shop_name,
                        ] : null,
                        'images' => $product->images->map(function ($img) {
                            return [
                                'id' => $img->id,
                                'product_id' => $img->product_id,
                                'image_path' => $img->file_path,
                                'file_path' => $img->file_path,
                            ];
                        })
                    ],
                    'variant' => $variant ? [
                        'id' => $variant->id,
                        'name' => $variant->name,
                        'stock' => $variant->stock,
                        'price' => $variant->price,
                    ] : null
                ];
            } else {
                $cart = Cart::where('customer_id', $customerId)->first();
                if ($cart) {
                    $cartItems = CartItem::where('cart_id', $cart->id)
                        ->with(['product.images', 'product.umkmProfile', 'product.activeDiscount', 'variant'])
                        ->get();

                    foreach ($cartItems as $item) {
                        $product = $item->product;
                        $variant = $item->variant;
                        if (!$product) continue;

                        $basePrice      = $variant ? $variant->price : $product->price;
                        $discount       = $product->activeDiscount;
                        $discountAmount = $discount ? ($basePrice - $discount->calculateDiscountedPrice((float) $basePrice)) : 0;
                        $finalPrice     = $basePrice - $discountAmount;

                        $items[] = [
                            'id' => $item->id,
                            'cart_id' => $item->cart_id,
                            'product_id' => $item->product_id,
                            'variant_id' => $item->variant_id,
                            'quantity' => $item->quantity,
                            'product' => [
                                'id' => $product->id,
                                'name' => $product->name,
                                'slug' => $product->slug,
                                'price' => $basePrice,
                                'discount_amount' => $discountAmount,
                                'final_price' => $finalPrice,
                                'stock' => $variant ? $variant->stock : $product->stock,
                                'weight' => $product->weight,
                                'umkm_profile' => $product->umkmProfile ? [
                                    'id' => $product->umkmProfile->id,
                                    'name_umkm' => $product->umkmProfile->shop_name,
                                ] : null,
                                'images' => $product->images->map(function ($img) {
                                    return [
                                        'id' => $img->id,
                                        'product_id' => $img->product_id,
                                        'image_path' => $img->file_path,
                                        'file_path' => $img->file_path,
                                    ];
                                })
                            ],
                            'variant' => $variant ? [
                                'id' => $variant->id,
                                'name' => $variant->name,
                                'stock' => $variant->stock,
                                'price' => $variant->price,
                            ] : null
                        ];
                    }
                }
            }

            // 2. Fetch Addresses
            $addresses = Address::where('customer_id', $customerId)
                ->orderBy('is_default', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            // 3. Shipping Methods
            $shippingMethods = [
                ['id' => 'jne-reg', 'name' => 'JNE Regular', 'estimation' => '2-3 hari', 'price' => 12000],
                ['id' => 'jnt-reg', 'name' => 'J&T Express', 'estimation' => '2-3 hari', 'price' => 11000],
                ['id' => 'sicepat', 'name' => 'SiCepat REG', 'estimation' => '1-2 hari', 'price' => 14000],
                ['id' => 'pickup', 'name' => 'Ambil Sendiri', 'estimation' => 'Hari ini', 'price' => 0],
            ];

            // 4. Payment Methods
            $paymentMethods = [
                ['id' => 'qris', 'name' => 'QRIS', 'description' => 'Scan QR dari semua e-wallet & m-banking'],
                ['id' => 'transfer', 'name' => 'Transfer Bank', 'description' => 'BCA, BRI, BNI, Mandiri, BJB'],
                ['id' => 'ewallet', 'name' => 'E-Wallet', 'description' => 'GoPay, OVO, Dana, ShopeePay'],
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'items' => $items,
                    'addresses' => $addresses,
                    'shipping_methods' => $shippingMethods,
                    'payment_methods' => $paymentMethods,
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data preview checkout: ' . $e->getMessage()
            ], 500);
        }
    }
}
