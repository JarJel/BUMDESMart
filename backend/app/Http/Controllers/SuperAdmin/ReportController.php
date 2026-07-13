<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\BumdesProfile;
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

        return response()->json([
            'data' => [
                'users'                => $userStats,
                'bumdes'               => $bumdesStats,
                'umkm'                 => $umkmStats,
                'products'             => $productStats,
                'recent_registrations' => $last7Days,
                'top_bumdes'           => $topBumdes,
            ],
        ]);
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
