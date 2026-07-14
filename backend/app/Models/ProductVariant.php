<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    protected $table = 'product_variants';

    protected $fillable = [
        'product_id',
        'name',
        'sort_order',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(ProductVariantOption::class, 'product_variant_id');
    }

    // Accessor dinamis untuk kompatibilitas dengan CartController & CheckoutController
    public function getPriceAttribute()
    {
        return $this->options()->first()?->price ?? 0;
    }

    public function getStockAttribute()
    {
        return $this->options()->first()?->stock ?? 0;
    }
}
