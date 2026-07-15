<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\UmkmProfile;
use App\Models\BumdesProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class PublicStatsController extends Controller
{
    public function index(): JsonResponse
    {
        $stats = Cache::remember('public_stats', 300, function () {
            return [
                'umkm_aktif'       => UmkmProfile::where('status', 'active')->count(),
                'produk_tersedia'  => Product::where('status', 'active')->count(),
                'transaksi_selesai'=> Order::whereIn('status', ['delivered', 'completed'])->count(),
                'desa_binaan'      => BumdesProfile::count(),
            ];
        });

        return response()->json(['data' => $stats]);
    }
}
