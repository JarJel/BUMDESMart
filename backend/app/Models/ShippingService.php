<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShippingService extends Model
{
    protected $table = 'shipping_services';
    protected $primaryKey = 'id';

    protected $fillable = [
        'code',
        'name',
        'provider',
        'service',
        'status',
    ];

    /**
     * Dapatkan semua pengiriman yang menggunakan layanan ini.
     */
    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class, 'shipping_service_id');
    }

    protected $casts = [
        'service' => 'array',
    ];
}
