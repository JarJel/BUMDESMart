<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Customer extends Model
{
    protected $table = 'customers';
    protected $primaryKey = 'id';
    protected $fillable = [
        'user_id',
        'name',
        'date_of_birth',
        'gender',
        'address',
        'city',
        'province',
        'postal_code',
        'phone',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function addresses(): HasMany {
        return $this->hasMany(Address::class, 'customer_id');
    }

    public function wishlist(): HasMany {
        return $this->hasMany(Wishlist::class, 'customer_id');
    }

    public function cart(): HasOne {
        return $this->hasOne(Cart::class, 'customer_id');
    }

    public function notifications(): HasMany {
        return $this->hasMany(Notification::class, 'customer_id');
    }
}

