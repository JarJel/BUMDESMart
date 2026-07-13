<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Disbursement extends Model
{
    protected $fillable = [
        'order_id',
        'owner_id',
        'owner_type',
        'channel_code',
        'account_number',
        'account_name',
        'amount',
        'xendit_disbursement_id',
        'reference_id',
        'status',
        'failure_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
