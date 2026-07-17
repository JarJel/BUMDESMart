<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BumdesProfile extends Model
{
    protected $table = 'bumdes_profiles';

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'village',
        'district',
        'city',
        'province',
        'postal_code',
        'phone',
        'email',
        'logo',
        'description',
        'status',
        'fee_type',
        'fee_value',
        'buyer_service_fee',
    ];

    public function calculateFee(float $netAmount): int
    {
        if (!$this->fee_type || $this->fee_value <= 0) return 0;

        if ($this->fee_type === 'percent') {
            $rate = min((float) $this->fee_value, 2.0);
            return (int) round($netAmount * $rate / 100);
        }

        return (int) min((float) $this->fee_value, 1000);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function requiredDocuments(): HasMany
    {
        return $this->hasMany(BumdesRequiredDocument::class, 'bumdes_profile_id');
    }

    public function umkmProfiles(): HasMany
    {
        return $this->hasMany(UmkmProfile::class, 'bumdes_profile_id');
    }
}
