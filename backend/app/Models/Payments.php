<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payments extends Model
{
    protected $table = 'payments';
    protected $primaryKey = 'id';

    protected $fillable = [
        'order_id',
        'payment_code',
        'amount',
        'provider',
        'method',
        'status',
        'notes',
        'paid_at',
        'refunded_at',
    ];

    public function order() {
        return $this->belongsTo(Orders::class, 'order_id');
    }

    public function paymentDetails() {
        return $this->hasMany(PaymentDetails::class, 'payment_id');
    }
}
