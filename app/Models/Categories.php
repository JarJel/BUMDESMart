<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categories extends Model
{
    protected $table = 'categories';
    protected $primaryKey = 'id';

    protected $fillable = [
        'name',
        'slug',
        'parent_id',
        'description',
        'status',
    ];

    public function products() {
        return $this->hasMany(Products::class, 'category_id');
    }

    public function parent() {
        return $this->belongsTo(Categories::class, 'parent_id');
    }

    public function childs() {
        return $this->hasMany(Categories::class, 'parent_id');
    }
}
