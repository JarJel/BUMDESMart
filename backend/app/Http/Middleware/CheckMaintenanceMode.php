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

        $user = $request->user();
        if ($user && $user->hasRole('super_admin')) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Sistem sedang dalam maintenance. Silakan coba beberapa saat lagi.',
        ], 503);
    }
}
