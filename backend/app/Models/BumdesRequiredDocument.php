<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BumdesRequiredDocument extends Model
{
    protected $table = 'bumdes_required_documents';

    protected $fillable = [
        'bumdes_profile_id',
        'name',
        'description',
        'is_required',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
        ];
    }

    public function bumdesProfile(): BelongsTo
    {
        return $this->belongsTo(BumdesProfile::class, 'bumdes_profile_id');
    }
}
