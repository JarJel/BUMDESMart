<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    protected $table = 'product_variants';
    protected $primaryKey = 'id';

    protected $fillable = [
        'product_id',
        'name',
        'sku',
        'stock',
        'price',
        'weight',
        'attribute',
    ];

    protected $casts = [
        'attribute' => 'array',
    ];

    /**
     * Dapatkan produk terkait varian ini.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Dapatkan semua opsi detail dari varian produk ini.
     */
    public function options(): HasMany
    {
        return $this->hasMany(ProductVariantOption::class, 'product_variant_id');
    }
}
