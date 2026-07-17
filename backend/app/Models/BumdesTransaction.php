<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BumdesTransaction extends Model
{
    protected $fillable = [
        'bumdes_profile_id',
        'order_id',
        'type',
        'amount',
        'description',
    ];

    public function bumdesProfile()
    {
        return $this->belongsTo(BumdesProfile::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
