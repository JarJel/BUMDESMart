<?php

namespace App\Observers;

use App\Models\Product;
use App\Jobs\SyncProductToElasticsearch;

class ProductObserver
{
    /**
     * Handle the Product "saved" event (created or updated).
     */
    public function saved(Product $product): void
    {
        SyncProductToElasticsearch::dispatch($product->id, 'index');
    }

    /**
     * Handle the Product "deleted" event.
     */
    public function deleted(Product $product): void
    {
        SyncProductToElasticsearch::dispatch($product->id, 'delete');
    }
}
