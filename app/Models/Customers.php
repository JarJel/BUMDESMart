<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customers extends Model
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

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function orders()
    {
        return $this->hasMany(Orders::class, 'customer_id');
    }

    public function addresses() {
        return $this->hasMany(Addresses::class, 'customer_id');
    }

    public function wishlist() {
        return $this->hasMany(Wishlist::class, 'customer_id');
    }

}
