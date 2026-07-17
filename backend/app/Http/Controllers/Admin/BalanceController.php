<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BumdesProfile;
use App\Models\BumdesTransaction;
use App\Models\Disbursement;
use App\Models\UmkmBalance;
use App\Models\UmkmBankAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BalanceController extends Controller
{
    private function getBumdes(Request $request): BumdesProfile
    {
        $bumdes = BumdesProfile::where('user_id', $request->user()->id)->first();
        if (!$bumdes) abort(response()->json(['message' => 'Profil BUMDes tidak ditemukan.'], 404));
        return $bumdes;
    }

    // GET /admin/balance — saldo + ringkasan pemasukan
    public function index(Request $request)
    {
        $bumdes  = $this->getBumdes($request);
        $balance = UmkmBalance::where('owner_id', $bumdes->id)->where('owner_type', 'bumdes')->first();

        $totalSellerFee  = BumdesTransaction::where('bumdes_profile_id', $bumdes->id)->where('type', 'seller_fee')->sum('amount');
        $totalServiceFee = BumdesTransaction::where('bumdes_profile_id', $bumdes->id)->where('type', 'service_fee')->sum('amount');

        $thisMonth       = now()->startOfMonth();
        $monthSellerFee  = BumdesTransaction::where('bumdes_profile_id', $bumdes->id)->where('type', 'seller_fee')->where('created_at', '>=', $thisMonth)->sum('amount');
        $monthServiceFee = BumdesTransaction::where('bumdes_profile_id', $bumdes->id)->where('type', 'service_fee')->where('created_at', '>=', $thisMonth)->sum('amount');

        $bankAccount = UmkmBankAccount::where('owner_id', $bumdes->id)->where('owner_type', 'bumdes')->where('is_active', true)->first();

        return response()->json([
            'data' => [
                'pending'              => (float) ($balance?->pending ?? 0),
                'available'            => (float) ($balance?->available ?? 0),
                'total_seller_fee'     => (float) $totalSellerFee,
                'total_service_fee'    => (float) $totalServiceFee,
                'month_seller_fee'     => (float) $monthSellerFee,
                'month_service_fee'    => (float) $monthServiceFee,
                'month_total'          => (float) ($monthSellerFee + $monthServiceFee),
                'bank_account'         => $bankAccount ? [
                    'id'             => $bankAccount->id,
                    'channel_code'   => $bankAccount->channel_code,
                    'account_number' => $bankAccount->account_number,
                    'account_name'   => $bankAccount->account_name,
                ] : null,
            ]
        ]);
    }

    // GET /admin/transactions — histori transaksi BUMDes (paginated)
    public function transactions(Request $request)
    {
        $bumdes = $this->getBumdes($request);

        $query = BumdesTransaction::where('bumdes_profile_id', $bumdes->id)
            ->with('order:id,order_code')
            ->orderByDesc('created_at');

        if ($request->type && in_array($request->type, ['seller_fee', 'service_fee'])) {
            $query->where('type', $request->type);
        }

        $transactions = $query->paginate(20);

        return response()->json(['data' => $transactions]);
    }

    // GET /admin/disbursements — riwayat pencairan BUMDes
    public function disbursements(Request $request)
    {
        $bumdes = $this->getBumdes($request);

        $disbursements = Disbursement::where('owner_id', $bumdes->id)
            ->where('owner_type', 'bumdes')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json(['data' => $disbursements]);
    }

    // POST /admin/withdraw — ajukan pencairan manual
    public function withdraw(Request $request)
    {
        $bumdes = $this->getBumdes($request);

        $validated = $request->validate([
            'amount' => 'required|integer|min:10000',
        ]);

        $balance = UmkmBalance::where('owner_id', $bumdes->id)->where('owner_type', 'bumdes')->first();
        $available = (float) ($balance?->available ?? 0);

        if ($validated['amount'] > $available) {
            return response()->json(['message' => 'Saldo tidak cukup. Saldo tersedia: Rp ' . number_format($available, 0, ',', '.')], 422);
        }

        $bankAccount = UmkmBankAccount::where('owner_id', $bumdes->id)
            ->where('owner_type', 'bumdes')
            ->where('is_active', true)
            ->first();

        if (!$bankAccount) {
            return response()->json(['message' => 'Rekening bank BUMDes belum terdaftar. Hubungi Super Admin.'], 422);
        }

        // Kurangi saldo available
        $balance->decrement('available', $validated['amount']);

        $referenceId = 'DISB-BUMDES-' . $bumdes->id . '-' . Str::random(8);

        $disb = Disbursement::create([
            'order_id'       => null,
            'owner_id'       => $bumdes->id,
            'owner_type'     => 'bumdes',
            'channel_code'   => $bankAccount->channel_code,
            'account_number' => $bankAccount->account_number,
            'account_name'   => $bankAccount->account_name,
            'amount'         => $validated['amount'],
            'reference_id'   => $referenceId,
            'status'         => 'PENDING',
        ]);

        // Kirim ke Xendit jika ada API key
        try {
            $xenditKey = config('services.xendit.secret_key');
            if ($xenditKey) {
                $response = \Illuminate\Support\Facades\Http::withBasicAuth($xenditKey, '')
                    ->post('https://api.xendit.co/disbursements', [
                        'external_id'    => $referenceId,
                        'bank_code'      => $bankAccount->channel_code,
                        'account_holder_name' => $bankAccount->account_name,
                        'account_number' => $bankAccount->account_number,
                        'description'    => 'Pencairan saldo BUMDes ' . $bumdes->name,
                        'amount'         => $validated['amount'],
                    ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $disb->update([
                        'xendit_disbursement_id' => $data['id'] ?? null,
                        'status'                 => $data['status'] ?? 'PENDING',
                    ]);
                }
            }
        } catch (\Throwable $e) {
            \Log::warning('Xendit disbursement BUMDes gagal: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Permintaan pencairan berhasil diajukan.',
            'data'    => $disb,
        ], 201);
    }

    // POST /admin/bank-account — simpan/update rekening bank BUMDes
    public function saveBankAccount(Request $request)
    {
        $bumdes = $this->getBumdes($request);

        $validated = $request->validate([
            'channel_code'   => 'required|string|max:50',
            'account_number' => 'required|string|max:30',
            'account_name'   => 'required|string|max:100',
        ]);

        // Nonaktifkan semua rekening lama
        UmkmBankAccount::where('owner_id', $bumdes->id)->where('owner_type', 'bumdes')->update(['is_active' => false]);

        $account = UmkmBankAccount::create([
            'owner_id'       => $bumdes->id,
            'owner_type'     => 'bumdes',
            'channel_code'   => strtoupper($validated['channel_code']),
            'account_number' => $validated['account_number'],
            'account_name'   => $validated['account_name'],
            'is_active'      => true,
        ]);

        return response()->json(['message' => 'Rekening bank berhasil disimpan.', 'data' => $account], 201);
    }
}
