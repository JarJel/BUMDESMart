<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Models\UmkmProfile;
use Illuminate\Http\Request;
use Exception;

class SellerController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = UmkmProfile::query()->where('status', 'active');

            if ($request->has('search') && !empty($request->search)) {
                $query->where('shop_name', 'like', '%' . $request->search . '%');
            }

            if ($request->has('limit')) {
                $limit = (int) $request->limit;
                $sellers = $query->limit($limit)->get();
            } else {
                $sellers = $query->paginate(12);
            }

            return response()->json([
                'success' => true,
                'message' => 'Daftar toko berhasil diambil.',
                'data' => $sellers
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data toko.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($idOrSlug)
    {
        try {
            $seller = UmkmProfile::where('status', 'active')
                ->where(function($query) use ($idOrSlug) {
                    $query->where('id', $idOrSlug)
                          ->orWhere('slug', $idOrSlug);
                })
                ->first();

            if (!$seller) {
                return response()->json([
                    'success' => false,
                    'message' => 'Toko tidak ditemukan atau tidak aktif.'
                ], 404);
            }

            $data = $seller->only([
                'id', 'shop_name', 'slug', 'owner_name', 'email', 'phone',
                'logo', 'banner', 'description', 'address', 'city', 'province',
                'postal_code', 'rating', 'business_category', 'verified_at',
            ]);

            // Computed stats
            $data['total_sold']     = (int) $seller->products()->sum('sold_count');
            $data['products_count'] = (int) $seller->products()->where('status', 'active')->count();

            // Public trust badges (boolean only — dokumen asli tidak diekspos)
            $data['has_nib']        = !empty($seller->nib);
            $data['has_npwp']       = !empty($seller->npwp);
            $data['has_halal_cert'] = !empty($seller->halal_cert);

            return response()->json([
                'success' => true,
                'message' => 'Detail toko berhasil diambil.',
                'data'    => $data,
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail toko.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
