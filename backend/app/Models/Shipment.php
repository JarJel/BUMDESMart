<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shipment extends Model
{
    protected $table = 'shipments';

    protected $fillable = [
        'order_id',
        'shipping_service_id',
        'tracking_number',
        'weight',
        'shipping_cost',
        'status',
        'notes',
        'shipped_at',
        'estimated_delivery_at',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'shipped_at'            => 'datetime',
            'estimated_delivery_at' => 'datetime',
            'delivered_at'          => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function shippingService(): BelongsTo
    {
        return $this->belongsTo(ShippingService::class, 'shipping_service_id');
    }

    public function trackings(): HasMany
    {
        return $this->hasMany(ShipmentTracking::class, 'shipment_id');
    }
}
