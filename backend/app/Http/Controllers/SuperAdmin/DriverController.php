<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\DriverProfile;
use App\Models\User;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function index(Request $request)
    {
        $query = DriverProfile::with('user:id,name,email,phone,created_at')
            ->select([
                'id', 'user_id', 'vehicle_type', 'vehicle_brand', 'vehicle_plate',
                'vehicle_year', 'sim_type', 'id_number', 'photo_profile', 'photo_ktp',
                'bank_name', 'bank_account_number', 'bank_account_name',
                'is_available', 'is_verified', 'is_suspended', 'suspension_reason',
                'total_deliveries', 'rating', 'created_at',
            ]);

        if ($request->filled('search')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            })->orWhere('vehicle_plate', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('status')) {
            match ($request->status) {
                'verified'   => $query->where('is_verified', true)->where('is_suspended', false),
                'unverified' => $query->where('is_verified', false)->where('is_suspended', false),
                'suspended'  => $query->where('is_suspended', true),
                default      => null,
            };
        }

        if ($request->filled('vehicle_type')) {
            $query->where('vehicle_type', $request->vehicle_type);
        }

        $drivers = $query->latest()->paginate(20);

        // Prefix storage URL for photos
        $drivers->getCollection()->transform(function ($driver) {
            if ($driver->photo_profile) {
                $driver->photo_profile_url = asset('storage/' . $driver->photo_profile);
            }
            if ($driver->photo_ktp) {
                $driver->photo_ktp_url = asset('storage/' . $driver->photo_ktp);
            }
            return $driver;
        });

        return response()->json(['data' => $drivers]);
    }

    public function show($id)
    {
        $driver = DriverProfile::with('user:id,name,email,phone,created_at')
            ->findOrFail($id);

        if ($driver->photo_profile) {
            $driver->photo_profile_url = asset('storage/' . $driver->photo_profile);
        }
        if ($driver->photo_ktp) {
            $driver->photo_ktp_url = asset('storage/' . $driver->photo_ktp);
        }

        return response()->json(['data' => $driver]);
    }

    public function verify($id)
    {
        $driver = DriverProfile::findOrFail($id);
        $driver->update(['is_verified' => true, 'is_suspended' => false, 'suspension_reason' => null]);

        return response()->json(['message' => 'Kurir berhasil diverifikasi.', 'data' => $driver]);
    }

    public function reject($id)
    {
        $driver = DriverProfile::findOrFail($id);
        $driver->update(['is_verified' => false]);

        return response()->json(['message' => 'Kurir ditolak.', 'data' => $driver]);
    }

    public function suspend(Request $request, $id)
    {
        $driver = DriverProfile::findOrFail($id);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $driver->update([
            'is_suspended'     => true,
            'is_available'     => false,
            'suspension_reason' => $validated['reason'],
        ]);

        return response()->json(['message' => 'Kurir berhasil disuspend.', 'data' => $driver]);
    }

    public function unsuspend($id)
    {
        $driver = DriverProfile::findOrFail($id);
        $driver->update(['is_suspended' => false, 'suspension_reason' => null]);

        return response()->json(['message' => 'Suspend kurir dicabut.', 'data' => $driver]);
    }
}
