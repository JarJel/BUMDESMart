<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shipments extends Model
{
    protected $table = 'shipments';
    protected $primaryKey = 'id';

    protected $fillable = [
        'order_id',
        'shipping_service_id',
        'tracking_code',
        'shipping_cost',
        'status',
        'shipped_at',
        'delivered_at',
    ];

    /**
     * Dapatkan data pesanan terkait pengiriman ini.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Orders::class, 'order_id');
    }

    /**
     * Dapatkan layanan pengiriman yang digunakan.
     */
    public function shippingService(): BelongsTo
    {
        return $this->belongsTo(ShippingServices::class, 'shipping_service_id');
    }

    /**
     * Dapatkan semua riwayat pelacakan pengiriman ini.
     */
    public function shipmentTrackings(): HasMany
    {
        return $this->hasMany(ShipmentTracking::class, 'shipment_id');
    }
}
