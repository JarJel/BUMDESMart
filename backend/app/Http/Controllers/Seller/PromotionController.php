<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PromotionController extends Controller
{
    private function getUmkm(Request $request)
    {
        return $request->user()->umkmProfile;
    }

    public function index(Request $request)
    {
        $promotions = Promotion::where('umkm_profile_id', $this->getUmkm($request)->id)
            ->latest()
            ->get();

        return response()->json(['data' => $promotions]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code'               => 'required|string|max:50|unique:promotions,code',
            'name'               => 'required|string|max:255',
            'description'        => 'nullable|string|max:1000',
            'type'               => 'required|in:percentage,fixed',
            'value'              => 'required|numeric|min:0',
            'min_order_amount'   => 'nullable|numeric|min:0',
            'max_discount_amount'=> 'nullable|numeric|min:0',
            'start_date'         => 'nullable|date',
            'end_date'           => 'nullable|date|after_or_equal:start_date',
            'usage_limit'        => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $promo = Promotion::create([
            ...$validator->validated(),
            'umkm_profile_id' => $this->getUmkm($request)->id,
            'usage_count'     => 0,
            'status'          => 'active',
        ]);

        return response()->json(['message' => 'Promosi berhasil dibuat.', 'data' => $promo], 201);
    }

    public function update(Request $request, int $id)
    {
        $promo = Promotion::where('umkm_profile_id', $this->getUmkm($request)->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'code'               => 'sometimes|string|max:50|unique:promotions,code,' . $id,
            'name'               => 'sometimes|string|max:255',
            'description'        => 'nullable|string|max:1000',
            'type'               => 'sometimes|in:percentage,fixed',
            'value'              => 'sometimes|numeric|min:0',
            'min_order_amount'   => 'nullable|numeric|min:0',
            'max_discount_amount'=> 'nullable|numeric|min:0',
            'start_date'         => 'nullable|date',
            'end_date'           => 'nullable|date|after_or_equal:start_date',
            'usage_limit'        => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $promo->update($validator->validated());

        return response()->json(['message' => 'Promosi berhasil diperbarui.', 'data' => $promo->fresh()]);
    }

    public function destroy(Request $request, int $id)
    {
        $promo = Promotion::where('umkm_profile_id', $this->getUmkm($request)->id)->findOrFail($id);
        $promo->delete();
        return response()->json(['message' => 'Promosi berhasil dihapus.']);
    }

    public function toggle(Request $request, int $id)
    {
        $promo = Promotion::where('umkm_profile_id', $this->getUmkm($request)->id)->findOrFail($id);
        $promo->update(['status' => $promo->status === 'active' ? 'inactive' : 'active']);
        return response()->json([
            'message' => $promo->status === 'active' ? 'Promosi diaktifkan.' : 'Promosi dinonaktifkan.',
            'data'    => $promo,
        ]);
    }

    public static function validate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code'  => 'required|string',
            'total' => 'required|numeric|min:0',
            'umkm_profile_id' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $promo = Promotion::where('code', strtoupper($request->code))
            ->where('umkm_profile_id', $request->umkm_profile_id)
            ->where('status', 'active')
            ->where(fn($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', now()))
            ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>', now()))
            ->where(fn($q) => $q->whereNull('usage_limit')->orWhereColumn('usage_count', '<', 'usage_limit'))
            ->first();

        if (!$promo) {
            return response()->json(['message' => 'Kode promo tidak valid atau sudah kadaluarsa.'], 404);
        }

        if ($promo->min_order_amount && $request->total < $promo->min_order_amount) {
            return response()->json([
                'message' => 'Minimum pembelian Rp ' . number_format($promo->min_order_amount, 0, ',', '.'),
            ], 422);
        }

        $discount = $promo->type === 'percentage'
            ? ($request->total * $promo->value / 100)
            : $promo->value;

        if ($promo->max_discount_amount) {
            $discount = min($discount, $promo->max_discount_amount);
        }

        return response()->json([
            'data' => [
                'id'       => $promo->id,
                'code'     => $promo->code,
                'name'     => $promo->name,
                'type'     => $promo->type,
                'value'    => $promo->value,
                'discount' => round($discount),
            ],
        ]);
    }
}
