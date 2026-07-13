<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\Validator;
use Exception;

class CartController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat memiliki keranjang belanja.'
            ], 403);
        }

        try {
            $cart = Cart::firstOrCreate(['customer_id' => $user->customer->id]);

            $cart->load([
                'items.product.images',
                'items.product.umkmProfile',
                'items.variant'
            ]);

            return response()->json([
                'success' => true,
                'data' => $cart
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil keranjang belanja: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat memiliki keranjang belanja.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'nullable|integer|min:1',
            'variant_id' => 'nullable|integer|exists:product_variants,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $productId = $request->product_id;
        $variantId = $request->variant_id;
        $quantity = $request->input('quantity', 1);

        try {
            $product = Product::find($productId);
            $maxStock = $product->stock;

            if ($variantId) {
                $variant = ProductVariant::where('id', $variantId)
                    ->where('product_id', $productId)
                    ->first();
                if (!$variant) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Varian produk tidak valid untuk produk ini.'
                    ], 422);
                }
                $maxStock = $variant->stock;
            }

            $cart = Cart::firstOrCreate(['customer_id' => $user->customer->id]);

            $firstItem = CartItem::with('product')
                ->where('cart_id', $cart->id)
                ->first();

            if ($firstItem && $firstItem->product->umkm_profile_id !== $product->umkm_profile_id) {
                return response()->json([
                    'success'      => false,
                    'message'      => 'Keranjang kamu sudah berisi produk dari toko lain.',
                    'error_code'   => 'DIFFERENT_SHOP',
                    'current_shop' => [
                        'id'        => $firstItem->product->umkm_profile_id,
                        'shop_name' => $firstItem->product->umkmProfile->shop_name ?? 'Toko Sebelumnya',
                    ],
                ], 409);
            }

            $cartItem = CartItem::where('cart_id', $cart->id)
                ->where('product_id', $productId)
                ->where('variant_id', $variantId)
                ->first();

            $currentQuantity = $cartItem ? $cartItem->quantity : 0;
            $newQuantity = $currentQuantity + $quantity;

            if ($newQuantity > $maxStock) {
                return response()->json([
                    'success' => false,
                    'message' => "Stok tidak mencukupi. Stok tersedia: {$maxStock}. Jumlah di keranjang Anda: {$currentQuantity}."
                ], 422);
            }

            if ($cartItem) {
                $cartItem->quantity = $newQuantity;
                $cartItem->save();
            } else {
                CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $productId,
                    'variant_id' => $variantId,
                    'quantity' => $quantity,
                ]);
            }

            $cart->load([
                'items.product.images',
                'items.product.umkmProfile',
                'items.variant'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil ditambahkan ke keranjang.',
                'data' => $cart
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan ke keranjang: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat memiliki keranjang belanja.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'cart_item_id' => 'nullable|integer|exists:cart_items,id',
            'product_id' => 'required_without:cart_item_id|integer|exists:products,id',
            'variant_id' => 'nullable|integer|exists:product_variants,id',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $cart = Cart::firstOrCreate(['customer_id' => $user->customer->id]);

            if ($request->has('cart_item_id')) {
                $cartItem = CartItem::where('id', $request->cart_item_id)
                    ->where('cart_id', $cart->id)
                    ->first();
            } else {
                $cartItem = CartItem::where('cart_id', $cart->id)
                    ->where('product_id', $request->product_id)
                    ->where('variant_id', $request->variant_id)
                    ->first();
            }

            if (!$cartItem) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item keranjang tidak ditemukan.'
                ], 404);
            }

            $productId = $cartItem->product_id;
            $variantId = $cartItem->variant_id;
            $quantity = $request->quantity;

            $product = Product::find($productId);
            $maxStock = $product->stock;

            if ($variantId) {
                $variant = ProductVariant::where('id', $variantId)
                    ->where('product_id', $productId)
                    ->first();
                if ($variant) {
                    $maxStock = $variant->stock;
                }
            }

            if ($quantity > $maxStock) {
                return response()->json([
                    'success' => false,
                    'message' => "Stok tidak mencukupi. Stok tersedia: {$maxStock}."
                ], 422);
            }

            $cartItem->quantity = $quantity;
            $cartItem->save();

            $cart->load([
                'items.product.images',
                'items.product.umkmProfile',
                'items.variant'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Jumlah produk berhasil diperbarui.',
                'data' => $cart
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui item keranjang: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat memiliki keranjang belanja.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'cart_item_id' => 'nullable|integer|exists:cart_items,id',
            'product_id' => 'nullable|integer|exists:products,id',
            'variant_id' => 'nullable|integer|exists:product_variants,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $cart = Cart::firstOrCreate(['customer_id' => $user->customer->id]);

            if ($request->has('cart_item_id') || $request->has('product_id')) {
                if ($request->has('cart_item_id')) {
                    $cartItem = CartItem::where('id', $request->cart_item_id)
                        ->where('cart_id', $cart->id)
                        ->first();
                } else {
                    $cartItem = CartItem::where('cart_id', $cart->id)
                        ->where('product_id', $request->product_id)
                        ->where('variant_id', $request->variant_id)
                        ->first();
                }

                if (!$cartItem) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Item keranjang tidak ditemukan.'
                    ], 404);
                }

                $cartItem->delete();
                $message = 'Item berhasil dihapus dari keranjang.';
            } else {
                CartItem::where('cart_id', $cart->id)->delete();
                $message = 'Keranjang belanja berhasil dikosongkan.';
            }

            $cart->load([
                'items.product.images',
                'items.product.umkmProfile',
                'items.variant'
            ]);

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $cart
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus item keranjang: ' . $e->getMessage()
            ], 500);
        }
    }

    public function clear(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $cart = Cart::where('customer_id', $user->customer->id)->first();
        if ($cart) {
            CartItem::where('cart_id', $cart->id)->delete();
        }

        return response()->json(['success' => true, 'message' => 'Keranjang berhasil dikosongkan.']);
    }
}
