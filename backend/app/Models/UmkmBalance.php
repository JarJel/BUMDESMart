<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UmkmBalance extends Model
{
    protected $fillable = [
        'owner_id',
        'owner_type',
        'pending',
        'available',
        'withdrawn',
    ];

    protected $casts = [
        'pending'   => 'decimal:2',
        'available' => 'decimal:2',
        'withdrawn' => 'decimal:2',
    ];

    public static function findOrCreateFor(int $ownerId, string $ownerType): self
    {
        return self::firstOrCreate(
            ['owner_id' => $ownerId, 'owner_type' => $ownerType],
            ['pending' => 0, 'available' => 0, 'withdrawn' => 0]
        );
    }
}
