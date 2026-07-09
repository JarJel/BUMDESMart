<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UmkmDocument extends Model
{
    protected $table = 'umkm_documents';

    protected $fillable = [
        'umkm_profile_id',
        'required_document_id',
        'document_type',
        'document_number',
        'file_path',
        'notes',
        'expired_at',
        'status',
        'verified_by',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'expired_at'  => 'date',
            'verified_at' => 'datetime',
        ];
    }

    public function umkmProfile(): BelongsTo
    {
        return $this->belongsTo(UmkmProfile::class, 'umkm_profile_id');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
