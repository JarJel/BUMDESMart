<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;
use App\Services\ElasticsearchProductService;

class ReindexElasticsearchProducts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'elastic:reindex-products';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Re-index semua produk aktif ke Elasticsearch';

    /**
     * Execute the console command.
     */
    public function handle(ElasticsearchProductService $elasticsearchService): int
    {
        $this->info('Memeriksa konektivitas Elasticsearch...');

        if (!$elasticsearchService->isAvailable()) {
            $this->error('Elasticsearch tidak tersedia atau dalam keadaan disabled. Batalkan re-index.');
            return 1;
        }

        $this->info('Membuat/memperbarui index produk...');
        $elasticsearchService->createProductIndexIfNotExists();

        $count = Product::where('status', 'active')->count();
        $this->info("Menemukan {$count} produk aktif untuk di-index.");

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        Product::where('status', 'active')
            ->with(['category', 'umkmProfile', 'primaryImage', 'activeDiscount'])
            ->chunk(100, function ($products) use ($elasticsearchService, $bar) {
                foreach ($products as $product) {
                    $elasticsearchService->indexProduct($product);
                    $bar->advance();
                }
            });

        $bar->finish();
        $this->newLine();
        $this->info('Re-index produk ke Elasticsearch selesai!');

        return 0;
    }
}
