<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Helpers\HaversineHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderHistory;
use App\Models\Product;
use App\Models\ProductDiscount;
use App\Models\ProductVariant;
use App\Models\ProductVariantOption;
use App\Models\UmkmProfile;
use App\Models\BumdesProfile;
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
                    $variant = ProductVariantOption::where('id', $variantId)
                        ->whereHas('productVariant', function($q) use ($productId) {
                            $q->where('product_id', $productId);
                        })
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
                    'id'         => 0,
                    'cart_id'    => 0,
                    'product_id' => $productId,
                    'variant_id' => $variantId,
                    'quantity'   => $quantity,
                    'product'    => [
                        'id'              => $product->id,
                        'name'            => $product->name,
                        'slug'            => $product->slug,
                        'price'           => $basePrice,
                        'discount_amount' => $discountAmount,
                        'final_price'     => $finalPrice,
                        'stock'           => $variant ? $variant->stock : $product->stock,
                        'weight'          => $product->weight,
                        'umkm_profile'    => $product->umkmProfile ? [
                            'id'        => $product->umkmProfile->id,
                            'name_umkm' => $product->umkmProfile->shop_name,
                        ] : null,
                        'images' => $product->images->map(function ($img) {
                            return [
                                'id'         => $img->id,
                                'product_id' => $img->product_id,
                                'image_path' => $img->file_path,
                                'file_path'  => $img->file_path,
                            ];
                        })
                    ],
                    'variant' => $variant ? [
                        'id'    => $variant->id,
                        'name'  => $variant->name,
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
                            'id'         => $item->id,
                            'cart_id'    => $item->cart_id,
                            'product_id' => $item->product_id,
                            'variant_id' => $item->variant_id,
                            'quantity'   => $item->quantity,
                            'product'    => [
                                'id'              => $product->id,
                                'name'            => $product->name,
                                'slug'            => $product->slug,
                                'price'           => $basePrice,
                                'discount_amount' => $discountAmount,
                                'final_price'     => $finalPrice,
                                'stock'           => $variant ? $variant->stock : $product->stock,
                                'weight'          => $product->weight,
                                'umkm_profile'    => $product->umkmProfile ? [
                                    'id'        => $product->umkmProfile->id,
                                    'name_umkm' => $product->umkmProfile->shop_name,
                                ] : null,
                                'images' => $product->images->map(function ($img) {
                                    return [
                                        'id'         => $img->id,
                                        'product_id' => $img->product_id,
                                        'image_path' => $img->file_path,
                                        'file_path'  => $img->file_path,
                                    ];
                                })
                            ],
                            'variant' => $variant ? [
                                'id'    => $variant->id,
                                'name'  => $variant->name,
                                'stock' => $variant->stock,
                                'price' => $variant->price,
                            ] : null
                        ];
                    }
                }
            }

            // 2. Kelompokkan Items per Tenant (1 tenant = 1 pembayaran)
            $tenants = [];
            foreach ($items as $item) {
                $umkmProfile  = $item['product']['umkm_profile'] ?? null;
                $umkmId       = $umkmProfile['id'] ?? null;
                $tenantKey    = $umkmId !== null ? (string) $umkmId : 'unknown';

                if (!isset($tenants[$tenantKey])) {
                    $tenants[$tenantKey] = [
                        'umkm_profile_id' => $umkmId,
                        'shop_name'       => $umkmProfile['name_umkm'] ?? 'Toko BUMDES',
                        'items'           => [],
                        'sub_total'       => 0,
                    ];
                }

                $tenants[$tenantKey]['items'][]   = $item;
                $tenants[$tenantKey]['sub_total'] += $item['product']['final_price'] * $item['quantity'];
            }

            // Parse promotions
            $promotionCodes = $request->input('promotion_codes', []);
            $singlePromoCode = $request->input('promotion_code');
            if ($singlePromoCode && !is_array($singlePromoCode)) {
                $promo = \App\Models\Promotion::where('code', strtoupper($singlePromoCode))
                    ->where('status', 'active')
                    ->first();
                if ($promo) {
                    $promotionCodes[$promo->umkm_profile_id] = $promo->code;
                }
            }

            // Apply promotions per tenant
            foreach ($tenants as $tenantKey => &$tenant) {
                $umkmId = $tenant['umkm_profile_id'];
                $tenant['promotion_id'] = null;
                $tenant['promotion_code'] = null;
                $tenant['promotion_name'] = null;
                $tenant['discount'] = 0;
                $tenant['promotion_error'] = null;
                $tenant['total'] = $tenant['sub_total'];

                if ($umkmId && isset($promotionCodes[$umkmId])) {
                    $code = $promotionCodes[$umkmId];
                    $promoResult = $this->validatePromotion($code, $umkmId, $tenant['sub_total']);
                    if ($promoResult['valid']) {
                        $promo = $promoResult['promotion'];
                        $tenant['promotion_id'] = $promo->id;
                        $tenant['promotion_code'] = $promo->code;
                        $tenant['promotion_name'] = $promo->name;
                        $tenant['discount'] = $promoResult['discount'];
                        $tenant['total'] = max(0, $tenant['sub_total'] - $promoResult['discount']);
                    } else {
                        $tenant['promotion_error'] = $promoResult['message'];
                    }
                }
            }
            unset($tenant);

            // Reset array keys agar menjadi indexed array
            $tenants = array_values($tenants);

            // 3. Fetch Addresses
            $addresses = Address::where('customer_id', $customerId)
                ->orderBy('is_default', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            // 4. Shipping Methods — hitung via Haversine jika address_id dikirim
            $selectedAddress = null;
            if ($request->filled('address_id')) {
                $selectedAddress = Address::where('id', $request->address_id)
                    ->where('customer_id', $customerId)
                    ->first();
            }

            $umkmIds = collect($items)->pluck('product.umkm_profile.id')->unique()->filter()->values();
            $umkmProfiles = UmkmProfile::whereIn('id', $umkmIds)->get()->keyBy('id');

            $vehicleType = in_array($request->input('vehicle_type'), ['motor', 'mobil'])
                ? $request->input('vehicle_type')
                : 'motor';

            $shippingMethods = [];
            foreach ($umkmIds as $umkmId) {
                $umkm          = $umkmProfiles[$umkmId] ?? null;
                $distanceKm    = null;
                $dynamicCost   = null; // null = belum bisa dihitung

                if ($selectedAddress && $umkm && $umkm->latitude && $umkm->longitude
                    && $selectedAddress->latitude && $selectedAddress->longitude) {
                    $distanceKm  = HaversineHelper::distanceKm(
                        (float) $selectedAddress->latitude,
                        (float) $selectedAddress->longitude,
                        (float) $umkm->latitude,
                        (float) $umkm->longitude,
                    );
                    $dynamicCost = HaversineHelper::shippingCost($distanceKm, $vehicleType);
                } elseif ($selectedAddress) {
                    $dynamicCost = HaversineHelper::shippingCost(0, $vehicleType); // fallback ≤1km = Rp 5.000
                }

                $shippingMethods[] = [
                    'umkm_profile_id' => $umkmId,
                    'options' => [
                        [
                            'id'          => 'kurir-lokal',
                            'name'        => 'Kurir Lokal',
                            'estimation'  => 'Hari ini - 1 hari',
                            'price'       => $dynamicCost,
                            'distance_km' => $distanceKm ? round($distanceKm, 2) : null,
                        ],
                        [
                            'id'          => 'pickup',
                            'name'        => 'Ambil Sendiri',
                            'estimation'  => 'Sesuai jadwal',
                            'price'       => 0,
                            'distance_km' => null,
                        ],
                    ],
                ];
            }

            // Fallback flat list jika tidak ada address
            if (empty($shippingMethods)) {
                $shippingMethods = [[
                    'umkm_profile_id' => null,
                    'options' => [
                        ['id' => 'kurir-lokal', 'name' => 'Kurir Lokal',   'estimation' => 'Hari ini - 1 hari', 'price' => null],
                        ['id' => 'pickup',      'name' => 'Ambil Sendiri', 'estimation' => 'Sesuai jadwal',     'price' => 0],
                    ],
                ]];
            }

            // 5. Payment Methods
            $paymentMethods = [
                ['id' => 'qris',     'name' => 'QRIS',         'description' => 'Scan QR dari semua e-wallet & m-banking'],
                ['id' => 'transfer', 'name' => 'Transfer Bank', 'description' => 'BCA, BRI, BNI, Mandiri, BJB'],
                ['id' => 'ewallet',  'name' => 'E-Wallet',     'description' => 'GoPay, OVO, Dana, ShopeePay'],
            ];

            return response()->json([
                'success' => true,
                'data'    => [
                    'tenants'          => $tenants,         // items dikelompokkan per tenant
                    'items'            => $items,           // flat items (kompatibilitas mundur)
                    'addresses'        => $addresses,
                    'shipping_methods' => $shippingMethods,
                    'payment_methods'  => $paymentMethods,
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data preview checkout: ' . $e->getMessage()
            ], 500);
        }
    }

    public function confirm(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json(['success' => false, 'message' => 'Hanya customer yang dapat melakukan checkout.'], 403);
        }

        $validated = $request->validate([
            'address_id'    => 'required|integer|exists:addresses,id',
            'delivery_type' => 'required|in:delivered,pickup',
            'vehicle_type'  => 'nullable|in:motor,mobil',
            'notes'         => 'nullable|string|max:500',
            'product_id'    => 'nullable|integer|exists:products,id',
            'quantity'      => 'nullable|integer|min:1',
            'variant_id'    => 'nullable|integer',
        ]);

        $deliveryType = $validated['delivery_type'];
        $vehicleType  = $validated['vehicle_type'] ?? 'motor';

        $customerId = $user->customer->id;
        $isBuyNow   = $request->filled('product_id');

        $address = Address::where('id', $validated['address_id'])
            ->where('customer_id', $customerId)
            ->first();
        if (!$address) {
            return response()->json(['success' => false, 'message' => 'Alamat tidak valid.'], 422);
        }

        // Build raw item list
        $rawItems = [];

        if ($isBuyNow) {
            $product = Product::with(['umkmProfile', 'activeDiscount'])->find($validated['product_id']);
            if (!$product || $product->status !== 'active') {
                return response()->json(['success' => false, 'message' => 'Produk tidak tersedia.'], 422);
            }
            $qty            = $validated['quantity'] ?? 1;
            $basePrice      = (float) $product->price;
            $disc           = $product->activeDiscount;
            $discountAmount = $disc ? ($basePrice - $disc->calculateDiscountedPrice($basePrice)) : 0;

            if ($product->stock < $qty) {
                return response()->json(['success' => false, 'message' => "Stok {$product->name} tidak mencukupi."], 422);
            }

            $rawItems[] = [
                'product'           => $product,
                'product_name'      => $product->name,
                'product_price'     => $basePrice,
                'discount_amount'   => $discountAmount,
                'quantity'          => $qty,
                'variant_option_id' => $validated['variant_id'] ?? null,
                'umkm_profile_id'   => $product->umkm_profile_id,
                'cart_item_id'      => null,
            ];
        } else {
            $cart = Cart::where('customer_id', $customerId)->first();
            if (!$cart) {
                return response()->json(['success' => false, 'message' => 'Keranjang belanja kosong.'], 422);
            }

            $cartItems = CartItem::where('cart_id', $cart->id)
                ->with(['product.activeDiscount', 'product.umkmProfile', 'variant'])
                ->get();

            if ($cartItems->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'Keranjang belanja kosong.'], 422);
            }

            foreach ($cartItems as $ci) {
                $product = $ci->product;
                if (!$product) continue;

                $basePrice      = (float) ($ci->variant ? $ci->variant->price : $product->price);
                $disc           = $product->activeDiscount;
                $discountAmount = $disc ? ($basePrice - $disc->calculateDiscountedPrice($basePrice)) : 0;

                if ($product->stock < $ci->quantity) {
                    return response()->json(['success' => false, 'message' => "Stok {$product->name} tidak mencukupi."], 422);
                }

                $rawItems[] = [
                    'product'           => $product,
                    'product_name'      => $product->name,
                    'product_price'     => $basePrice,
                    'discount_amount'   => $discountAmount,
                    'quantity'          => $ci->quantity,
                    'variant_option_id' => $ci->variant_id,
                    'umkm_profile_id'   => $product->umkm_profile_id,
                    'cart_item_id'      => $ci->id,
                ];
            }
        }

        if (empty($rawItems)) {
            return response()->json(['success' => false, 'message' => 'Tidak ada item untuk diorder.'], 422);
        }

        // Group per seller — 1 order per UMKM
        $grouped = [];
        foreach ($rawItems as $item) {
            $grouped[$item['umkm_profile_id']][] = $item;
        }

        // Parse promotions
        $promotionCodes = $request->input('promotion_codes', []);
        $singlePromoCode = $request->input('promotion_code');
        if ($singlePromoCode && !is_array($singlePromoCode)) {
            $promo = \App\Models\Promotion::where('code', strtoupper($singlePromoCode))
                ->where('status', 'active')
                ->first();
            if ($promo) {
                $promotionCodes[$promo->umkm_profile_id] = $promo->code;
            }
        }

        DB::beginTransaction();
        try {
            $createdOrders = [];

            foreach ($grouped as $umkmId => $items) {
                $subTotal      = 0;
                $totalDiscount = 0;

                foreach ($items as $item) {
                    $subTotal      += $item['product_price'] * $item['quantity'];
                    $totalDiscount += $item['discount_amount'] * $item['quantity'];
                }

                $orderPromotionId = null;
                $orderDiscount    = $totalDiscount;

                if (isset($promotionCodes[$umkmId])) {
                    $code = $promotionCodes[$umkmId];
                    $subTotalAfterProductDiscount = $subTotal - $totalDiscount;
                    $promoResult = $this->validatePromotion($code, $umkmId, $subTotalAfterProductDiscount);
                    
                    if (!$promoResult['valid']) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => "Kode promo '{$code}' tidak valid: " . $promoResult['message']
                        ], 422);
                    }

                    $promo = $promoResult['promotion'];
                    $orderPromotionId = $promo->id;
                    $orderDiscount += $promoResult['discount'];
                    $promo->increment('usage_count');
                }

                // Hitung ongkir: pickup = 0, delivered = Haversine
                $shippingCost = 0;
                if ($deliveryType === 'delivered') {
                    $umkm = UmkmProfile::find($umkmId);
                    if ($umkm && $umkm->latitude && $umkm->longitude
                        && $address->latitude && $address->longitude) {
                        $km           = HaversineHelper::distanceKm(
                            (float) $address->latitude, (float) $address->longitude,
                            (float) $umkm->latitude,    (float) $umkm->longitude,
                        );
                        $shippingCost = HaversineHelper::shippingCost($km, $vehicleType);
                    } else {
                        // Fallback flat jika koordinat belum diisi
                        $shippingCost = HaversineHelper::shippingCost(0, $vehicleType);
                    }
                }

                $netAmount = max(0, $subTotal - $orderDiscount);

                // Hitung fee BUMDes dari net amount (setelah diskon, sebelum ongkir)
                $bumdesFee = 0;
                $umkmForFee = UmkmProfile::with('bumdesProfile')->find($umkmId);
                if ($umkmForFee?->bumdesProfile) {
                    $bumdesFee = $umkmForFee->bumdesProfile->calculateFee((float) $netAmount);
                }

                $total = $netAmount + $shippingCost;
                $orderCode    = 'ORD-' . strtoupper(base_convert((string) time(), 10, 36)) . '-' . strtoupper(substr(uniqid(), -5));

                $order = Order::create([
                    'customer_id'     => $customerId,
                    'umkm_profile_id' => $umkmId,
                    'address_id'      => $validated['address_id'],
                    'order_code'      => $orderCode,
                    'sub_total'       => $subTotal,
                    'shipping_cost'   => $shippingCost,
                    'discount'        => $orderDiscount,
                    'bumdes_fee'      => $bumdesFee,
                    'total'           => $total,
                    'status'          => 'pending',
                    'notes'           => $validated['notes'] ?? null,
                    'delivery_type'   => $deliveryType,
                    'promotion_id'    => $orderPromotionId,
                ]);

                foreach ($items as $item) {
                    OrderItem::create([
                        'order_id'          => $order->id,
                        'product_id'        => $item['product']->id,
                        'variant_option_id' => $item['variant_option_id'],
                        'product_name'      => $item['product_name'],
                        'product_price'     => $item['product_price'],
                        'discount_amount'   => $item['discount_amount'],
                        'quantity'          => $item['quantity'],
                        'sub_total'         => ($item['product_price'] - $item['discount_amount']) * $item['quantity'],
                    ]);

                    $item['product']->decrement('stock', $item['quantity']);
                }

                OrderHistory::create([
                    'order_id'    => $order->id,
                    'user_id'     => $user->id,
                    'status'      => 'pending',
                    'description' => 'Pesanan dibuat.',
                ]);

                $createdOrders[] = [
                    'order_id'   => $order->id,
                    'order_code' => $order->order_code,
                    'total'      => $order->total,
                ];
            }

            // Hapus cart items (bukan buy-now)
            if (!$isBuyNow) {
                $cartItemIds = collect($rawItems)->pluck('cart_item_id')->filter()->values();
                CartItem::whereIn('id', $cartItemIds)->delete();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat!',
                'data'    => [
                    'orders'       => $createdOrders,
                    'total_orders' => count($createdOrders),
                ],
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal membuat pesanan: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Validate promotion and calculate discount.
     *
     * @param string $code
     * @param int $umkmProfileId
     * @param float $subTotal
     * @return array
     */
    private function validatePromotion(string $code, int $umkmProfileId, float $subTotal): array
    {
        $promo = \App\Models\Promotion::where('code', strtoupper($code))
            ->where('umkm_profile_id', $umkmProfileId)
            ->where('status', 'active')
            ->where(fn($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', now()))
            ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>', now()))
            ->where(fn($q) => $q->whereNull('usage_limit')->orWhereColumn('usage_count', '<', 'usage_limit'))
            ->first();

        if (!$promo) {
            return [
                'valid' => false,
                'message' => 'Kode promo tidak valid atau sudah kadaluarsa.'
            ];
        }

        if ($promo->min_order_amount && $subTotal < $promo->min_order_amount) {
            return [
                'valid' => false,
                'message' => 'Minimum pembelian Rp ' . number_format($promo->min_order_amount, 0, ',', '.')
            ];
        }

        $discount = ($promo->type === 'percentage')
            ? ($subTotal * $promo->value / 100)
            : $promo->value;

        if ($promo->max_discount_amount) {
            $discount = min($discount, $promo->max_discount_amount);
        }

        $discount = min($discount, $subTotal);

        return [
            'valid' => true,
            'promotion' => $promo,
            'discount' => round($discount)
        ];
    }
}
