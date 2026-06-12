<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
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

    public function order(): BelongsTo {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function paymentDetails(): HasMany {
        return $this->hasMany(PaymentDetail::class, 'payment_id');
    }
}
