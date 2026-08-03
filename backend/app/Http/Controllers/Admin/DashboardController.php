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

    private const MONTH_LABELS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

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

    public function chartData(Request $request)
    {
        $bumdes = BumdesProfile::where('user_id', $request->user()->id)->first();
        $year   = (int) $request->query('year', now()->year);

        if (!$bumdes) {
            $empty = collect(range(1, 12))->map(fn ($m) => [
                'label'   => self::MONTH_LABELS[$m - 1],
                'umkm'    => 0,
                'revenue' => 0.0,
            ]);
            return response()->json(['data' => $empty]);
        }
        $umkmIds = UmkmProfile::where('bumdes_profile_id', $bumdes->id)->pluck('id');

        $umkmByMonth = UmkmProfile::where('bumdes_profile_id', $bumdes->id)
            ->selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->whereYear('created_at', $year)
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $revenueByMonth = Order::whereIn('umkm_profile_id', $umkmIds)
            ->whereIn('status', ['completed', 'delivered'])
            ->whereYear('created_at', $year)
            ->selectRaw('MONTH(created_at) as month, SUM(bumdes_fee) as total')
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $data = collect(range(1, 12))->map(fn ($m) => [
            'label'   => self::MONTH_LABELS[$m - 1],
            'umkm'    => $umkmByMonth->get($m)?->count ?? 0,
            'revenue' => (float) ($revenueByMonth->get($m)?->total ?? 0),
        ]);

        return response()->json(['data' => $data]);
    }
}
