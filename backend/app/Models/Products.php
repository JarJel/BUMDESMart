<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Products extends Model
{
    protected $table = 'products';
    protected $primaryKey = 'id';

    protected $fillable = [
        'umkm_profile_id',
        'name',
        'slug',
        'category_id',
        'description',
        'price',
        'stock',
        'weight',
        'status',
        'is_digital',
    ];

    /**
     * Dapatkan profil UMKM pemilik produk ini.
     */
    public function umkmProfile(): BelongsTo
    {
        return $this->belongsTo(UmkmProfile::class, 'umkm_profile_id');
    }

    /**
     * Dapatkan kategori produk ini.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Categories::class, 'category_id');
    }

    /**
     * Dapatkan semua gambar produk ini.
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImages::class, 'product_id');
    }

    /**
     * Dapatkan semua varian produk ini.
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariants::class, 'product_id');
    }
}
