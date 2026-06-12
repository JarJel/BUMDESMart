<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Wishlist extends Model
{
    protected $table = 'wishlist';
    protected $primaryKey = 'id';

    protected $fillable = [
        'customer_id',
        'product_id',
    ];

    /**
     * Dapatkan data pelanggan yang memiliki wishlist ini.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * Dapatkan data produk yang ada di wishlist ini.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
