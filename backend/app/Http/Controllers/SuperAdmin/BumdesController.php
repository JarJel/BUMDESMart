<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\BumdesProfile;
use App\Models\BumdesRequiredDocument;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BumdesController extends Controller
{
    public function index(Request $request)
    {
        // Public route (dropdown registrasi): hanya aktif, kolom minimal, tanpa data user
        if (!$request->user()) {
            $bumdes = BumdesProfile::where('status', 'active')
                ->select(['id', 'name', 'slug', 'village', 'city', 'province'])
                ->orderBy('name')
                ->get();
            return response()->json(['data' => $bumdes]);
        }

        // Super-admin route: full data dengan pagination
        $bumdes = BumdesProfile::with('user:id,name,email,role,status')
            ->select(['id', 'user_id', 'name', 'slug', 'village', 'city', 'province', 'phone', 'email', 'status', 'created_at'])
            ->latest()
            ->paginate(20);

        return response()->json(['data' => $bumdes]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'village'     => 'required|string|max:255',
            'district'    => 'nullable|string|max:255',
            'city'        => 'required|string|max:255',
            'province'    => 'required|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email|max:255',
            'description' => 'nullable|string',
            'admin_name'  => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8',
        ]);

        // Buat user admin_bumdes
        $user = User::create([
            'name'              => $validated['admin_name'],
            'email'             => $validated['admin_email'],
            'password'          => $validated['admin_password'],
            'role'              => 'admin_bumdes',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        $bumdes = BumdesProfile::create([
            'user_id'     => $user->id,
            'name'        => $validated['name'],
            'slug'        => Str::slug($validated['name']),
            'village'     => $validated['village'],
            'district'    => $validated['district'] ?? null,
            'city'        => $validated['city'],
            'province'    => $validated['province'],
            'postal_code' => $validated['postal_code'] ?? null,
            'phone'       => $validated['phone'] ?? null,
            'email'       => $validated['email'] ?? null,
            'description' => $validated['description'] ?? null,
            'status'      => 'active',
        ]);

        // Seed default required documents for new BUMDes
        $defaultDocs = [
            ['name' => 'KTP (Kartu Tanda Penduduk)', 'description' => 'KTP pemilik usaha yang masih berlaku', 'is_required' => true],
            ['name' => 'NIB (Nomor Induk Berusaha)', 'description' => 'Nomor Induk Berusaha dari sistem OSS. Wajib sejak 2026 untuk berjualan online.', 'is_required' => true],
            ['name' => 'NPWP', 'description' => 'Nomor Pokok Wajib Pajak. Opsional untuk usaha perorangan mikro.', 'is_required' => false],
            ['name' => 'Surat Domisili Usaha', 'description' => 'Surat keterangan domisili usaha dari desa/kelurahan setempat', 'is_required' => false],
        ];

        foreach ($defaultDocs as $doc) {
            BumdesRequiredDocument::create([
                'bumdes_profile_id' => $bumdes->id,
                ...$doc,
            ]);
        }

        return response()->json(['message' => 'BUMDes berhasil didaftarkan', 'data' => $bumdes->load('user')], 201);
    }

    public function show(BumdesProfile $bumdes)
    {
        return response()->json(['data' => $bumdes->load('user', 'requiredDocuments', 'umkmProfiles')]);
    }

    public function update(Request $request, BumdesProfile $bumdes)
    {
        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'village'     => 'sometimes|string|max:255',
            'district'    => 'nullable|string|max:255',
            'city'        => 'sometimes|string|max:255',
            'province'    => 'sometimes|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email|max:255',
            'description' => 'nullable|string',
            'status'      => ['sometimes', Rule::in(['active', 'inactive'])],
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $bumdes->update($validated);

        return response()->json(['message' => 'BUMDes berhasil diperbarui', 'data' => $bumdes]);
    }

    public function destroy(BumdesProfile $bumdes)
    {
        $bumdes->delete();

        return response()->json(['message' => 'BUMDes berhasil dihapus']);
    }
}
