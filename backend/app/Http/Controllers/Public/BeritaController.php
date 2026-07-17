<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\BumdesBroadcast;
use App\Models\BumdesProfile;
use App\Models\DriverProfile;
use App\Models\UmkmProfile;
use Illuminate\Http\Request;

class BeritaController extends Controller
{
    /**
     * GET /berita
     * Public — untuk landing page BUMDESMart.
     * Tampilkan semua broadcast dari semua BUMDes (atau filter by bumdes_slug / bumdes_id).
     *
     * Query params:
     *   ?bumdes_slug=nama-bumdes  → berita dari BUMDes tertentu
     *   ?bumdes_id=1              → alternatif filter by id
     *   ?category=pelatihan       → filter by kategori
     *   ?per_page=10              → jumlah per halaman (default 10)
     */
    public function index(Request $request)
    {
        $query = BumdesBroadcast::with('bumdesProfile:id,name,slug,village,city')
            ->orderByDesc('created_at');

        if ($request->bumdes_slug) {
            $bumdes = BumdesProfile::where('slug', $request->bumdes_slug)->first();
            if ($bumdes) $query->where('bumdes_profile_id', $bumdes->id);
        }

        if ($request->bumdes_id) {
            $query->where('bumdes_profile_id', $request->bumdes_id);
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        $perPage = min((int) ($request->per_page ?? 10), 50);
        $berita  = $query->paginate($perPage);

        return response()->json(['data' => $berita]);
    }

    /**
     * GET /berita/{id}
     * Public — detail satu berita.
     */
    public function show(int $id)
    {
        $berita = BumdesBroadcast::with('bumdesProfile:id,name,slug,village,city')->findOrFail($id);
        return response()->json(['data' => $berita]);
    }

    /**
     * GET /my/berita
     * Auth (umkm / pengirim) — berita dari BUMDes milik user yang login.
     * Otomatis filter berdasarkan BUMDes yang menaungi akun tersebut.
     */
    public function myBerita(Request $request)
    {
        $user = $request->user();

        $bumdesId = match ($user->role) {
            'umkm'     => UmkmProfile::where('user_id', $user->id)->value('bumdes_profile_id'),
            'pengirim' => DriverProfile::where('user_id', $user->id)->value('bumdes_profile_id'),
            default    => null,
        };

        if (!$bumdesId) {
            return response()->json(['data' => [
                'data'         => [],
                'current_page' => 1,
                'total'        => 0,
            ]]);
        }

        $query = BumdesBroadcast::where('bumdes_profile_id', $bumdesId)
            ->with('bumdesProfile:id,name,slug')
            ->orderByDesc('created_at');

        if ($request->category) {
            $query->where('category', $request->category);
        }

        $perPage = min((int) ($request->per_page ?? 10), 50);
        $berita  = $query->paginate($perPage);

        return response()->json(['data' => $berita]);
    }
}
