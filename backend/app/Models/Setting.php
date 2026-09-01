<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $primaryKey = 'key';
    public $incrementing  = false;
    protected $keyType    = 'string';

    protected $fillable = ['key', 'value', 'description'];

    public static function getValue(string $key, string $default = ''): string
    {
        return static::find($key)?->value ?? $default;
    }
}
