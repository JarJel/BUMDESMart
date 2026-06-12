<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductVariantsOptions extends Model
{
    protected $table = 'product_variant_options';
    protected $primaryKey = 'id';

    protected $fillable = [
        'product_variant_id',
        'name',
        'value',
    ];

    public function productVariant()
    {
        return $this->belongsTo(ProductVariants::class, 'product_variant_id');
    }
}
