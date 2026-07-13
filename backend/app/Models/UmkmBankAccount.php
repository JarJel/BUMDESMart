<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UmkmBankAccount extends Model
{
    protected $fillable = [
        'owner_id',
        'owner_type',
        'channel_code',
        'account_number',
        'account_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
