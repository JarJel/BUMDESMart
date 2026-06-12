<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $table = 'order_items';
    protected $primaryKey = 'id';

    protected $fillable = [
        'order_id',
        'product_id',
        'variant_id',
        'price',
        'quantity',
        'discount',
        'sub_total',
    ];

    /**
     * Dapatkan pesanan tempat item ini berada.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * Dapatkan produk terkait item pesanan ini.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Dapatkan varian produk terkait item pesanan ini (jika ada).
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
