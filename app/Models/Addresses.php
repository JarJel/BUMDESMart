<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Addresses extends Model
{
    protected $table = 'addresses';
    protected $primaryKey = 'id';

    protected $fillable = [
        'customer_id',
        'label',
        'recipient_name',
        'phone',
        'address',
        'city',
        'province',
        'postal_code',
        'is_default',
    ];

    public function customer() {
        return $this->belongsTo(Customers::class, 'customer_id');
    }
}
