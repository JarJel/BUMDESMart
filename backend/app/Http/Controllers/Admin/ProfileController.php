<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BumdesProfile;
use App\Models\UmkmBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $bumdes = BumdesProfile::where('user_id', $user->id)->first();

        if (!$bumdes) {
            return response()->json(['message' => 'Profil BUMDes tidak ditemukan.'], 404);
        }

        return response()->json(['data' => $bumdes]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $bumdes = BumdesProfile::where('user_id', $user->id)->first();

        if (!$bumdes) {
            return response()->json(['message' => 'Profil BUMDes tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'village'     => 'sometimes|required|string|max:255',
            'district'    => 'nullable|string|max:255',
            'city'        => 'sometimes|required|string|max:255',
            'province'    => 'sometimes|required|string|max:255',
            'postal_code' => 'nullable|string|max:10',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email|max:255',
            'description' => 'nullable|string',
            'fee_type'    => 'nullable|in:percent,flat',
            'fee_value'   => 'nullable|numeric|min:0',
        ]);

        // Enforce batas maksimum fee
        if (isset($validated['fee_value']) && isset($validated['fee_type'])) {
            if ($validated['fee_type'] === 'percent' && $validated['fee_value'] > 2) {
                return response()->json(['message' => 'Fee persentase maksimal 2%.'], 422);
            }
            if ($validated['fee_type'] === 'flat' && $validated['fee_value'] > 1000) {
                return response()->json(['message' => 'Fee nominal maksimal Rp 1.000.'], 422);
            }
        }

        if (array_key_exists('fee_type', $validated) && !$validated['fee_type']) {
            $validated['fee_value'] = 0;
        }

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $bumdes->update($validated);

        return response()->json(['message' => 'Profil BUMDes berhasil diperbarui.', 'data' => $bumdes->fresh()]);
    }

    public function balance(Request $request)
    {
        $user = $request->user();
        $bumdes = BumdesProfile::where('user_id', $user->id)->first();

        if (!$bumdes) {
            return response()->json(['data' => ['pending' => 0, 'available' => 0]]);
        }

        $balance = UmkmBalance::where('owner_id', $bumdes->id)
            ->where('owner_type', 'bumdes')
            ->first();

        return response()->json([
            'data' => [
                'pending'   => (float) ($balance?->pending ?? 0),
                'available' => (float) ($balance?->available ?? 0),
            ]
        ]);
    }
}
