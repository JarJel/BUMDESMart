<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsappLog extends Model
{
    public $timestamps = false;

    protected $table = 'whatsapp_logs';

    protected $fillable = ['queue_id', 'attempt', 'status', 'error', 'executed_at'];

    protected $casts = ['executed_at' => 'datetime'];

    public function queue(): BelongsTo
    {
        return $this->belongsTo(WhatsappQueue::class, 'queue_id');
    }
}
