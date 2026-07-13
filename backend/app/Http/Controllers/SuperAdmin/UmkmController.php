<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\UmkmProfile;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UmkmController extends Controller
{
    public function index(Request $request)
    {
        $query = UmkmProfile::with([
                'bumdesProfile:id,name,city',
                'user:id,name,email',
            ])
            ->select([
                'id', 'user_id', 'bumdes_profile_id', 'shop_name', 'slug',
                'owner_name', 'business_category', 'status', 'rating',
                'rejection_reason', 'verified_at', 'created_at',
            ]);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('shop_name', 'like', '%' . $request->search . '%')
                  ->orWhere('owner_name', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('bumdes_id')) {
            $query->where('bumdes_profile_id', $request->bumdes_id);
        }

        if ($request->filled('category')) {
            $query->where('business_category', $request->category);
        }

        $umkm = $query->latest()->paginate(20);

        return response()->json(['data' => $umkm]);
    }

    public function show($id)
    {
        $umkm = UmkmProfile::with([
            'bumdesProfile:id,name,city,province',
            'user:id,name,email,phone',
            'products:id,umkm_profile_id,name,price,status,sold_count',
            'documents.requiredDocument',
        ])->findOrFail($id);

        return response()->json(['data' => $umkm]);
    }

    public function updateStatus(Request $request, $id)
    {
        $umkm = UmkmProfile::findOrFail($id);

        $validated = $request->validate([
            'status'           => ['required', Rule::in(['pending', 'active', 'rejected', 'suspended'])],
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $umkm->update([
            'status'           => $validated['status'],
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        return response()->json(['message' => 'Status UMKM berhasil diperbarui.', 'data' => $umkm]);
    }
}
