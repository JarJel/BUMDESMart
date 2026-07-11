<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UmkmProfile extends Model
{
    protected $table = 'umkm_profiles';

    protected $fillable = [
        'user_id',
        'bumdes_profile_id',
        'shop_name',
        'slug',
        'owner_name',
        'email',
        'phone',
        'logo',
        'banner',
        'description',
        'address',
        'city',
        'province',
        'postal_code',
        'npwp',
        'nib',
        'halal_cert',
        'rating',
        'status',
        'verified_by',
        'verified_at',
        'rejection_reason',
        'business_category',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
            'rating'      => 'float',
        ];
    }

    public function bumdesProfile(): BelongsTo
    {
        return $this->belongsTo(BumdesProfile::class, 'bumdes_profile_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(UmkmDocument::class, 'umkm_profile_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'umkm_profile_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'umkm_profile_id');
    }

    public function promotions(): HasMany
    {
        return $this->hasMany(Promotion::class, 'umkm_profile_id');
    }

    public function recalculateRating(): void
    {
        // Called when a product review is added/updated/deleted
        $avg = $this->products()
            ->whereHas('reviews')
            ->with('reviews:id,product_id,rating')
            ->get()
            ->flatMap(fn($p) => $p->reviews)
            ->avg('rating');

        $this->update(['rating' => $avg ? round($avg, 2) : null]);
    }
}
