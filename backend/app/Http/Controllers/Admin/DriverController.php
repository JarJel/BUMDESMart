<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BumdesProfile;
use App\Models\DriverProfile;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    private function getBumdesProfile(Request $request): BumdesProfile
    {
        $bumdes = BumdesProfile::where('user_id', $request->user()->id)->first();
        if (!$bumdes) {
            abort(response()->json(['message' => 'Profil BUMDes tidak ditemukan.'], 404));
        }
        return $bumdes;
    }

    public function index(Request $request)
    {
        $bumdes = $this->getBumdesProfile($request);

        $query = DriverProfile::with('user:id,name,email,phone')
            ->where('bumdes_profile_id', $bumdes->id);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', fn($u) => $u->where('name', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%"))
                  ->orWhere('vehicle_plate', 'like', "%$search%");
            });
        }

        if ($request->filled('status')) {
            match ($request->status) {
                'unverified' => $query->where('is_verified', false)->where('is_suspended', false),
                'verified'   => $query->where('is_verified', true)->where('is_suspended', false),
                'suspended'  => $query->where('is_suspended', true),
                default      => null,
            };
        }

        if ($request->filled('vehicle_type')) {
            $query->where('vehicle_type', $request->vehicle_type);
        }

        $drivers = $query->latest()->get()->map(fn($d) => array_merge($d->toArray(), [
            'name'             => $d->user?->name,
            'email'            => $d->user?->email,
            'phone'            => $d->user?->phone,
            'photo_profile_url' => $d->photo_profile ? asset('storage/' . $d->photo_profile) : null,
            'photo_ktp_url'    => $d->photo_ktp    ? asset('storage/' . $d->photo_ktp)    : null,
        ]));

        return response()->json(['data' => $drivers]);
    }

    public function show(Request $request, int $id)
    {
        $bumdes = $this->getBumdesProfile($request);

        $driver = DriverProfile::with('user:id,name,email,phone')
            ->where('bumdes_profile_id', $bumdes->id)
            ->findOrFail($id);

        return response()->json(['data' => array_merge($driver->toArray(), [
            'name'              => $driver->user?->name,
            'email'             => $driver->user?->email,
            'phone'             => $driver->user?->phone,
            'photo_profile_url' => $driver->photo_profile ? asset('storage/' . $driver->photo_profile) : null,
            'photo_ktp_url'     => $driver->photo_ktp    ? asset('storage/' . $driver->photo_ktp)    : null,
        ])]);
    }

    public function verify(Request $request, int $id)
    {
        $bumdes = $this->getBumdesProfile($request);

        $driver = DriverProfile::where('bumdes_profile_id', $bumdes->id)->findOrFail($id);
        $driver->update(['is_verified' => true, 'is_suspended' => false]);

        return response()->json(['message' => 'Kurir berhasil diverifikasi.']);
    }

    public function reject(Request $request, int $id)
    {
        $bumdes = $this->getBumdesProfile($request);

        $driver = DriverProfile::where('bumdes_profile_id', $bumdes->id)->findOrFail($id);
        $driver->update(['is_verified' => false]);

        return response()->json(['message' => 'Pendaftaran kurir ditolak.']);
    }

    public function suspend(Request $request, int $id)
    {
        $bumdes = $this->getBumdesProfile($request);

        $request->validate(['reason' => 'required|string|max:500']);

        $driver = DriverProfile::where('bumdes_profile_id', $bumdes->id)->findOrFail($id);
        $driver->update([
            'is_suspended'     => true,
            'suspension_reason' => $request->reason,
            'is_available'     => false,
        ]);

        return response()->json(['message' => 'Kurir berhasil disuspend.']);
    }

    public function unsuspend(Request $request, int $id)
    {
        $bumdes = $this->getBumdesProfile($request);

        $driver = DriverProfile::where('bumdes_profile_id', $bumdes->id)->findOrFail($id);
        $driver->update(['is_suspended' => false, 'suspension_reason' => null]);

        return response()->json(['message' => 'Suspend kurir berhasil dicabut.']);
    }

    public function stats(Request $request)
    {
        $bumdes = $this->getBumdesProfile($request);

        $base = DriverProfile::where('bumdes_profile_id', $bumdes->id);

        return response()->json(['data' => [
            'total'      => (clone $base)->count(),
            'unverified' => (clone $base)->where('is_verified', false)->where('is_suspended', false)->count(),
            'verified'   => (clone $base)->where('is_verified', true)->where('is_suspended', false)->count(),
            'suspended'  => (clone $base)->where('is_suspended', true)->count(),
        ]]);
    }
}
