<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Promotion;
use App\Models\UmkmVoucherProgram;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    /**
     * GET /checkout/vouchers?umkm_profile_id=X&item_count=Y&order_amount=Z
     *
     * Dipanggil FE saat checkout preview untuk cek voucher apa saja yang bisa dipakai
     * dari toko tertentu. Response otomatis termasuk info apakah eligible.
     */
    public function available(Request $request)
    {
        $umkmProfileId = (int) $request->query('umkm_profile_id');
        $customer      = $request->user()->customer;

        if (!$umkmProfileId || !$customer) {
            return response()->json(['data' => []]);
        }

        // Hitung frekuensi beli di toko ini
        $orderFrequency = Order::where('customer_id', $customer->id)
            ->where('umkm_profile_id', $umkmProfileId)
            ->whereIn('status', ['confirmed', 'picking_up', 'shipped', 'delivered'])
            ->count();

        $context = [
            'item_count'      => (int) $request->query('item_count', 0),
            'order_amount'    => (int) $request->query('order_amount', 0),
            'order_frequency' => $orderFrequency,
        ];

        $programs = UmkmVoucherProgram::where('umkm_profile_id', $umkmProfileId)
            ->where('is_active', true)
            ->get();

        // Cek program mana yang sudah pernah dipakai customer ini
        $usedProgramIds = Promotion::where('customer_id', $customer->id)
            ->whereIn('voucher_program_id', $programs->pluck('id'))
            ->where('is_auto_generated', true)
            ->pluck('voucher_program_id')
            ->flip();

        $result = $programs->map(function ($p) use ($context, $usedProgramIds) {
            $alreadyUsed = isset($usedProgramIds[$p->id]);
            $eligible    = !$alreadyUsed && $p->isEligible($context);
            return [
                'id'              => $p->id,
                'label'           => $p->label ?? $p->getAutoLabel(),
                'trigger_type'    => $p->trigger_type,
                'trigger_value'   => $p->trigger_value,
                'reward_type'     => $p->reward_type,
                'reward_value'    => (int) $p->reward_value,
                'max_discount'    => $p->max_discount,
                'is_eligible'     => $eligible,
                'already_used'    => $alreadyUsed,
                'discount_amount' => $eligible ? $p->calculateDiscount($context['order_amount']) : 0,
                'progress'        => $this->buildProgress($p, $context),
            ];
        });

        return response()->json(['data' => $result]);
    }

    private function buildProgress(UmkmVoucherProgram $p, array $context): array
    {
        $current = match ($p->trigger_type) {
            'item_count'      => $context['item_count'],
            'order_amount'    => $context['order_amount'],
            'order_frequency' => $context['order_frequency'],
            default           => 0,
        };

        return [
            'current'  => $current,
            'required' => (int) $p->trigger_value,
            'met'      => $current >= $p->trigger_value,
        ];
    }
}
