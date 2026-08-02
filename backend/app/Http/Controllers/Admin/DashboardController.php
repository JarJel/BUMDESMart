<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BumdesProfile;
use App\Models\Order;
use App\Models\Product;
use App\Models\UmkmProfile;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    private function getBumdesProfile(Request $request): BumdesProfile
    {
        return BumdesProfile::where('user_id', $request->user()->id)->firstOrFail();
    }

    public function stats(Request $request)
    {
        $bumdes = $this->getBumdesProfile($request);

        $umkmIds = UmkmProfile::where('bumdes_profile_id', $bumdes->id)->pluck('id');

        $umkmAktif = UmkmProfile::where('bumdes_profile_id', $bumdes->id)
            ->where('status', 'active')
            ->count();

        $pesananHariIni = Order::whereIn('umkm_profile_id', $umkmIds)
            ->whereDate('created_at', today())
            ->count();

        $pendapatanBulanIni = Order::whereIn('umkm_profile_id', $umkmIds)
            ->whereIn('status', ['completed', 'delivered'])
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->sum('bumdes_fee');

        $totalProduk = Product::whereIn('umkm_profile_id', $umkmIds)->count();

        return response()->json([
            'data' => [
                'umkm_aktif'           => $umkmAktif,
                'pesanan_hari_ini'     => $pesananHariIni,
                'pendapatan_bulan_ini' => (float) $pendapatanBulanIni,
                'total_produk'         => $totalProduk,
            ],
        ]);
    }
}
