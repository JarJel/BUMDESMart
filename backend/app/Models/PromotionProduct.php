<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromotionProduct extends Model
{
    protected $table = 'promotion_products';
    protected $primaryKey = 'id';

    protected $fillable = [
        'promotion_id',
        'product_id',
        'category_id',
    ];
    
    /**
     * Dapatkan promosi induk dari data ini.
     */
    public function promotion(): BelongsTo
    {
        return $this->belongsTo(Promotion::class, 'promotion_id');
    }

    /**
     * Dapatkan produk terkait promosi ini (jika spesifik produk).
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Dapatkan kategori terkait promosi ini (jika spesifik kategori).
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
}
