<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Exception;

class ProductSearchController extends Controller
{
    /**
     * Live search autocomplete untuk Produk BUMDESMart.
     */
    public function search(Request $request)
    {
        try {
            $query = $request->query('q');

            if (!$query || strlen($query) < 2) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            // Cari produk aktif dengan batasan maksimal 10 hasil preview
            $results = Product::query()
                ->where('status', 'active')
                // Optimasi query menggunakan LIKE (atau ganti fulltext index jika tabel besar)
                ->where('name', 'LIKE', '%' . $query . '%')
                ->select(['id', 'name', 'slug', 'price'])
                ->with(['primaryImage:id,product_id,file_path,is_primary'])
                ->limit(10)
                ->get()
                ->map(function ($product) {
                    // Ambil primary image url jika ada
                    $fotoUrl = null;
                    if ($product->primaryImage && $product->primaryImage->file_path) {
                        $path = $product->primaryImage->file_path;
                        $fotoUrl = str_starts_with($path, 'http') ? $path : asset('storage/' . $path);
                    }

                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'slug' => $product->slug,
                        'price' => (float) $product->price,
                        'foto_url' => $fotoUrl,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Pencarian produk berhasil',
                'data' => $results
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan pencarian',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
