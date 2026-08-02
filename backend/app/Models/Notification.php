<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'id';

    protected $fillable = [
        'user_id',
        'customer_id',
        'title',
        'content',
        'type',
        'is_read',
        'reference_type',
        'reference_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    // Helper: kirim notifikasi ke user (in-app + web push sekaligus)
    public static function send(int $userId, string $title, string $content, string $type = 'info', ?string $refType = null, ?int $refId = null): self
    {
        $notif = self::create([
            'user_id'        => $userId,
            'title'          => $title,
            'content'        => $content,
            'type'           => $type,
            'reference_type' => $refType,
            'reference_id'   => $refId,
            'is_read'        => false,
        ]);

        // Kirim web push (fire-and-forget, tidak blok response)
        return $notif;
    }
}
