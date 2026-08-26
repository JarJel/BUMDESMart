<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Disbursement;
use App\Models\UmkmBankAccount;
use App\Models\UmkmBalance;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
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
            'account_number' => 'required|string|regex:/^\d+$/|min:5|max:20',
            'account_name'   => 'required|string|min:3|max:100',
        ], [
            'account_number.regex' => 'Nomor rekening hanya boleh berisi angka.',
            'account_number.min'   => 'Nomor rekening minimal 5 digit.',
            'account_number.max'   => 'Nomor rekening maksimal 20 digit.',
            'account_name.min'     => 'Nama pemilik rekening minimal 3 karakter.',
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

    public function withdraw(Request $request)
    {
        ['id' => $ownerId, 'type' => $ownerType] = $this->getOwnerId($request);

        $validated = $request->validate([
            'amount' => 'required|integer|min:10000',
        ]);

        $balance   = UmkmBalance::where('owner_id', $ownerId)->where('owner_type', $ownerType)->first();
        $available = (float) ($balance?->available ?? 0);

        if ($validated['amount'] > $available) {
            return response()->json([
                'message' => 'Saldo tidak cukup. Saldo tersedia: Rp ' . number_format($available, 0, ',', '.'),
            ], 422);
        }

        $bankAccount = UmkmBankAccount::where('owner_id', $ownerId)
            ->where('owner_type', $ownerType)
            ->where('is_active', true)
            ->first();

        if (!$bankAccount) {
            return response()->json(['message' => 'Rekening bank belum terdaftar.'], 422);
        }

        $balance->decrement('available', $validated['amount']);
        $balance->increment('withdrawn', $validated['amount']);

        $referenceId = 'DISB-' . strtoupper($ownerType) . '-' . $ownerId . '-' . Str::random(8);

        $disb = Disbursement::create([
            'order_id'       => null,
            'owner_id'       => $ownerId,
            'owner_type'     => $ownerType,
            'channel_code'   => $bankAccount->channel_code,
            'account_number' => $bankAccount->account_number,
            'account_name'   => $bankAccount->account_name,
            'amount'         => $validated['amount'],
            'reference_id'   => $referenceId,
            'status'         => 'pending',
        ]);

        return response()->json([
            'message' => 'Permintaan pencairan berhasil diajukan.',
            'data'    => $disb,
        ], 201);
    }
}
