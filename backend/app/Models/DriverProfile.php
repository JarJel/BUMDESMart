<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'vehicle_type',
        'vehicle_brand',
        'vehicle_plate',
        'vehicle_year',
        'sim_type',
        'id_number',
        'is_available',
        'is_verified',
        'total_deliveries',
        'rating',
    ];

    protected $casts = [
        'is_available'      => 'boolean',
        'is_verified'       => 'boolean',
        'rating'            => 'float',
        'total_deliveries'  => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
