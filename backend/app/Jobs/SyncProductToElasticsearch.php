<?php

namespace App\Jobs;

use App\Models\Product;
use App\Services\ElasticsearchProductService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Exception;

class SyncProductToElasticsearch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $productId;
    public string $action; // 'index' or 'delete'

    /**
     * Create a new job instance.
     */
    public function __construct(int $productId, string $action = 'index')
    {
        $this->productId = $productId;
        $this->action = $action;
    }

    /**
     * Execute the job.
     */
    public function handle(ElasticsearchProductService $elasticsearchService): void
    {
        try {
            if ($this->action === 'delete') {
                $elasticsearchService->deleteProduct($this->productId);
                Log::info("Elasticsearch Job: Deleted product ID {$this->productId}");
                return;
            }

            $product = Product::find($this->productId);
            if ($product) {
                $elasticsearchService->indexProduct($product);
                Log::info("Elasticsearch Job: Indexed product ID {$this->productId}");
            } else {
                $elasticsearchService->deleteProduct($this->productId);
            }
        } catch (Exception $e) {
            Log::error("SyncProductToElasticsearch Job Failed for product ID {$this->productId}: " . $e->getMessage());
        }
    }
}
