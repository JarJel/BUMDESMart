<?php

namespace App\Services;

use App\Models\Product;
use Elastic\Elasticsearch\ClientBuilder;
use Elastic\Elasticsearch\Client;
use Illuminate\Support\Facades\Log;
use Exception;

class ElasticsearchProductService
{
    protected ?Client $client = null;
    protected string $indexName;
    protected bool $enabled;

    public function __construct()
    {
        $this->enabled = config('elasticsearch.enabled', true);
        $prefix = config('elasticsearch.index_prefix', 'bumdesmart_');
        $this->indexName = $prefix . 'products';

        if ($this->enabled && class_exists(ClientBuilder::class)) {
            try {
                $builder = ClientBuilder::create()
                    ->setHosts(config('elasticsearch.hosts', ['http://localhost:9200']));

                if ($username = config('elasticsearch.username')) {
                    $builder->setBasicAuthentication($username, config('elasticsearch.password'));
                }

                if ($apiKey = config('elasticsearch.api_key')) {
                    $builder->setApiKey($apiKey);
                }

                $this->client = $builder->build();
            } catch (Exception $e) {
                Log::warning('Elasticsearch Client Initialization Failed: ' . $e->getMessage());
                $this->client = null;
            }
        }
    }

    public function isAvailable(): bool
    {
        if (!$this->enabled || !$this->client || !class_exists(ClientBuilder::class)) {
            return false;
        }

        try {
            return $this->client->ping()->asBool();
        } catch (Exception $e) {
            Log::warning('Elasticsearch Ping Failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Membuat Index dengan Indonesian Analyzer dan Edge N-Gram Autocomplete Tokenizer.
     */
    public function createProductIndexIfNotExists(): void
    {
        if (!$this->isAvailable()) return;

        try {
            $params = ['index' => $this->indexName];
            $exists = $this->client->indices()->exists($params)->asBool();

            if (!$exists) {
                $indexSettings = [
                    'index' => $this->indexName,
                    'body' => [
                        'settings' => [
                            'analysis' => [
                                'filter' => [
                                    'indonesian_stemmer' => [
                                        'type' => 'stemmer',
                                        'language' => 'indonesian'
                                    ],
                                    'autocomplete_filter' => [
                                        'type' => 'edge_ngram',
                                        'min_gram' => 2,
                                        'max_gram' => 15
                                    ]
                                ],
                                'analyzer' => [
                                    'indonesian_analyzer' => [
                                        'type' => 'custom',
                                        'tokenizer' => 'standard',
                                        'filter' => [
                                            'lowercase',
                                            'indonesian_stemmer'
                                        ]
                                    ],
                                    'autocomplete_analyzer' => [
                                        'type' => 'custom',
                                        'tokenizer' => 'standard',
                                        'filter' => [
                                            'lowercase',
                                            'autocomplete_filter'
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        'mappings' => [
                            'properties' => [
                                'id' => ['type' => 'integer'],
                                'name' => [
                                    'type' => 'text',
                                    'analyzer' => 'indonesian_analyzer',
                                    'fields' => [
                                        'raw' => ['type' => 'keyword'],
                                        'autocomplete' => [
                                            'type' => 'text',
                                            'analyzer' => 'autocomplete_analyzer',
                                            'search_analyzer' => 'standard'
                                        ]
                                    ]
                                ],
                                'slug' => ['type' => 'keyword'],
                                'price' => ['type' => 'double'],
                                'stock' => ['type' => 'integer'],
                                'weight' => ['type' => 'float'],
                                'sold_count' => ['type' => 'integer'],
                                'status' => ['type' => 'keyword'],
                                'category_id' => ['type' => 'integer'],
                                'category_name' => [
                                    'type' => 'text',
                                    'analyzer' => 'indonesian_analyzer',
                                    'fields' => ['raw' => ['type' => 'keyword']]
                                ],
                                'umkm_profile_id' => ['type' => 'integer'],
                                'shop_name' => [
                                    'type' => 'text',
                                    'analyzer' => 'indonesian_analyzer',
                                    'fields' => ['raw' => ['type' => 'keyword']]
                                ],
                                'has_halal_cert' => ['type' => 'boolean'],
                                'has_discount' => ['type' => 'boolean'],
                                'discounted_price' => ['type' => 'double'],
                                'primary_image' => ['type' => 'keyword'],
                                'created_at' => ['type' => 'date', 'format' => 'yyyy-MM-dd HH:mm:ss||yyyy-MM-dd']
                            ]
                        ]
                    ]
                ];

                $this->client->indices()->create($indexSettings);
                Log::info("Elasticsearch index {$this->indexName} created successfully.");
            }
        } catch (Exception $e) {
            Log::error("Failed to create Elasticsearch index: " . $e->getMessage());
        }
    }

    /**
     * Re-index single product ke Elasticsearch.
     */
    public function indexProduct(Product $product): void
    {
        if (!$this->isAvailable()) return;

        try {
            $product->loadMissing(['category', 'umkmProfile', 'primaryImage', 'activeDiscount', 'variants.options']);

            $basePrice = (float) $product->min_price;

            $discountedPrice = $basePrice;
            $hasDiscount = false;
            if ($product->activeDiscount) {
                $discountedPrice = $product->activeDiscount->calculateDiscountedPrice($basePrice);
                $hasDiscount = true;
            }

            // Cek sertifikat halal UMKM
            $hasHalal = false;
            if ($product->umkm_profile_id) {
                $hasHalal = \Illuminate\Support\Facades\DB::table('umkm_documents')
                    ->join('bumdes_required_documents', 'umkm_documents.required_document_id', '=', 'bumdes_required_documents.id')
                    ->where('umkm_documents.umkm_profile_id', $product->umkm_profile_id)
                    ->where('umkm_documents.status', 'approved')
                    ->whereRaw("LOWER(bumdes_required_documents.name) LIKE '%halal%'")
                    ->exists();
            }

            $doc = [
                'id' => (int) $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'price' => $basePrice,
                'stock' => (int) $product->stock,
                'weight' => (float) $product->weight,
                'sold_count' => (int) $product->sold_count,
                'status' => $product->status,
                'category_id' => (int) $product->category_id,
                'category_name' => $product->category->name ?? '',
                'umkm_profile_id' => (int) $product->umkm_profile_id,
                'shop_name' => $product->umkmProfile->shop_name ?? '',
                'has_halal_cert' => $hasHalal,
                'has_discount' => $hasDiscount,
                'discounted_price' => $discountedPrice,
                'primary_image' => $product->primaryImage->file_path ?? null,
                'created_at' => $product->created_at ? $product->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s')
            ];

            $this->client->index([
                'index' => $this->indexName,
                'id' => $product->id,
                'body' => $doc
            ]);
        } catch (Exception $e) {
            Log::error("Failed to index product ID {$product->id} to Elasticsearch: " . $e->getMessage());
        }
    }

    /**
     * Hapus dokumen produk dari Elasticsearch.
     */
    public function deleteProduct(int $productId): void
    {
        if (!$this->isAvailable()) return;

        try {
            $this->client->delete([
                'index' => $this->indexName,
                'id' => $productId
            ]);
        } catch (Exception $e) {
            Log::warning("Failed to delete product ID {$productId} from Elasticsearch: " . $e->getMessage());
        }
    }

    /**
     * Pencarian Produk dengan Fuzzy, Boosting, Filter Agregasi, dan Highlighting.
     */
    public function searchProducts(array $params): ?array
    {
        if (!$this->isAvailable()) return null;

        try {
            $search = $params['search'] ?? '';
            $categoryId = $params['category_id'] ?? null;
            $umkmId = $params['umkm_id'] ?? null;
            $minPrice = $params['min_price'] ?? null;
            $maxPrice = $params['max_price'] ?? null;
            $sortBy = $params['sort_by'] ?? 'relevance';
            $page = max(1, (int)($params['page'] ?? 1));
            $perPage = max(1, (int)($params['per_page'] ?? 12));
            $from = ($page - 1) * $perPage;

            $must = [
                ['term' => ['status' => 'active']]
            ];

            if (!empty($categoryId)) {
                $must[] = ['term' => ['category_id' => (int) $categoryId]];
            }

            if (!empty($umkmId)) {
                $must[] = ['term' => ['umkm_profile_id' => (int) $umkmId]];
            }

            if ($minPrice !== null || $maxPrice !== null) {
                $range = [];
                if ($minPrice !== null) $range['gte'] = (float) $minPrice;
                if ($maxPrice !== null) $range['lte'] = (float) $maxPrice;
                $must[] = ['range' => ['discounted_price' => $range]];
            }

            // Text search dengan Field Boosting & Fuzziness (Typo tolerance)
            if (!empty($search)) {
                $must[] = [
                    'multi_match' => [
                        'query' => $search,
                        'fields' => [
                            'name^4',
                            'category_name^2',
                            'shop_name^2'
                        ],
                        'fuzziness' => 'AUTO',
                        'prefix_length' => 2
                    ]
                ];
            }

            // Sorting strategy
            $sort = [];
            switch ($sortBy) {
                case 'price_asc':
                    $sort[] = ['discounted_price' => 'asc'];
                    break;
                case 'price_desc':
                    $sort[] = ['discounted_price' => 'desc'];
                    break;
                case 'latest':
                    $sort[] = ['created_at' => 'desc'];
                    break;
                case 'top_seller':
                    $sort[] = ['sold_count' => 'desc'];
                    break;
                case 'relevance':
                default:
                    if (!empty($search)) {
                        $sort[] = ['_score' => 'desc'];
                    }
                    $sort[] = ['created_at' => 'desc'];
                    break;
            }

            $body = [
                'from' => $from,
                'size' => $perPage,
                'query' => [
                    'bool' => [
                        'must' => $must
                    ]
                ],
                'sort' => $sort,
                'aggs' => [
                    'categories' => [
                        'terms' => ['field' => 'category_name.raw', 'size' => 20]
                    ],
                    'price_stats' => [
                        'stats' => ['field' => 'discounted_price']
                    ]
                ]
            ];

            if (!empty($search)) {
                $body['highlight'] = [
                    'fields' => [
                        'name' => new \stdClass()
                    ],
                    'pre_tags' => ['<mark>'],
                    'post_tags' => ['</mark>']
                ];
            }

            $response = $this->client->search([
                'index' => $this->indexName,
                'body' => $body
            ])->asArray();

            $hits = $response['hits']['hits'] ?? [];
            $totalHits = $response['hits']['total']['value'] ?? 0;

            $items = array_map(function ($hit) {
                $source = $hit['_source'];
                $source['score'] = $hit['_score'] ?? null;
                if (isset($hit['highlight']['name'])) {
                    $source['highlighted_name'] = implode(' ', $hit['highlight']['name']);
                }
                return $source;
            }, $hits);

            return [
                'total' => $totalHits,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => ceil($totalHits / $perPage),
                'items' => $items,
                'aggregations' => [
                    'categories' => $response['aggregations']['categories']['buckets'] ?? [],
                    'price_stats' => $response['aggregations']['price_stats'] ?? []
                ]
            ];

        } catch (Exception $e) {
            Log::error("Elasticsearch Product Search Failed: " . $e->getMessage());
            return null; // Signals controller to fallback to SQL query
        }
    }

    /**
     * Autocomplete suggestions untuk pencarian produk.
     */
    public function suggestKeywords(string $query): array
    {
        if (!$this->isAvailable() || empty($query)) return [];

        try {
            $response = $this->client->search([
                'index' => $this->indexName,
                'body' => [
                    'size' => 6,
                    'query' => [
                        'bool' => [
                            'must' => [
                                ['term' => ['status' => 'active']],
                                [
                                    'match' => [
                                        'name.autocomplete' => [
                                            'query' => $query,
                                            'operator' => 'and'
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ],
                    '_source' => ['id', 'name', 'slug', 'price', 'primary_image', 'shop_name']
                ]
            ])->asArray();

            return array_map(fn($hit) => $hit['_source'], $response['hits']['hits'] ?? []);
        } catch (Exception $e) {
            Log::warning("Elasticsearch Autocomplete Failed: " . $e->getMessage());
            return [];
        }
    }
}
