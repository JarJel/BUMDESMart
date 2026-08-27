<?php

namespace App\Http\Controllers;

use App\Models\SiteVisit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SiteVisitController extends Controller
{
    /**
     * Catat kunjungan baru (dipanggil dari frontend saat load halaman).
     * Menggunakan session_id untuk menghindari penghitungan ganda per hari.
     */
    public function track(Request $request): JsonResponse
    {
        $sessionId  = $request->input('session_id');
        $page       = $request->input('page', '/');
        $today      = now()->toDateString();

        if (! $sessionId) {
            return response()->json(['message' => 'session_id required'], 422);
        }

        // Hanya catat 1x per session per hari
        $alreadyVisited = SiteVisit::where('session_id', $sessionId)
            ->where('visited_date', $today)
            ->exists();

        if (! $alreadyVisited) {
            SiteVisit::create([
                'session_id'   => $sessionId,
                'ip_address'   => $request->ip(),
                'user_agent'   => substr($request->userAgent() ?? '', 0, 500),
                'page'         => $page,
                'user_id'      => $request->user()?->id,
                'visited_date' => $today,
            ]);
        }

        return response()->json(['recorded' => ! $alreadyVisited]);
    }
}
