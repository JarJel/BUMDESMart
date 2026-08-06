<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\BroadcastRegistration;
use App\Models\BumdesBroadcast;
use App\Models\BumdesProfile;
use App\Models\DriverProfile;
use App\Models\UmkmProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

        // Support role 'pengirim' dan alias 'driver'
        $bumdesId = match ($user->role) {
            'umkm'                 => UmkmProfile::where('user_id', $user->id)->value('bumdes_profile_id'),
            'pengirim', 'driver'   => DriverProfile::where('user_id', $user->id)->value('bumdes_profile_id'),
            default                => null,
        };

        if (!$bumdesId) {
            return response()->json(['data' => [
                'data'         => [],
                'current_page' => 1,
                'total'        => 0,
            ]]);
        }

        // Filter berita yang relevan dengan role user
        $relevantTargets = match ($user->role) {
            'umkm'               => ['all', 'umkm', 'umkm_category'],
            'pengirim', 'driver' => ['all', 'driver'],
            default              => ['all'],
        };

        $query = BumdesBroadcast::where('bumdes_profile_id', $bumdesId)
            ->whereIn('target', $relevantTargets)
            ->where(function ($q) {
                // Sembunyikan event yang sudah lewat
                $q->whereNull('event_date')->orWhere('event_date', '>=', now()->toDateString());
            })
            ->with('bumdesProfile:id,name,slug')
            ->orderByDesc('created_at');

        if ($request->category) {
            $query->where('category', $request->category);
        }

        $perPage = min((int) ($request->per_page ?? 10), 50);
        $berita  = $query->paginate($perPage);

        // Tandai apakah user sudah daftar dan enrich data registrasi
        $userId = $user->id;
        $berita->getCollection()->transform(function ($b) use ($userId) {
            $today = now()->toDateString();

            $regCount = $b->allow_registration
                ? BroadcastRegistration::where('broadcast_id', $b->id)->count()
                : 0;

            $b->is_registered = $b->allow_registration
                ? BroadcastRegistration::where('broadcast_id', $b->id)->where('user_id', $userId)->exists()
                : false;

            $b->registration_count = $regCount;

            // Apakah masih bisa mendaftar?
            $deadlinePassed = $b->registration_deadline && $b->registration_deadline->lt(now());
            $isFull         = $b->max_participants && $regCount >= $b->max_participants;
            $b->registrations_open = $b->allow_registration && !$deadlinePassed && !$isFull;
            $b->is_full            = $isFull;
            $b->spots_left         = $b->max_participants ? max(0, $b->max_participants - $regCount) : null;

            return $b;
        });

        return response()->json(['data' => $berita]);
    }

    /**
     * POST /my/berita/{id}/register
     * Daftar ke event (umkm / pengirim).
     */
    public function register(Request $request, int $id)
    {
        $user      = $request->user();
        $broadcast = BumdesBroadcast::findOrFail($id);

        if (!$broadcast->allow_registration) {
            return response()->json(['message' => 'Event ini tidak membuka pendaftaran.'], 422);
        }

        if ($broadcast->event_date && $broadcast->event_date->isPast()) {
            return response()->json(['message' => 'Event sudah berlalu.'], 422);
        }

        if ($broadcast->registration_deadline && $broadcast->registration_deadline->lt(now())) {
            return response()->json(['message' => 'Batas waktu pendaftaran sudah lewat.'], 422);
        }

        if ($broadcast->max_participants) {
            $currentCount = BroadcastRegistration::where('broadcast_id', $broadcast->id)->count();
            if ($currentCount >= $broadcast->max_participants) {
                return response()->json(['message' => 'Kuota peserta sudah penuh.'], 422);
            }
        }

        $type = match ($user->role) {
            'umkm'               => 'umkm',
            'pengirim', 'driver' => 'driver',
            default              => 'umkm',
        };

        $reg = BroadcastRegistration::firstOrCreate(
            ['broadcast_id' => $broadcast->id, 'user_id' => $user->id],
            ['registrant_type' => $type]
        );

        return response()->json([
            'message'    => $reg->wasRecentlyCreated ? 'Pendaftaran berhasil!' : 'Kamu sudah terdaftar.',
            'registered' => true,
        ]);
    }

    /**
     * DELETE /my/berita/{id}/register
     * Batalkan pendaftaran sendiri.
     */
    public function unregister(Request $request, int $id)
    {
        $user      = $request->user();
        $broadcast = BumdesBroadcast::findOrFail($id);

        if ($broadcast->event_date && $broadcast->event_date->isPast()) {
            return response()->json(['message' => 'Event sudah berlalu, tidak bisa membatalkan.'], 422);
        }

        BroadcastRegistration::where('broadcast_id', $id)->where('user_id', $user->id)->delete();

        return response()->json(['message' => 'Pendaftaran berhasil dibatalkan.', 'registered' => false]);
    }

    /**
     * GET /my/berita/{id}/peserta
     * Auth — daftar peserta event ini (alias + foto profil, tanpa hitungan program).
     * Diurutkan berdasarkan waktu daftar (siapa duluan).
     */
    public function peserta(Request $request, int $id)
    {
        $broadcast = BumdesBroadcast::findOrFail($id);

        if (!$broadcast->allow_registration) {
            return response()->json(['data' => []]);
        }

        $regs = BroadcastRegistration::with('user:id,name,avatar')
            ->where('broadcast_id', $id)
            ->orderBy('created_at')
            ->get();

        $currentUserId = $request->user()->id;

        $list = $regs->map(function ($r) use ($currentUserId) {
            $user = $r->user;
            $photo = null;

            if ($r->registrant_type === 'umkm') {
                $profile = UmkmProfile::where('user_id', $user->id)->value('photo_profile');
                $photo   = $profile ? (str_starts_with($profile, '/') ? $profile : '/' . $profile) : null;
            } else {
                $profile = DriverProfile::where('user_id', $user->id)->value('photo_profile');
                $photo   = $profile ? (str_starts_with($profile, '/') ? $profile : '/' . $profile) : null;
            }

            if (!$photo && $user->avatar) {
                $photo = str_starts_with($user->avatar, '/') ? $user->avatar : '/' . $user->avatar;
            }

            // Inisial dari nama: ambil huruf pertama tiap kata, maks 2
            $parts    = explode(' ', trim($user->name ?? ''));
            $initials = strtoupper(
                count($parts) >= 2
                    ? substr($parts[0], 0, 1) . substr($parts[1], 0, 1)
                    : substr($parts[0] ?? '?', 0, 2)
            );

            return [
                'user_id'         => $user->id,
                'name'            => $user->name,
                'initials'        => $initials,
                'photo'           => $photo,
                'registrant_type' => $r->registrant_type,
                'registered_at'   => $r->created_at,
                'is_me'           => $user->id === $currentUserId,
            ];
        });

        $myRank = null;
        foreach ($list as $i => $item) {
            if ($item['is_me']) { $myRank = $i + 1; break; }
        }

        return response()->json([
            'data'    => $list,
            'total'   => $list->count(),
            'my_rank' => $myRank,
        ]);
    }
}
