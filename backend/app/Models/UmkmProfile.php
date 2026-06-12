<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UmkmProfile extends Model
{
    protected $table = 'umkm_profile';
    protected $primaryKey = 'id';

    protected $fillable = [
        'user_id',
        'name_umkm',
        'npwp',
        'nib',
        'logo',
        'address',
        'city',
        'province',
        'postal_code',
        'phone',
        'description',
        'status',
        'created_at',
        'updated_at'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'umkm_profile_id');
    }

    public function umkmDocuments() {
        return $this->hasMany(UmkmDocument::class, 'umkm_profile_id');
    }

    public function orders() {
        return $this->hasMany(Order::class, 'umkm_profile_id');
    }
}
