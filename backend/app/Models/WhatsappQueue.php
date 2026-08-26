<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsappQueue extends Model
{
    protected $table = 'whatsapp_queue';

    protected $fillable = [
        'phone', 'message', 'context', 'status',
        'attempt', 'max_attempts', 'retry_delay',
        'next_retry_at', 'sent_at', 'last_error',
    ];

    protected $casts = [
        'next_retry_at' => 'datetime',
        'sent_at'       => 'datetime',
    ];

    public function logs(): HasMany
    {
        return $this->hasMany(WhatsappLog::class, 'queue_id');
    }

    public function isPending(): bool
    {
        return in_array($this->status, ['pending', 'retrying']);
    }
}
