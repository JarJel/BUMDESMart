<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteVisit extends Model
{
    protected $fillable = [
        'session_id',
        'ip_address',
        'user_agent',
        'page',
        'user_id',
        'visited_date',
    ];

    protected $casts = [
        'visited_date' => 'date',
    ];
}
