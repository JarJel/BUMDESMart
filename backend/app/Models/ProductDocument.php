<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductDocument extends Model
{
    protected $table = 'product_documents';

    const TYPE_HALAL   = 'halal';
    const TYPE_BPOM    = 'bpom';
    const TYPE_PIRT    = 'pirt';
    const TYPE_ORGANIC = 'organik';
    const TYPE_SNI     = 'sni';
    const TYPE_OTHER   = 'other';

    protected $fillable = [
        'product_id',
        'document_type',
        'document_number',
        'issuer',
        'file_path',
        'issued_at',
        'expired_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'issued_at'  => 'date',
            'expired_at' => 'date',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
