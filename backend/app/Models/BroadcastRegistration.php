<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BroadcastRegistration extends Model
{
    protected $fillable = ['broadcast_id', 'user_id', 'registrant_type'];

    public function broadcast()
    {
        return $this->belongsTo(BumdesBroadcast::class, 'broadcast_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
