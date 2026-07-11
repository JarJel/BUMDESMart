<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Exception;

class ProductController extends Controller
{
    public function index(Request $request) {
        try {
            $query = Product::query()->where('status', 'active');

            $search = $request->input('search') ?: $request->input('q');
            if (!empty($search)) {
                $query->where('name', 'like', '%' . $search . '%');
            }

            if ($request->has('category_id') && !empty($request->category_id)) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('umkm_id') && !empty($request->umkm_id)) {
                $query->where('umkm_profile_id', $request->umkm_id);
            }

            $products = $query
                ->select(['id', 'name', 'slug', 'price', 'stock', 'weight', 'category_id', 'umkm_profile_id', 'sold_count', 'status', 'created_at'])
                ->with([
                    'primaryImage:id,product_id,file_path,is_primary',
                    'umkmProfile:id,shop_name,slug',
                    'activeDiscount:id,product_id,type,value,end_date,is_active,max_uses,used_count',
                ])->paginate(12);

            $products->getCollection()->transform(function ($product) {
                if ($product->activeDiscount) {
                    $product->activeDiscount->discounted_price =
                        $product->activeDiscount->calculateDiscountedPrice((float) $product->price);
                }
                return $product;
            });

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil diambil',
                'data' => $products
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil produk',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($idOrSlug) {
        try {
            $product = Product::where('status', 'active')
                ->where(function($query) use ($idOrSlug) {
                    $query->where('id', $idOrSlug)
                          ->orWhere('slug', $idOrSlug);
                })
                ->with([
                    'images',
                    'variants.options',
                    'category',
                    'umkmProfile:id,shop_name,slug,logo,description',
                    'activeDiscount',
                ])
                ->first();

            if ($product && $product->activeDiscount) {
                $product->activeDiscount->discounted_price =
                    $product->activeDiscount->calculateDiscountedPrice((float) $product->price);
            }

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk tidak ditemukan atau tidak aktif.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Detail produk berhasil diambil.',
                'data' => $product
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail produk.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
