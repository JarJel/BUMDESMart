<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Promotion extends Model
{
    protected $table = 'promotions';

    protected $fillable = [
        'umkm_profile_id',
        'customer_id',
        'voucher_program_id',
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
        'is_auto_generated',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'datetime',
            'end_date'   => 'datetime',
        ];
    }

    public function umkmProfile(): BelongsTo
    {
        return $this->belongsTo(UmkmProfile::class, 'umkm_profile_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function voucherProgram(): BelongsTo
    {
        return $this->belongsTo(UmkmVoucherProgram::class, 'voucher_program_id');
    }

    public function promotionProducts(): HasMany
    {
        return $this->hasMany(PromotionProduct::class, 'promotion_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'promotion_id');
    }
}
