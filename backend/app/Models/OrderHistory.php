<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderHistory extends Model
{
    protected $table = 'order_histories';
    protected $primaryKey = 'id';
    protected $fillable = [
        'order_id',
        'status',
        'description',
        'user_id',
    ];

    public function order() {
        return $this->belongsTo(Orders::class, 'order_id');
    }

    public function user() {
        return $this->belongsTo(User::class, 'user_id');
    }
}
