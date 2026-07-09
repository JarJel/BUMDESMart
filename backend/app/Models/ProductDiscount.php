<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductDiscount extends Model
{
    protected $table = 'product_discounts';

    protected $fillable = [
        'product_id',
        'umkm_profile_id',
        'type',
        'value',
        'start_date',
        'end_date',
        'max_uses',
        'used_count',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value'      => 'decimal:2',
            'start_date' => 'datetime',
            'end_date'   => 'datetime',
            'is_active'  => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function umkmProfile(): BelongsTo
    {
        return $this->belongsTo(UmkmProfile::class, 'umkm_profile_id');
    }

    public function calculateDiscountedPrice(float $basePrice): float
    {
        if ($this->type === 'percentage') {
            return round($basePrice * (1 - $this->value / 100), 2);
        }
        return max(0, $basePrice - $this->value);
    }

    // Panggil ini saat order berubah ke status 'paid'
    public static function applyUsage(int $productId): void
    {
        $discount = static::where('product_id', $productId)
            ->where('is_active', true)
            ->where(fn($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', now()))
            ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>', now()))
            ->where(fn($q) => $q->whereNull('max_uses')->orWhereColumn('used_count', '<', 'max_uses'))
            ->first();

        if (!$discount) return;

        $discount->increment('used_count');

        if ($discount->max_uses !== null && $discount->used_count >= $discount->max_uses) {
            $discount->update(['is_active' => false]);
        }
    }
}
