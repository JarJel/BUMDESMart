<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Promotion extends Model
{
    protected $table = 'promotions';
    protected $primaryKey = 'id';

    protected $fillable = [
        'umkm_profile_id',
        'code',
        'name',
        'description',
        'type',
        'value',
        'min_order_amount',
        'max_discount_amount',
        'start_date',
        'end_date',
        'usage_limit',
        'usage_count',
        'status',
    ];

    /**
     * Dapatkan profil UMKM yang membuat promosi ini.
     */
    public function umkmProfile(): BelongsTo
    {
        return $this->belongsTo(UmkmProfile::class, 'umkm_profile_id');
    }

    /**
     * Dapatkan daftar item produk yang terhubung dengan promosi ini.
     */
    public function promotionProducts(): HasMany
    {
        return $this->hasMany(PromotionProduct::class, 'promotion_id');
    }
}
