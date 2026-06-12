<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentDetail extends Model
{
    protected $table = 'payment_details';
    protected $primaryKey = 'id';

    protected $fillable = [
        'payment_id',
        'key',
        'value',
    ];

    /**
     * Dapatkan data pembayaran induk.
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'payment_id'); 
    }
}
