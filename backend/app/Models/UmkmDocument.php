<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UmkmDocument extends Model
{
    protected $table = 'umkm_documents';
    protected $primaryKey = 'id';

    protected $fillable = [
        'umkm_profile_id',
        'document_type',
        'file_path',
        'information',
        'status_verification',
        'verified_by',
        'verified_at',
    ];

    public function umkmProfile(): BelongsTo {
        return $this->belongsTo(UmkmProfile::class, 'umkm_profile_id');
    }
}
