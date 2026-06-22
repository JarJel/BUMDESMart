<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Wishlist;
use App\Models\Product;
use Illuminate\Support\Facades\Validator;
use Exception;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat memiliki wishlist.'
            ], 403);
        }

        try {
            $wishlist = Wishlist::where('customer_id', $user->customer->id)
                ->with(['product.images', 'product.umkmProfile'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $wishlist
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil wishlist: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat menambah wishlist.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'product_id' => 'required|integer|exists:products,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $customerId = $user->customer->id;
            $productId = $request->product_id;

            // Check if already exists in wishlist
            $exists = Wishlist::where('customer_id', $customerId)
                ->where('product_id', $productId)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk sudah ada di wishlist.'
                ], 400);
            }

            $wishlist = Wishlist::create([
                'customer_id' => $customerId,
                'product_id' => $productId,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil ditambahkan ke wishlist.',
                'data' => $wishlist
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan ke wishlist: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, $productId)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat mengubah wishlist.'
            ], 403);
        }

        try {
            $wishlist = Wishlist::where('customer_id', $user->customer->id)
                ->where('product_id', $productId)
                ->first();

            if (!$wishlist) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk tidak ditemukan di wishlist.'
                ], 404);
            }

            $wishlist->delete();

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil dihapus dari wishlist.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus dari wishlist: ' . $e->getMessage()
            ], 500);
        }
    }
}
