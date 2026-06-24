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

            return response()->json([
                'success' => true,
                'message' => 'Detail toko berhasil diambil.',
                'data' => $seller
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
