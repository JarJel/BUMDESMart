<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;
    protected $table = 'products';

    protected $fillable = [
        'umkm_profile_id',
        'category_id',
        'name',
        'slug',
        'description',
        'price',
        'stock',
        'weight',
        'has_variant',
        'is_digital',
        'sold_count',
        'status',
        'is_pre_order',
        'pre_order_days',
    ];

    protected function casts(): array
    {
        return [
            'has_variant' => 'boolean',
            'is_digital'  => 'boolean',
            'is_pre_order' => 'boolean',
            'pre_order_days' => 'integer',
        ];
    }

    public function umkmProfile(): BelongsTo
    {
        return $this->belongsTo(UmkmProfile::class, 'umkm_profile_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'product_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'product_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProductDocument::class, 'product_id');
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class, 'product_id');
    }

    public function discounts(): HasMany
    {
        return $this->hasMany(ProductDiscount::class, 'product_id');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class, 'product_id')->where('is_primary', true);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class, 'product_id');
    }

    public function activeDiscount()
    {
        return $this->hasOne(ProductDiscount::class, 'product_id')
            ->where('is_active', true)
            ->where(fn($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', now()))
            ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>', now()))
            ->where(fn($q) => $q->whereNull('max_uses')->orWhereColumn('used_count', '<', 'max_uses'));
    }

    /**
     * Accessor untuk harga minimum (terutama jika produk memiliki varian atau harga di DB = 0).
     */
    public function getMinPriceAttribute(): float
    {
        $basePrice = (float) $this->price;

        if ($this->has_variant || $basePrice <= 0) {
            if ($this->relationLoaded('variants') && $this->variants->isNotEmpty()) {
                $variantPrices = $this->variants->flatMap(function ($v) {
                    return $v->options ? $v->options->filter(fn($o) => $o->is_active ?? true)->map(function ($o) {
                        return (float) ($o->price ?? $o->price_adjustment ?? 0);
                    }) : collect();
                })->filter(fn($p) => (float)$p > 0);

                if ($variantPrices->isNotEmpty()) {
                    return (float) $variantPrices->min();
                }
            }

            try {
                $minOptionPrice = \App\Models\ProductVariantOption::whereHas('productVariant', function ($q) {
                    $q->where('product_id', $this->id);
                })
                ->where('is_active', true)
                ->where('price', '>', 0)
                ->min('price');

                if ($minOptionPrice !== null && (float) $minOptionPrice > 0) {
                    return (float) $minOptionPrice;
                }
            } catch (\Throwable $e) {
                // Ignore exception fallback
            }
        }

        return $basePrice;
    }
}
