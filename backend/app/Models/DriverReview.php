<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DriverReview extends Model
{
    protected $fillable = [
        'order_id',
        'customer_id',
        'driver_profile_id',
        'rating',
        'comment',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function driverProfile()
    {
        return $this->belongsTo(DriverProfile::class);
    }
}
