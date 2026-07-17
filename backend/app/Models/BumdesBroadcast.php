<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BumdesBroadcast extends Model
{
    protected $fillable = [
        'bumdes_profile_id',
        'title',
        'category',
        'content',
        'target',
        'umkm_category',
        'recipient_count',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function bumdesProfile()
    {
        return $this->belongsTo(BumdesProfile::class);
    }
}
