<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BumdesProfile;
use App\Models\UmkmProfile;
use Illuminate\Http\Request;

class MitraPerformanceController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin_bumdes') {
            $bumdes = BumdesProfile::where('user_id', $user->id)->first();
            if (!$bumdes) {
                return response()->json(['message' => 'Profil BUMDes tidak ditemukan.'], 404);
            }
            $bumdesId = $bumdes->id;
        } else {
            $bumdesId = $request->integer('bumdes_id');
            if (!$bumdesId) {
                return response()->json(['message' => 'Parameter bumdes_id wajib untuk Super Admin.'], 422);
            }
            $bumdes = BumdesProfile::findOrFail($bumdesId);
        }

        $startOfMonth = now()->startOfMonth();

        $mitra = UmkmProfile::where('bumdes_profile_id', $bumdesId)
            ->withCount([
                'products as active_products' => fn($q) => $q->where('status', 'active'),
                'orders as total_orders',
                'orders as orders_this_month'  => fn($q) => $q->where('created_at', '>=', $startOfMonth),
            ])
            ->withSum(
                ['orders as total_revenue' => fn($q) => $q->where('status', 'delivered')],
                'total'
            )
            ->withSum(
                ['orders as revenue_this_month' => fn($q) => $q->where('status', 'delivered')->where('updated_at', '>=', $startOfMonth)],
                'total'
            )
            ->select(['id', 'shop_name', 'slug', 'logo', 'owner_name', 'status', 'rating', 'is_open', 'created_at'])
            ->get()
            ->map(function ($m) {
                return [
                    'id'                => $m->id,
                    'shop_name'         => $m->shop_name,
                    'slug'              => $m->slug,
                    'logo'              => $m->logo,
                    'owner_name'        => $m->owner_name,
                    'status'            => $m->status,
                    'rating'            => (float) $m->rating,
                    'is_open'           => (bool) $m->is_open,
                    'active_products'   => (int) $m->active_products,
                    'total_orders'      => (int) $m->total_orders,
                    'orders_this_month' => (int) $m->orders_this_month,
                    'total_revenue'     => (float) $m->total_revenue,
                    'revenue_this_month'=> (float) $m->revenue_this_month,
                    'joined_at'         => $m->created_at?->format('d M Y'),
                ];
            });

        $summary = [
            'bumdes_name'        => $bumdes->name,
            'total_mitra'        => $mitra->count(),
            'active_mitra'       => $mitra->where('status', 'active')->count(),
            'total_revenue_month'=> $mitra->sum('revenue_this_month'),
            'total_orders_month' => $mitra->sum('orders_this_month'),
        ];

        return response()->json(['data' => $mitra, 'summary' => $summary]);
    }
}
