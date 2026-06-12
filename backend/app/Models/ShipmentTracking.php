<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShipmentTracking extends Model
{
    protected $table = 'shipment_tracking';
    protected $primaryKey = 'id';

    protected $fillable = [
        'shipment_id',
        'status',
        'date',
        'location',
        'description',
    ];

    /**
     * Dapatkan data pengiriman terkait pelacakan ini.
     */
    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class, 'shipment_id');
    }
}
