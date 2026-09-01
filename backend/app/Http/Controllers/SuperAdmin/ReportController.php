<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\BumdesProfile;
use App\Models\Order;
use App\Models\SiteVisit;
use App\Models\UmkmProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function overview()
    {
        $users = User::selectRaw('role, status, COUNT(*) as total')
            ->groupBy('role', 'status')
            ->get();

        $userStats = [
            'total'       => User::count(),
            'super_admin' => User::where('role', 'super_admin')->count(),
            'admin_bumdes'=> User::where('role', 'admin_bumdes')->count(),
            'umkm'        => User::where('role', 'umkm')->count(),
            'customer'    => User::where('role', 'customer')->count(),
            'active'      => User::where('status', 'active')->count(),
            'inactive'    => User::where('status', 'inactive')->count(),
        ];

        $bumdesStats = [
            'total'    => BumdesProfile::count(),
            'active'   => BumdesProfile::where('status', 'active')->count(),
            'inactive' => BumdesProfile::where('status', 'inactive')->count(),
        ];

        $umkmStats = [
            'total'    => UmkmProfile::count(),
            'pending'  => UmkmProfile::where('status', 'pending')->count(),
            'active'   => UmkmProfile::where('status', 'active')->count(),
            'rejected' => UmkmProfile::where('status', 'rejected')->count(),
        ];

        $productStats = [
            'total'  => DB::table('products')->count(),
            'active' => DB::table('products')->where('status', 'active')->count(),
        ];

        // Registrasi 7 hari terakhir
        $recentRegistrations = User::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(6))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $last7Days = collect(range(6, 0))->map(function ($daysAgo) use ($recentRegistrations) {
            $date = now()->subDays($daysAgo)->format('Y-m-d');
            return [
                'date'  => $date,
                'label' => now()->subDays($daysAgo)->format('d M'),
                'count' => $recentRegistrations->get($date)?->count ?? 0,
            ];
        });

        // BUMDes dengan mitra terbanyak
        $topBumdes = BumdesProfile::select('id', 'name', 'city')
            ->withCount(['umkmProfiles as umkm_count' => fn($q) => $q->where('status', 'active')])
            ->orderByDesc('umkm_count')
            ->limit(5)
            ->get();

        // Pesanan & pendapatan platform per bulan tahun ini
        $ordersPerMonth = Order::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->whereYear('created_at', now()->year)
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $completedStatuses = ['completed', 'delivered'];

        $revenuePerMonth = Order::selectRaw('MONTH(created_at) as month, SUM(bumdes_fee + COALESCE(service_fee, 0)) as total')
            ->whereIn('status', $completedStatuses)
            ->whereYear('created_at', now()->year)
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $pendapatanUmkmPerMonth = Order::selectRaw('MONTH(created_at) as month, SUM(sub_total - bumdes_fee - COALESCE(service_fee, 0)) as total')
            ->whereIn('status', $completedStatuses)
            ->whereYear('created_at', now()->year)
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $monthLabels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
        $monthlyData = collect(range(1, 12))->map(fn ($m) => [
            'label'          => $monthLabels[$m - 1],
            'orders'         => $ordersPerMonth->get($m)?->count ?? 0,
            'revenue'        => (float) ($revenuePerMonth->get($m)?->total ?? 0),
            'pendapatan_umkm'=> (float) ($pendapatanUmkmPerMonth->get($m)?->total ?? 0),
        ]);

        $totalTransaksi    = Order::whereIn('status', $completedStatuses)->count();
        $totalPembeli      = Order::whereIn('status', $completedStatuses)->distinct('customer_id')->count('customer_id');
        $totalPendapatanUmkm = Order::whereIn('status', $completedStatuses)
            ->selectRaw('SUM(sub_total - bumdes_fee - COALESCE(service_fee, 0)) as total')
            ->value('total') ?? 0;

        return response()->json([
            'data' => [
                'users'                 => $userStats,
                'bumdes'                => $bumdesStats,
                'umkm'                  => $umkmStats,
                'products'              => $productStats,
                'recent_registrations'  => $last7Days,
                'top_bumdes'            => $topBumdes,
                'monthly_data'          => $monthlyData,
                'total_transaksi'       => $totalTransaksi,
                'total_pembeli'         => $totalPembeli,
                'total_pendapatan_umkm' => (float) $totalPendapatanUmkm,
            ],
        ]);
    }

    public function visitStats(Request $request)
    {
        $days = max(1, min(90, (int) $request->query('days', 7)));

        $rows = SiteVisit::selectRaw('visited_date as date, COUNT(*) as count')
            ->where('visited_date', '>=', now()->subDays($days - 1)->toDateString())
            ->groupBy('visited_date')
            ->orderBy('visited_date')
            ->get()
            ->keyBy('date');

        $data = collect(range($days - 1, 0))->map(function ($daysAgo) use ($rows) {
            $date = now()->subDays($daysAgo)->format('Y-m-d');
            return [
                'date'  => $date,
                'label' => now()->subDays($daysAgo)->locale('id')->isoFormat('D MMM'),
                'count' => (int) ($rows->get($date)?->count ?? 0),
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function umkmPerformance(Request $request)
    {
        $data = UmkmProfile::select('umkm_profiles.id', 'umkm_profiles.shop_name', 'umkm_profiles.status')
            ->selectRaw('COUNT(DISTINCT orders.id) as total_orders')
            ->selectRaw('COALESCE(SUM(CASE WHEN orders.status IN ("completed","delivered") THEN orders.sub_total - orders.bumdes_fee - COALESCE(orders.service_fee,0) ELSE 0 END), 0) as total_revenue')
            ->selectRaw('COALESCE(AVG(product_reviews.rating), 0) as avg_rating')
            ->leftJoin('orders', 'orders.umkm_profile_id', '=', 'umkm_profiles.id')
            ->leftJoin('products as pr_p', 'pr_p.umkm_profile_id', '=', 'umkm_profiles.id')
            ->leftJoin('product_reviews', 'product_reviews.product_id', '=', 'pr_p.id')
            ->groupBy('umkm_profiles.id', 'umkm_profiles.shop_name', 'umkm_profiles.status')
            ->orderByDesc('total_revenue')
            ->with('user:id,name,email')
            ->limit(100)
            ->get();

        return response()->json(['data' => $data]);
    }

    public function platformStats()
    {
        $completedStatuses = ['completed', 'delivered'];

        $totalVisits    = SiteVisit::count();
        $visitToday     = SiteVisit::where('visited_date', now()->toDateString())->count();
        $totalOrders    = Order::whereIn('status', $completedStatuses)->count();
        $totalRevenue   = Order::whereIn('status', $completedStatuses)
            ->selectRaw('SUM(bumdes_fee + COALESCE(service_fee, 0)) as total')
            ->value('total') ?? 0;
        $totalUsers     = User::count();
        $totalUmkm      = UmkmProfile::where('status', 'active')->count();

        $ordersPerMonth = Order::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->whereIn('status', $completedStatuses)
            ->whereYear('created_at', now()->year)
            ->groupBy('month')
            ->get()->keyBy('month');

        $feePerMonth = Order::selectRaw('MONTH(created_at) as month, SUM(bumdes_fee + COALESCE(service_fee, 0)) as total')
            ->whereIn('status', $completedStatuses)
            ->whereYear('created_at', now()->year)
            ->groupBy('month')
            ->get()->keyBy('month');

        $monthLabels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
        $monthly = collect(range(1, 12))->map(fn ($m) => [
            'label'   => $monthLabels[$m - 1],
            'orders'  => (int) ($ordersPerMonth->get($m)?->count ?? 0),
            'revenue' => (float) ($feePerMonth->get($m)?->total ?? 0),
        ]);

        return response()->json(['data' => [
            'total_visits'  => $totalVisits,
            'visit_today'   => $visitToday,
            'total_orders'  => $totalOrders,
            'total_revenue' => (float) $totalRevenue,
            'total_users'   => $totalUsers,
            'total_umkm'    => $totalUmkm,
            'monthly'       => $monthly,
        ]]);
    }

    public function bumdesBreakdown()
    {
        $data = BumdesProfile::select('id', 'name', 'city', 'province', 'status')
            ->withCount([
                'umkmProfiles as total_umkm',
                'umkmProfiles as active_umkm' => fn($q) => $q->where('status', 'active'),
            ])
            ->withCount(['requiredDocuments'])
            ->orderByDesc('total_umkm')
            ->get();

        return response()->json(['data' => $data]);
    }
}
