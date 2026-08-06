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
        'photos',
        'target',
        'umkm_category',
        'recipient_count',
        'sent_at',
        'event_date',
        'allow_registration',
        'max_participants',
        'registration_deadline',
    ];

    protected $casts = [
        'sent_at'                => 'datetime',
        'photos'                 => 'array',
        'event_date'             => 'date',
        'allow_registration'     => 'boolean',
        'max_participants'       => 'integer',
        'registration_deadline'  => 'date',
    ];

    public function registrations()
    {
        return $this->hasMany(BroadcastRegistration::class, 'broadcast_id');
    }

    public function bumdesProfile()
    {
        return $this->belongsTo(BumdesProfile::class);
    }
}
