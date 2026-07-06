<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BumdesProfile;
use App\Models\UmkmProfile;
use Illuminate\Http\Request;

class UmkmVerificationController extends Controller
{
    private function getBumdesProfile(Request $request): BumdesProfile
    {
        return BumdesProfile::where('user_id', $request->user()->id)->firstOrFail();
    }

    public function index(Request $request)
    {
        $bumdes = $this->getBumdesProfile($request);
        $status = $request->query('status');

        $query = UmkmProfile::with(['user', 'documents'])
            ->where('bumdes_profile_id', $bumdes->id);

        if ($status && in_array($status, ['pending', 'active', 'rejected'])) {
            $query->where('status', $status);
        }

        $umkms = $query->latest()->get()->map(function ($u) {
            return [
                'id'               => $u->id,
                'shop_name'        => $u->shop_name,
                'owner_name'       => $u->owner_name,
                'phone'            => $u->phone,
                'email'            => $u->user?->email,
                'status'           => $u->status,
                'rejection_reason' => $u->rejection_reason,
                'created_at'       => $u->created_at,
                'verified_at'      => $u->verified_at,
                'documents'        => $u->documents->map(fn($d) => [
                    'id'            => $d->id,
                    'document_type' => $d->document_type,
                    'file_path'     => $d->file_path,
                    'notes'         => $d->notes,
                    'status'        => $d->status,
                ]),
            ];
        });

        return response()->json(['data' => $umkms]);
    }

    public function show(Request $request, UmkmProfile $umkm)
    {
        $bumdes = $this->getBumdesProfile($request);

        if ($umkm->bumdes_profile_id !== $bumdes->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['data' => $umkm->load('user', 'documents')]);
    }

    public function verify(Request $request, UmkmProfile $umkm)
    {
        $bumdes = $this->getBumdesProfile($request);

        if ($umkm->bumdes_profile_id !== $bumdes->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $umkm->update([
            'status'           => 'active',
            'verified_by'      => $request->user()->id,
            'verified_at'      => now(),
            'rejection_reason' => null,
        ]);

        return response()->json(['message' => 'Mitra berhasil diverifikasi', 'data' => $umkm]);
    }

    public function reject(Request $request, UmkmProfile $umkm)
    {
        $bumdes = $this->getBumdesProfile($request);

        if ($umkm->bumdes_profile_id !== $bumdes->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $umkm->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->input('reason'),
        ]);

        return response()->json(['message' => 'Mitra ditolak', 'data' => $umkm]);
    }

    public function reapply(Request $request, UmkmProfile $umkm)
    {
        // Only the owner can re-apply
        if ($umkm->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($umkm->status !== 'rejected') {
            return response()->json(['message' => 'Hanya akun yang ditolak yang bisa mengajukan ulang'], 422);
        }

        $umkm->update([
            'status'           => 'pending',
            'rejection_reason' => null,
        ]);

        return response()->json(['message' => 'Pengajuan ulang berhasil dikirim', 'data' => $umkm]);
    }
}
