<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductDiscount;
use Illuminate\Http\Request;

class SellerDiscountController extends Controller
{
    private function umkm(Request $request)
    {
        return $request->user()->umkmProfile;
    }

    private function hasActiveDiscount(int $productId, ?int $excludeId = null): bool
    {
        return ProductDiscount::where('product_id', $productId)
            ->where('is_active', true)
            ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
            ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>', now()))
            ->where(fn($q) => $q->whereNull('max_uses')->orWhereColumn('used_count', '<', 'max_uses'))
            ->exists();
    }

    public function index(Request $request)
    {
        $umkm = $this->umkm($request);
        if (!$umkm) return response()->json(['error' => 'Profil UMKM tidak ditemukan.'], 404);

        $query = ProductDiscount::with('product:id,name,price')
            ->where('umkm_profile_id', $umkm->id)
            ->latest();

        $filter = $request->query('filter', 'semua');

        if ($filter === 'aktif') {
            $query->where('is_active', true)
                  ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>', now()))
                  ->where(fn($q) => $q->whereNull('max_uses')->orWhereColumn('used_count', '<', 'max_uses'));
        } elseif ($filter === 'nonaktif') {
            $query->where('is_active', false);
        } elseif ($filter === 'kadaluarsa') {
            $query->where(function ($q) {
                $q->where('end_date', '<=', now())
                  ->orWhere(fn($q2) => $q2->whereNotNull('max_uses')->whereColumn('used_count', '>=', 'max_uses'));
            });
        }

        $discounts = $query->paginate(20);

        // Tambahkan discounted_price ke setiap item
        $discounts->getCollection()->transform(function ($d) {
            if ($d->product) {
                $d->discounted_price = $d->calculateDiscountedPrice((float) $d->product->price);
            }
            return $d;
        });

        return response()->json(['data' => $discounts]);
    }

    public function store(Request $request)
    {
        $umkm = $this->umkm($request);
        if (!$umkm) return response()->json(['error' => 'Profil UMKM tidak ditemukan.'], 404);

        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'type'       => 'required|in:percentage,nominal',
            'value'      => 'required|numeric|min:0.01',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
            'max_uses'   => 'nullable|integer|min:1',
        ]);

        $product = Product::where('id', $validated['product_id'])
            ->where('umkm_profile_id', $umkm->id)
            ->first();

        if (!$product) {
            return response()->json(['error' => 'Produk tidak ditemukan atau bukan milik toko kamu.'], 404);
        }

        if ($validated['type'] === 'percentage' && $validated['value'] > 100) {
            return response()->json(['error' => 'Diskon persentase tidak boleh lebih dari 100%.'], 422);
        }

        if ($validated['type'] === 'nominal' && $validated['value'] >= $product->price) {
            return response()->json(['error' => 'Diskon nominal tidak boleh lebih besar atau sama dengan harga produk.'], 422);
        }

        if ($this->hasActiveDiscount($product->id)) {
            return response()->json(['error' => 'Produk ini sudah punya diskon aktif. Nonaktifkan dulu sebelum membuat yang baru.'], 422);
        }

        $discount = ProductDiscount::create([
            'product_id'      => $product->id,
            'umkm_profile_id' => $umkm->id,
            'type'            => $validated['type'],
            'value'           => $validated['value'],
            'start_date'      => $validated['start_date'] ?? null,
            'end_date'        => $validated['end_date'] ?? null,
            'max_uses'        => $validated['max_uses'] ?? null,
            'is_active'       => true,
        ]);

        return response()->json([
            'message' => 'Diskon berhasil dibuat.',
            'data'    => $discount->load('product:id,name,price'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $umkm = $this->umkm($request);
        if (!$umkm) return response()->json(['error' => 'Profil UMKM tidak ditemukan.'], 404);

        $discount = ProductDiscount::where('id', $id)
            ->where('umkm_profile_id', $umkm->id)
            ->with('product:id,name,price')
            ->first();

        if (!$discount) return response()->json(['error' => 'Diskon tidak ditemukan.'], 404);

        if ($discount->used_count > 0) {
            // Sudah pernah dipakai: kunci type dan value
            $validated = $request->validate([
                'max_uses' => 'nullable|integer|min:' . $discount->used_count,
                'end_date' => 'nullable|date',
                'is_active' => 'sometimes|boolean',
            ]);
            $discount->update($validated);
        } else {
            $validated = $request->validate([
                'type'       => 'sometimes|in:percentage,nominal',
                'value'      => 'sometimes|numeric|min:0.01',
                'start_date' => 'nullable|date',
                'end_date'   => 'nullable|date',
                'max_uses'   => 'nullable|integer|min:1',
                'is_active'  => 'sometimes|boolean',
            ]);

            $type  = $validated['type']  ?? $discount->type;
            $value = $validated['value'] ?? $discount->value;

            if ($type === 'percentage' && $value > 100) {
                return response()->json(['error' => 'Diskon persentase tidak boleh lebih dari 100%.'], 422);
            }

            if ($type === 'nominal' && $discount->product && $value >= $discount->product->price) {
                return response()->json(['error' => 'Diskon nominal tidak boleh lebih besar atau sama dengan harga produk.'], 422);
            }

            $discount->update($validated);
        }

        $fresh = $discount->fresh(['product:id,name,price']);
        $fresh->discounted_price = $fresh->product
            ? $fresh->calculateDiscountedPrice((float) $fresh->product->price)
            : null;

        return response()->json(['message' => 'Diskon berhasil diperbarui.', 'data' => $fresh]);
    }

    public function destroy(Request $request, $id)
    {
        $umkm = $this->umkm($request);
        if (!$umkm) return response()->json(['error' => 'Profil UMKM tidak ditemukan.'], 404);

        $discount = ProductDiscount::where('id', $id)
            ->where('umkm_profile_id', $umkm->id)
            ->first();

        if (!$discount) return response()->json(['error' => 'Diskon tidak ditemukan.'], 404);

        $discount->delete();

        return response()->json(['message' => 'Diskon berhasil dihapus.']);
    }

    public function toggle(Request $request, $id)
    {
        $umkm = $this->umkm($request);
        if (!$umkm) return response()->json(['error' => 'Profil UMKM tidak ditemukan.'], 404);

        $discount = ProductDiscount::where('id', $id)
            ->where('umkm_profile_id', $umkm->id)
            ->first();

        if (!$discount) return response()->json(['error' => 'Diskon tidak ditemukan.'], 404);

        // Kalau mau aktifkan: pastikan tidak ada diskon lain yang aktif di produk yang sama
        if (!$discount->is_active && $this->hasActiveDiscount($discount->product_id, $discount->id)) {
            return response()->json(['error' => 'Produk ini sudah punya diskon aktif lain.'], 422);
        }

        $discount->update(['is_active' => !$discount->is_active]);
        $label = $discount->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json(['message' => "Diskon berhasil $label.", 'data' => $discount]);
    }
}
