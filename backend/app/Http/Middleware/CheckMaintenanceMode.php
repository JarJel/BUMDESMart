<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;

class CheckMaintenanceMode
{
    public function handle(Request $request, Closure $next)
    {
        if (Setting::getValue('maintenance_mode', '0') !== '1') {
            return $next($request);
        }

        // Superadmin tetap bisa akses
        $user = $request->user();
        if ($user && $user->hasRole('super_admin')) {
            return $next($request);
        }

        return response()->json([
            'maintenance' => true,
            'message'     => 'Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.',
        ], 503);
    }
}
