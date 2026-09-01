<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BumdesProfile;
use App\Models\Product;
use Illuminate\Http\Request;

class AdminProductController extends Controller
{
    private function getBumdesProfile(Request $request): ?BumdesProfile
    {
        return BumdesProfile::where('user_id', $request->user()->id)->first();
    }

    public function index(Request $request)
    {
        $search = $request->query('search');

        $query = Product::with(['umkmProfile', 'category', 'images', 'variants.options']);
        
        if ($request->user()->role !== 'super_admin') {
            $bumdes = $this->getBumdesProfile($request);
            if (!$bumdes) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 10, 'total' => 0]
                ]);
            }
            $query->whereHas('umkmProfile', function($q) use ($bumdes) {
                $q->where('bumdes_profile_id', $bumdes->id);
            });
        }

        if ($search) {
            $query->where(function($q2) use ($search) {
                $q2->where('name', 'like', "%{$search}%")
                   ->orWhereHas('umkmProfile', function($q) use ($search) {
                       $q->where('shop_name', 'like', "%{$search}%");
                   });
            });
        }

        $products = $query->latest()->paginate(10);

        return response()->json([
            'success' => true,
            'data'    => $products->items(),
            'meta'    => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'per_page'     => $products->perPage(),
                'total'        => $products->total(),
            ]
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $query = Product::query();
        
        if ($request->user()->role !== 'super_admin') {
            $bumdes = $this->getBumdesProfile($request);
            if (!$bumdes) {
                return response()->json(['message' => 'Profil BUMDes tidak ditemukan.'], 404);
            }
            $query->whereHas('umkmProfile', function($q) use ($bumdes) {
                $q->where('bumdes_profile_id', $bumdes->id);
            });
        }

        $product = $query->findOrFail($id);

        // Soft delete the product
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus.'
        ]);
    }
}
