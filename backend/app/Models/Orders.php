<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Orders extends Model
{
    protected $table = 'orders';
    protected $primaryKey = 'id';

    protected $fillable = [
        'customer_id',
        'umkm_id',
        'order_code',
        'sub_total',
        'shipping_cost',
        'total',
        'discount',
        'status',
        'notes',
    ];

    /**
     * Dapatkan data pelanggan yang membuat pesanan ini.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customers::class, 'customer_id');
    }

    /**
     * Dapatkan data profil UMKM yang memproses pesanan ini.
     */
    public function umkmProfile(): BelongsTo
    {
        return $this->belongsTo(UmkmProfile::class, 'umkm_profile_id');
    }

    /**
     * Dapatkan semua riwayat status pesanan ini.
     */
    public function orderHistories(): HasMany
    {
        return $this->hasMany(OrderHistory::class, 'order_id');
    }

    /**
     * Dapatkan semua item di dalam pesanan ini.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrdersItems::class, 'order_id');
    }
    
    /**
     * Dapatkan data pembayaran untuk pesanan ini.
     */
    public function payment(): HasOne
    {
        return $this->hasOne(Payments::class, 'order_id');
    }

    /**
     * Dapatkan data pengiriman untuk pesanan ini.
     */
    public function shipment(): HasOne
    {
        return $this->hasOne(Shipments::class, 'order_id');
    }
}
