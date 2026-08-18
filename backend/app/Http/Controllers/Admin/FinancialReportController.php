<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BumdesProfile;
use App\Models\DriverProfile;
use App\Models\Order;
use App\Models\UmkmProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinancialReportController extends Controller
{
    private function getBumdesId(Request $request): int
    {
        $bumdes = BumdesProfile::where('user_id', $request->user()->id)->first();
        if (!$bumdes) {
            abort(response()->json(['message' => 'Profil BUMDes tidak ditemukan.'], 404));
        }
        return $bumdes->id;
    }

    /**
     * GET /admin/reports/financial
     * Summary keuangan BUMDes dengan date range filter.
     *
     * Query params: ?from=2026-01-01&to=2026-12-31&period=month|week|day
     */
    public function summary(Request $request)
    {
        $bumdesId = $this->getBumdesId($request);

        $from = $request->from ? now()->parse($request->from)->startOfDay() : now()->startOfMonth();
        $to   = $request->to   ? now()->parse($request->to)->endOfDay()     : now()->endOfMonth();

        // Base query: orders dari UMKM yang tergabung di BUMDes ini
        $base = Order::join('umkm_profiles', 'orders.umkm_profile_id', '=', 'umkm_profiles.id')
            ->where('umkm_profiles.bumdes_profile_id', $bumdesId)
            ->whereIn('orders.status', ['delivered', 'completed'])
            ->whereBetween('orders.updated_at', [$from, $to]);

        $gmv       = (clone $base)->sum('orders.total');
        $bumdesFee = (clone $base)->sum('orders.bumdes_fee');
        $serviceFee= (clone $base)->sum('orders.service_fee');
        $ordersCount=(clone $base)->count('orders.id');
        $avgOrder  = $ordersCount > 0 ? $gmv / $ordersCount : 0;

        // Top mitra by revenue
        $topMitra = (clone $base)
            ->select('umkm_profiles.shop_name', DB::raw('SUM(orders.total) as revenue'), DB::raw('COUNT(orders.id) as order_count'))
            ->groupBy('umkm_profiles.id', 'umkm_profiles.shop_name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        // Monthly breakdown (group by month)
        $period = $request->period ?? 'month';
        if ($period === 'day') {
            $dateFormat = '%Y-%m-%d';
            $labelFormat= 'd M';
        } elseif ($period === 'week') {
            $dateFormat = '%x-%v';
            $labelFormat= 'W%v';
        } else {
            $dateFormat = '%Y-%m';
            $labelFormat= 'M Y';
        }

        $trend = (clone $base)
            ->select(
                DB::raw("DATE_FORMAT(orders.updated_at, '{$dateFormat}') as period"),
                DB::raw('SUM(orders.total) as gmv'),
                DB::raw('SUM(orders.bumdes_fee) as bumdes_fee'),
                DB::raw('COUNT(orders.id) as order_count')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        // Driver withdrawals/earnings in period
        $driverEarnings = DB::table('driver_earnings')
            ->join('driver_profiles', 'driver_earnings.driver_profile_id', '=', 'driver_profiles.id')
            ->where('driver_profiles.bumdes_profile_id', $bumdesId)
            ->whereBetween('driver_earnings.created_at', [$from, $to])
            ->sum('driver_earnings.amount');

        // Fallback: if no driver_earnings table, estimate from orders shipping_cost
        $driverEarningsFromOrders = (clone $base)->sum('orders.shipping_cost');

        return response()->json([
            'data' => [
                'period' => [
                    'from' => $from->format('d M Y'),
                    'to'   => $to->format('d M Y'),
                ],
                'summary' => [
                    'gmv'          => (float) $gmv,
                    'bumdes_fee'   => (float) $bumdesFee,
                    'service_fee'  => (float) $serviceFee,
                    'orders_count' => (int)   $ordersCount,
                    'avg_order'    => (float) $avgOrder,
                    'driver_earnings_estimate' => (float) $driverEarningsFromOrders,
                ],
                'trend'     => $trend,
                'top_mitra' => $topMitra,
            ],
        ]);
    }

    /**
     * GET /admin/reports/financial/mitra/{mitraId}
     * Detail laporan keuangan per UMKM mitra.
     */
    public function mitraDetail(Request $request, int $mitraId)
    {
        $bumdesId = $this->getBumdesId($request);

        $mitra = UmkmProfile::where('bumdes_profile_id', $bumdesId)->findOrFail($mitraId);

        $from = $request->from ? now()->parse($request->from)->startOfDay() : now()->startOfMonth();
        $to   = $request->to   ? now()->parse($request->to)->endOfDay()     : now()->endOfMonth();

        $orders = Order::where('umkm_profile_id', $mitraId)
            ->whereIn('status', ['delivered', 'completed'])
            ->whereBetween('updated_at', [$from, $to])
            ->select(['id', 'order_code', 'total', 'bumdes_fee', 'shipping_cost', 'discount', 'created_at', 'updated_at', 'status'])
            ->latest('updated_at')
            ->get();

        return response()->json([
            'data' => [
                'mitra'  => ['id' => $mitra->id, 'shop_name' => $mitra->shop_name, 'owner_name' => $mitra->owner_name],
                'period' => ['from' => $from->format('d M Y'), 'to' => $to->format('d M Y')],
                'summary' => [
                    'gmv'        => (float) $orders->sum('total'),
                    'bumdes_fee' => (float) $orders->sum('bumdes_fee'),
                    'orders'     => $orders->count(),
                ],
                'orders' => $orders,
            ],
        ]);
    }
}
