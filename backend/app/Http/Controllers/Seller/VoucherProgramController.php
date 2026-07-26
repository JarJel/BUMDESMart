<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\UmkmVoucherProgram;
use Illuminate\Http\Request;

class VoucherProgramController extends Controller
{
    private function getUmkm(Request $request)
    {
        $umkm = $request->user()->umkmProfile;
        if (!$umkm || $umkm->status !== 'active') {
            abort(response()->json(['message' => 'Profil UMKM tidak ditemukan atau belum aktif.'], 403));
        }
        return $umkm;
    }

    // GET /seller/voucher-programs
    public function index(Request $request)
    {
        $umkm = $this->getUmkm($request);
        $programs = UmkmVoucherProgram::where('umkm_profile_id', $umkm->id)
            ->latest()
            ->get()
            ->map(fn($p) => array_merge($p->toArray(), ['auto_label' => $p->getAutoLabel()]));

        return response()->json(['data' => $programs]);
    }

    // POST /seller/voucher-programs
    public function store(Request $request)
    {
        $umkm = $this->getUmkm($request);

        $validated = $request->validate([
            'trigger_type'  => 'required|in:item_count,order_amount,order_frequency',
            'trigger_value' => 'required|integer|min:1',
            'reward_type'   => 'required|in:flat,percentage,free_shipping',
            'reward_value'  => 'required_unless:reward_type,free_shipping|integer|min:0',
            'max_discount'  => 'nullable|integer|min:0',
            'label'         => 'nullable|string|max:100',
            'is_active'     => 'boolean',
        ]);

        // Nonaktifkan semua program lama kalau yang baru aktif
        if ($validated['is_active'] ?? true) {
            UmkmVoucherProgram::where('umkm_profile_id', $umkm->id)->update(['is_active' => false]);
        }

        $program = UmkmVoucherProgram::create(array_merge(
            $validated,
            ['umkm_profile_id' => $umkm->id, 'reward_value' => $validated['reward_value'] ?? 0]
        ));

        return response()->json([
            'message' => 'Program voucher berhasil dibuat.',
            'data'    => array_merge($program->toArray(), ['auto_label' => $program->getAutoLabel()]),
        ], 201);
    }

    // PUT /seller/voucher-programs/{id}
    public function update(Request $request, int $id)
    {
        $umkm    = $this->getUmkm($request);
        $program = UmkmVoucherProgram::where('umkm_profile_id', $umkm->id)->findOrFail($id);

        $validated = $request->validate([
            'trigger_type'  => 'sometimes|in:item_count,order_amount,order_frequency',
            'trigger_value' => 'sometimes|integer|min:1',
            'reward_type'   => 'sometimes|in:flat,percentage,free_shipping',
            'reward_value'  => 'sometimes|integer|min:0',
            'max_discount'  => 'nullable|integer|min:0',
            'label'         => 'nullable|string|max:100',
            'is_active'     => 'boolean',
        ]);

        if (isset($validated['is_active']) && $validated['is_active']) {
            UmkmVoucherProgram::where('umkm_profile_id', $umkm->id)
                ->where('id', '!=', $id)->update(['is_active' => false]);
        }

        $program->update($validated);

        return response()->json([
            'message' => 'Program voucher diperbarui.',
            'data'    => array_merge($program->fresh()->toArray(), ['auto_label' => $program->fresh()->getAutoLabel()]),
        ]);
    }

    // DELETE /seller/voucher-programs/{id}
    public function destroy(Request $request, int $id)
    {
        $umkm = $this->getUmkm($request);
        UmkmVoucherProgram::where('umkm_profile_id', $umkm->id)->findOrFail($id)->delete();
        return response()->json(['message' => 'Program voucher dihapus.']);
    }

    // PATCH /seller/voucher-programs/{id}/toggle
    public function toggle(Request $request, int $id)
    {
        $umkm    = $this->getUmkm($request);
        $program = UmkmVoucherProgram::where('umkm_profile_id', $umkm->id)->findOrFail($id);

        if (!$program->is_active) {
            UmkmVoucherProgram::where('umkm_profile_id', $umkm->id)
                ->where('id', '!=', $id)->update(['is_active' => false]);
        }
        $program->update(['is_active' => !$program->is_active]);

        return response()->json([
            'message' => $program->is_active ? 'Program diaktifkan.' : 'Program dinonaktifkan.',
            'data'    => array_merge($program->toArray(), ['auto_label' => $program->getAutoLabel()]),
        ]);
    }
}
