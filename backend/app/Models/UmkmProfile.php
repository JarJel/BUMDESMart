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
        'latitude',
        'longitude',
        'npwp',
        'nib',
        'halal_cert',
        'rating',
        'status',
        'is_open',
        'open_hours',
        'closed_until',
        'verified_by',
        'verified_at',
        'rejection_reason',
        'business_category',
        'agreed_to_terms',
        'agreed_at',
    ];

    protected function casts(): array
    {
        return [
            'verified_at'     => 'datetime',
            'agreed_at'       => 'datetime',
            'agreed_to_terms' => 'boolean',
            'rating'          => 'float',
            'is_open'         => 'boolean',
            'open_hours'      => 'array',
            'closed_until'    => 'datetime',
        ];
    }

    public function getIsCurrentlyOpenAttribute(): bool
    {
        if (!$this->is_open) return false;

        if ($this->closed_until && $this->closed_until->isFuture()) return false;

        if (!$this->open_hours) return true;

        $days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
        $today = $days[now()->dayOfWeek];
        $hours = $this->open_hours[$today] ?? null;

        if (!$hours || ($hours['closed'] ?? false)) return false;

        $now = now()->format('H:i');
        return $now >= ($hours['open'] ?? '00:00') && $now <= ($hours['close'] ?? '23:59');
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
        try {
            $avg = $this->products()
                ->whereHas('reviews')
                ->with('reviews:id,product_id,rating')
                ->get()
                ->flatMap(fn($p) => $p->reviews)
                ->avg('rating');

            $this->update(['rating' => $avg ? round($avg, 2) : null]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('recalculateRating: ' . $e->getMessage());
        }
    }
}
