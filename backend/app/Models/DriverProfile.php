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
        'photo_profile',
        'photo_ktp',
        'bank_name',
        'bank_account_number',
        'bank_account_name',
        'is_available',
        'is_verified',
        'is_suspended',
        'suspension_reason',
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
