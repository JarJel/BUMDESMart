<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UmkmVoucherProgram extends Model
{
    protected $table = 'umkm_voucher_programs';

    protected $fillable = [
        'umkm_profile_id',
        'trigger_type',   // item_count | order_amount | order_frequency
        'trigger_value',  // threshold angka
        'reward_type',    // flat | percentage | free_shipping
        'reward_value',
        'max_discount',
        'label',
        'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function umkmProfile(): BelongsTo
    {
        return $this->belongsTo(UmkmProfile::class, 'umkm_profile_id');
    }

    /**
     * Cek apakah cart memenuhi syarat voucher ini.
     * $context = ['item_count' => int, 'order_amount' => int, 'order_frequency' => int]
     */
    public function isEligible(array $context): bool
    {
        return match ($this->trigger_type) {
            'item_count'       => ($context['item_count'] ?? 0) >= $this->trigger_value,
            'order_amount'     => ($context['order_amount'] ?? 0) >= $this->trigger_value,
            'order_frequency'  => ($context['order_frequency'] ?? 0) >= $this->trigger_value,
            default            => false,
        };
    }

    /**
     * Hitung nilai diskon berdasarkan sub_total.
     */
    public function calculateDiscount(int $subTotal): int
    {
        if ($this->reward_type === 'free_shipping') return 0; // ditangani di FE
        $discount = $this->reward_type === 'percentage'
            ? (int) round($subTotal * $this->reward_value / 100)
            : (int) $this->reward_value;

        if ($this->max_discount) {
            $discount = min($discount, $this->max_discount);
        }
        return min($discount, $subTotal);
    }

    /**
     * Label otomatis kalau tidak diset manual.
     */
    public function getAutoLabel(): string
    {
        $trigger = match ($this->trigger_type) {
            'item_count'      => "Beli {$this->trigger_value} item",
            'order_amount'    => "Belanja Rp " . number_format($this->trigger_value, 0, ',', '.'),
            'order_frequency' => "{$this->trigger_value}x beli di toko ini",
            default           => "Syarat terpenuhi",
        };
        $reward = match ($this->reward_type) {
            'flat'         => "diskon Rp " . number_format($this->reward_value, 0, ',', '.'),
            'percentage'   => "diskon {$this->reward_value}%",
            'free_shipping'=> "gratis ongkir",
            default        => "voucher",
        };
        return "{$trigger} → dapat {$reward}";
    }
}
