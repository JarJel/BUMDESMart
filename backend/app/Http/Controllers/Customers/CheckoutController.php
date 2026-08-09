<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Helpers\HaversineHelper;
use App\Services\RajaOngkirService;
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
use App\Models\Promotion;
use App\Models\UmkmProfile;
use App\Models\UmkmVoucherProgram;
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

            // Preload bumdes profiles untuk service fee
            $umkmIdsForFee = collect($items)->pluck('product.umkm_profile.id')->unique()->filter()->values();
            $bumdesForFee  = UmkmProfile::with('bumdesProfile')->whereIn('id', $umkmIdsForFee)->get()->keyBy('id');

            // Apply promotions per tenant
            foreach ($tenants as $tenantKey => &$tenant) {
                $umkmId = $tenant['umkm_profile_id'];
                $tenant['promotion_id'] = null;
                $tenant['promotion_code'] = null;
                $tenant['promotion_name'] = null;
                $tenant['discount'] = 0;
                $tenant['promotion_error'] = null;
                $tenant['service_fee'] = 0;
                $tenant['total'] = $tenant['sub_total'];

                // Service fee BUMDes dibebankan ke pembeli (flat per pesanan)
                if ($umkmId && isset($bumdesForFee[$umkmId])) {
                    $bumdes = $bumdesForFee[$umkmId]->bumdesProfile;
                    $tenant['service_fee'] = (int) ($bumdes?->buyer_service_fee ?? 0);
                }

                if ($umkmId && isset($promotionCodes[$umkmId])) {
                    $code = $promotionCodes[$umkmId];
                    $promoResult = $this->validatePromotion($code, $umkmId, $tenant['sub_total']);
                    if ($promoResult['valid']) {
                        $promo = $promoResult['promotion'];
                        $tenant['promotion_id'] = $promo->id;
                        $tenant['promotion_code'] = $promo->code;
                        $tenant['promotion_name'] = $promo->name;
                        $tenant['discount'] = $promoResult['discount'];
                        $tenant['total'] = max(0, $tenant['sub_total'] - $promoResult['discount']) + $tenant['service_fee'];
                    } else {
                        $tenant['promotion_error'] = $promoResult['message'];
                    }
                } else {
                    $tenant['total'] = $tenant['sub_total'] + $tenant['service_fee'];
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

            $shippingMethods = [];
            $rajaOngkir = app(RajaOngkirService::class);

            foreach ($umkmIds as $umkmId) {
                $umkm        = $umkmProfiles[$umkmId] ?? null;
                $distanceKm  = null;

                if ($selectedAddress && $umkm && $umkm->latitude && $umkm->longitude
                    && $selectedAddress->latitude && $selectedAddress->longitude) {
                    $distanceKm = HaversineHelper::distanceKm(
                        (float) $selectedAddress->latitude,
                        (float) $selectedAddress->longitude,
                        (float) $umkm->latitude,
                        (float) $umkm->longitude,
                    );
                }

                $distKm = $distanceKm ?? 0;
                $costMotor = HaversineHelper::shippingCost($distKm, 'motor');
                $costMobil = HaversineHelper::shippingCost($distKm, 'mobil');
                $distDisplay = $distanceKm ? round($distanceKm, 2) : null;

                // Opsi kurir lokal & ambil sendiri
                $options = [
                    [
                        'id'          => 'kurir-lokal-motor',
                        'name'        => 'Kurir Lokal - Motor',
                        'description' => 'Diantar kurir desa (motor)',
                        'estimation'  => 'Hari ini - 1 hari',
                        'price'       => $costMotor,
                        'distance_km' => $distDisplay,
                        'type'        => 'lokal',
                        'vehicle'     => 'motor',
                    ],
                    [
                        'id'          => 'kurir-lokal-mobil',
                        'name'        => 'Kurir Lokal - Mobil',
                        'description' => 'Diantar kurir desa (mobil)',
                        'estimation'  => 'Hari ini - 1 hari',
                        'price'       => $costMobil,
                        'distance_km' => $distDisplay,
                        'type'        => 'lokal',
                        'vehicle'     => 'mobil',
                    ],
                    [
                        'id'          => 'pickup',
                        'name'        => 'Ambil Sendiri',
                        'description' => 'Ambil langsung ke toko',
                        'estimation'  => 'Sesuai jadwal',
                        'price'       => 0,
                        'distance_km' => null,
                        'type'        => 'pickup',
                    ],
                ];

                // Tambah GoSend & ekspedisi jika jarak > 5km (luar desa) atau koordinat tidak ada
                $showEkspedisi = false;
                if ($selectedAddress && $umkm) {
                    if ($distanceKm !== null) {
                        $showEkspedisi = $distanceKm > 5;
                    } else {
                        // Koordinat tidak ada, tampilkan saja semua opsi
                        $showEkspedisi = true;
                    }
                }

                if ($showEkspedisi) {
                    $km = $distanceKm ?? 10;

                    // Kurir same-day (estimasi harga berdasarkan jarak)
                    $sameDayCouriers = [
                        ['id' => 'gosend',       'name' => 'GoSend',        'icon' => '🛵', 'base' => 14000, 'per_km' => 2500, 'est' => '1-3 jam'],
                        ['id' => 'grabexpress',  'name' => 'Grab Express',  'icon' => '🟢', 'base' => 14000, 'per_km' => 2500, 'est' => '1-3 jam'],
                        ['id' => 'lalamove',     'name' => 'Lalamove',      'icon' => '🟡', 'base' => 16000, 'per_km' => 3000, 'est' => '1-4 jam'],
                    ];
                    foreach ($sameDayCouriers as $c) {
                        $options[] = [
                            'id'          => $c['id'],
                            'name'        => $c['icon'] . ' ' . $c['name'],
                            'description' => 'Kurir instan',
                            'estimation'  => $c['est'],
                            'price'       => (int) ($c['base'] + ($km * $c['per_km'])),
                            'distance_km' => round($km, 2),
                            'type'        => 'ekspedisi',
                            'note'        => 'Estimasi harga, harga final sesuai aplikasi kurir',
                        ];
                    }

                    // Ekspedisi reguler via RajaOngkir (JNE/TIKI/POS)
                    $originCity = $umkm->city ?? null;
                    $destCity   = $selectedAddress->city ?? null;
                    if ($originCity && $destCity) {
                        try {
                            $originId = $rajaOngkir->findCityId($originCity);
                            $destId   = $rajaOngkir->findCityId($destCity);
                            if ($originId && $destId) {
                                $totalWeightGram = collect($items)
                                    ->where('product.umkm_profile.id', $umkmId)
                                    ->sum(fn($i) => ($i['product']['weight'] ?? 500) * $i['quantity']);

                                $ekspedisi = $rajaOngkir->getAllCosts($originId, $destId, (int) $totalWeightGram);
                                foreach ($ekspedisi as $eks) {
                                    $options[] = [
                                        'id'          => 'ekspedisi-' . strtolower($eks['courier']) . '-' . strtolower($eks['service']),
                                        'name'        => '📦 ' . $eks['name'],
                                        'description' => $eks['courier'],
                                        'estimation'  => $eks['estimation'],
                                        'price'       => $eks['price'],
                                        'distance_km' => null,
                                        'type'        => 'ekspedisi',
                                        'note'        => null,
                                    ];
                                }
                            }
                        } catch (\Exception) {
                            // RajaOngkir gagal — same-day tetap tampil
                        }
                    }

                    // Kurir reguler estimasi (SiCepat, J&T, AnterAja) — fallback jika RajaOngkir tidak dapat kota
                    $regularCouriers = [
                        ['id' => 'sicepat-reg', 'name' => '📦 SiCepat REG', 'est' => '1-3 hari', 'price' => 10000],
                        ['id' => 'jnt-ez',      'name' => '📦 J&T EZ',      'est' => '1-3 hari', 'price' => 9000],
                        ['id' => 'anteraja-reg','name' => '📦 AnterAja REG', 'est' => '2-4 hari', 'price' => 8000],
                        ['id' => 'ninja-xpress','name' => '📦 Ninja Xpress', 'est' => '2-4 hari', 'price' => 9000],
                    ];
                    $hasRajaOngkirResult = !empty(array_filter($options, fn($o) => str_starts_with($o['id'] ?? '', 'ekspedisi-')));
                    if (!$hasRajaOngkirResult) {
                        foreach ($regularCouriers as $c) {
                            $options[] = [
                                'id'          => $c['id'],
                                'name'        => $c['name'],
                                'description' => 'Reguler',
                                'estimation'  => $c['est'],
                                'price'       => $c['price'],
                                'distance_km' => null,
                                'type'        => 'ekspedisi',
                                'note'        => 'Estimasi harga, harga final sesuai berat & lokasi',
                            ];
                        }
                    }
                }

                $shippingMethods[] = [
                    'umkm_profile_id' => $umkmId,
                    'options'         => $options,
                ];
            }

            if (empty($shippingMethods)) {
                $shippingMethods = [[
                    'umkm_profile_id' => null,
                    'options' => [
                        ['id' => 'kurir-lokal', 'name' => 'Kurir Lokal',   'type' => 'lokal',  'estimation' => 'Hari ini - 1 hari', 'price' => null],
                        ['id' => 'pickup',      'name' => 'Ambil Sendiri', 'type' => 'pickup', 'estimation' => 'Sesuai jadwal',     'price' => 0],
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
            'address_id'            => 'required_if:delivery_type,delivered|nullable|integer|exists:addresses,id',
            'delivery_type'         => 'required|in:delivered,pickup',
            'shipping_method_id'    => 'nullable|string', // kurir-lokal | pickup | ekspedisi-jne-reg | dll
            'shipping_cost_override'=> 'nullable|integer|min:1000|max:2000000', // ongkir ekspedisi dari FE (batas wajar)
            'vehicle_type'          => 'nullable|in:motor,mobil', // deprecated — dibaca dari shipping_method_id
            'notes'                 => 'nullable|string|max:500',
            'product_id'            => 'nullable|integer|exists:products,id',
            'quantity'              => 'nullable|integer|min:1',
            'variant_id'            => 'nullable|integer',
            'voucher_program_ids'   => 'nullable|array',
            'voucher_program_ids.*' => 'integer',
        ]);

        $deliveryType      = $validated['delivery_type'];
        $shippingMethodId  = $validated['shipping_method_id'] ?? null;
        // Baca vehicle_type dari shipping_method_id (kurir-lokal-motor / kurir-lokal-mobil)
        $vehicleType = match(true) {
            str_ends_with($shippingMethodId ?? '', '-mobil') => 'mobil',
            default                                          => 'motor',
        };
        $shippingOverride  = isset($validated['shipping_cost_override']) ? (int) $validated['shipping_cost_override'] : null;

        $customerId = $user->customer->id;
        $isBuyNow   = $request->filled('product_id');

        $address = null;
        if ($deliveryType === 'delivered') {
            $address = Address::where('id', $validated['address_id'])
                ->where('customer_id', $customerId)
                ->first();
            if (!$address) {
                return response()->json(['success' => false, 'message' => 'Alamat tidak valid.'], 422);
            }
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

            if (!$product->is_pre_order) {
                if ($product->has_variant && isset($validated['variant_id'])) {
                    $variant = ProductVariantOption::find($validated['variant_id']);
                    if (!$variant || $variant->stock < $qty) {
                        return response()->json(['success' => false, 'message' => "Stok {$product->name} tidak mencukupi."], 422);
                    }
                } else {
                    if ($product->stock < $qty) {
                        return response()->json(['success' => false, 'message' => "Stok {$product->name} tidak mencukupi."], 422);
                    }
                }
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

                if (!$product->is_pre_order) {
                    $availableStock = $ci->variant ? $ci->variant->stock : $product->stock;
                    if ($availableStock < $ci->quantity) {
                        return response()->json(['success' => false, 'message' => "Stok {$product->name} tidak mencukupi."], 422);
                    }
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

        // Parse promotions (kode promo lama)
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

        // Parse voucher program IDs (sistem baru tanpa kode)
        $voucherProgramIds = $validated['voucher_program_ids'] ?? [];

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

                // Apply voucher program (tanpa kode, sistem baru)
                $appliedVoucherProgramId = null;
                if (isset($voucherProgramIds[$umkmId])) {
                    $voucherProgram = UmkmVoucherProgram::where('id', (int) $voucherProgramIds[$umkmId])
                        ->where('umkm_profile_id', $umkmId)
                        ->where('is_active', true)
                        ->first();

                    if ($voucherProgram) {
                        // Hitung frekuensi beli untuk validasi ulang di sisi server
                        $orderFrequency = Order::where('customer_id', $customerId)
                            ->where('umkm_profile_id', $umkmId)
                            ->whereIn('status', ['confirmed', 'picking_up', 'shipped', 'delivered'])
                            ->count();

                        $itemCount   = collect($items)->sum('quantity');
                        $netSubTotal = $subTotal - $totalDiscount;

                        $context = [
                            'item_count'      => $itemCount,
                            'order_amount'    => $netSubTotal,
                            'order_frequency' => $orderFrequency,
                        ];

                        // Cek belum pernah dipakai
                        $alreadyUsed = Promotion::where('customer_id', $customerId)
                            ->where('voucher_program_id', $voucherProgram->id)
                            ->where('is_auto_generated', true)
                            ->exists();

                        if (!$alreadyUsed && $voucherProgram->isEligible($context)) {
                            $voucherDiscount = $voucherProgram->calculateDiscount($netSubTotal);
                            $orderDiscount  += $voucherDiscount;
                            $appliedVoucherProgramId = $voucherProgram->id;
                        }
                    }
                }

                // Hitung ongkir
                $shippingCost = 0;
                if ($deliveryType === 'delivered') {
                    // Kalau FE kirim ongkir dari RajaOngkir (ekspedisi), pakai itu
                    if ($shippingOverride !== null && str_starts_with($shippingMethodId ?? '', 'ekspedisi-')) {
                        $shippingCost = $shippingOverride;
                    } else {
                        // Default: hitung via Haversine (kurir lokal)
                        $umkm = UmkmProfile::find($umkmId);
                        if ($umkm && $umkm->latitude && $umkm->longitude
                            && $address->latitude && $address->longitude) {
                            $km           = HaversineHelper::distanceKm(
                                (float) $address->latitude, (float) $address->longitude,
                                (float) $umkm->latitude,    (float) $umkm->longitude,
                            );
                            $shippingCost = HaversineHelper::shippingCost($km, $vehicleType);
                        } else {
                            $shippingCost = HaversineHelper::shippingCost(0, $vehicleType);
                        }
                    }
                }

                $netAmount = max(0, $subTotal - $orderDiscount);

                // Hitung fee BUMDes dari net amount (dipotong dari seller)
                $bumdesFee  = 0;
                $serviceFee = 0;
                $umkmForFee = UmkmProfile::with('bumdesProfile')->find($umkmId);
                if ($umkmForFee?->bumdesProfile) {
                    $bumdesFee  = $umkmForFee->bumdesProfile->calculateFee((float) $netAmount);
                    $serviceFee = (int) ($umkmForFee->bumdesProfile->buyer_service_fee ?? 0);
                }

                $total = $netAmount + $shippingCost + $serviceFee;
                $orderCode    = 'ORD-' . strtoupper(base_convert((string) time(), 10, 36)) . '-' . strtoupper(substr(uniqid(), -5));

                $order = Order::create([
                    'customer_id'     => $customerId,
                    'umkm_profile_id' => $umkmId,
                    'address_id'      => $validated['address_id'] ?? null,
                    'order_code'      => $orderCode,
                    'sub_total'       => $subTotal,
                    'shipping_cost'   => $shippingCost,
                    'discount'        => $orderDiscount,
                    'bumdes_fee'      => $bumdesFee,
                    'service_fee'     => $serviceFee,
                    'total'           => $total,
                    'status'          => 'pending',
                    'notes'           => $validated['notes'] ?? null,
                    'delivery_type'   => $deliveryType,
                    'shipping_method' => $shippingMethodId,
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

                    if (!$item['product']->is_pre_order) {
                        $item['product']->decrement('stock', $item['quantity']);
                    }
                }

                OrderHistory::create([
                    'order_id'    => $order->id,
                    'user_id'     => $user->id,
                    'status'      => 'pending',
                    'description' => 'Pesanan dibuat.',
                ]);

                // Catat pemakaian voucher program agar tidak bisa dipakai lagi
                if ($appliedVoucherProgramId) {
                    Promotion::create([
                        'umkm_profile_id'    => $umkmId,
                        'customer_id'        => $customerId,
                        'voucher_program_id' => $appliedVoucherProgramId,
                        'is_auto_generated'  => true,
                        'name'               => 'Voucher Program #' . $appliedVoucherProgramId,
                        'code'               => 'AUTO-' . $appliedVoucherProgramId . '-' . $customerId,
                        'type'               => 'fixed_amount',
                        'value'              => 0,
                        'status'             => 'inactive',
                        'usage_count'        => 1,
                        'usage_limit'        => 1,
                        'start_date'         => now(),
                        'end_date'           => now()->addYears(10),
                    ]);
                }

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
        $customerId = auth()->user()?->customer?->id;

        $promo = \App\Models\Promotion::where('code', strtoupper($code))
            ->where('umkm_profile_id', $umkmProfileId)
            ->where('status', 'active')
            ->where(fn($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', now()))
            ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>', now()))
            ->where(fn($q) => $q->whereNull('usage_limit')->orWhereColumn('usage_count', '<', 'usage_limit'))
            // Voucher personal: harus milik pembeli ini, atau promo publik (customer_id null)
            ->where(fn($q) => $q->whereNull('customer_id')->orWhere('customer_id', $customerId))
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
