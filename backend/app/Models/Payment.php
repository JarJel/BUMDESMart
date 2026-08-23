<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'order_id',
        'snap_token',
        'midtrans_order_id',
        'payment_code',
        'channel',
        'channel_code',
        'amount',
        'fee_amount',
        'payment_data',
        'status',
        'paid_at',
        'expired_at',
        'refunded_at',
    ];

    protected function casts(): array
    {
        return [
            'payment_data' => 'array',
            'paid_at'      => 'datetime',
            'expired_at'   => 'datetime',
            'refunded_at'  => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(PaymentDetail::class, 'payment_id');
    }
}
