<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\UmkmBankAccount;
use App\Models\UmkmBalance;
use Illuminate\Http\Request;

class BankAccountController extends Controller
{
    private function getOwnerId(Request $request): array
    {
        $user = $request->user();

        if ($user->role === 'pengirim') {
            return ['id' => $user->id, 'type' => 'driver'];
        }

        $umkm = $user->umkmProfile;
        if (!$umkm || $umkm->status !== 'active') {
            abort(response()->json(['message' => 'Profil UMKM tidak ditemukan atau belum aktif.'], 403));
        }

        return ['id' => $umkm->id, 'type' => 'umkm'];
    }

    public function index(Request $request)
    {
        ['id' => $ownerId, 'type' => $ownerType] = $this->getOwnerId($request);

        $accounts = UmkmBankAccount::where('owner_id', $ownerId)
            ->where('owner_type', $ownerType)
            ->get();

        $balance = UmkmBalance::where('owner_id', $ownerId)
            ->where('owner_type', $ownerType)
            ->first();

        return response()->json([
            'data' => [
                'accounts' => $accounts,
                'balance'  => $balance,
            ],
        ]);
    }

    public function store(Request $request)
    {
        ['id' => $ownerId, 'type' => $ownerType] = $this->getOwnerId($request);

        $validated = $request->validate([
            'channel_code'   => 'required|string|max:20',
            'account_number' => 'required|string|max:30',
            'account_name'   => 'required|string|max:100',
        ]);

        // Nonaktifkan semua rekening lama
        UmkmBankAccount::where('owner_id', $ownerId)
            ->where('owner_type', $ownerType)
            ->update(['is_active' => false]);

        $account = UmkmBankAccount::create([
            'owner_id'       => $ownerId,
            'owner_type'     => $ownerType,
            'channel_code'   => strtoupper($validated['channel_code']),
            'account_number' => $validated['account_number'],
            'account_name'   => $validated['account_name'],
            'is_active'      => true,
        ]);

        return response()->json(['message' => 'Rekening berhasil ditambahkan.', 'data' => $account], 201);
    }

    public function destroy(Request $request, int $id)
    {
        ['id' => $ownerId, 'type' => $ownerType] = $this->getOwnerId($request);

        $account = UmkmBankAccount::where('id', $id)
            ->where('owner_id', $ownerId)
            ->where('owner_type', $ownerType)
            ->firstOrFail();

        $account->delete();

        return response()->json(['message' => 'Rekening berhasil dihapus.']);
    }
}
