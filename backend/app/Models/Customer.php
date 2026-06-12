<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
}
