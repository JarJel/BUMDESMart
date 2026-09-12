<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

use App\Services\ElasticsearchProductService;

class ProductController extends Controller
{
    protected ElasticsearchProductService $elasticsearchService;

    public function __construct(ElasticsearchProductService $elasticsearchService)
    {
        $this->elasticsearchService = $elasticsearchService;
    }

    public function index(Request $request) {
        try {
            $search = $request->input('search') ?: $request->input('q');

            // 1. Coba Elasticsearch Search jika tersedia
            $esResult = $this->elasticsearchService->searchProducts([
                'search' => $search,
                'category_id' => $request->input('category_id'),
                'umkm_id' => $request->input('umkm_id'),
                'min_price' => $request->input('min_price'),
                'max_price' => $request->input('max_price'),
                'sort_by' => $request->input('sort_by', 'relevance'),
                'page' => $request->input('page', 1),
                'per_page' => $request->input('per_page', 12)
            ]);

            if ($esResult !== null) {
                return response()->json([
                    'success' => true,
                    'message' => 'Produk berhasil diambil (Elasticsearch)',
                    'source' => 'elasticsearch',
                    'data' => [
                        'current_page' => $esResult['page'],
                        'data' => $esResult['items'],
                        'total' => $esResult['total'],
                        'per_page' => $esResult['per_page'],
                        'last_page' => $esResult['last_page'],
                    ],
                    'aggregations' => $esResult['aggregations']
                ]);
            }

            // 2. Fallback ke MySQL Query jika Elasticsearch tidak aktif/bermasalah
            $query = Product::query()->where('status', 'active');

            if (!empty($search)) {
                $query->where('name', 'like', '%' . $search . '%');
            }

            if ($request->has('category_id') && !empty($request->category_id)) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('umkm_id') && !empty($request->umkm_id)) {
                $query->where('umkm_profile_id', $request->umkm_id);
            }

            $products = $query
                ->select(['id', 'name', 'slug', 'price', 'stock', 'weight', 'category_id', 'umkm_profile_id', 'sold_count', 'status', 'has_variant', 'created_at'])
                ->with([
                    'primaryImage:id,product_id,file_path,thumbnail_path,medium_path,is_primary',
                    'umkmProfile:id,shop_name,slug',
                    'activeDiscount:id,product_id,type,value,end_date,is_active,max_uses,used_count',
                    'variants.options',
                ])->paginate(12);

            // Halal cert status per UMKM — satu query untuk semua produk
            $umkmIds = $products->pluck('umkm_profile_id')->unique()->values();
            $halalSet = DB::table('umkm_documents')
                ->join('bumdes_required_documents', 'umkm_documents.required_document_id', '=', 'bumdes_required_documents.id')
                ->whereIn('umkm_documents.umkm_profile_id', $umkmIds)
                ->where('umkm_documents.status', 'approved')
                ->whereRaw("LOWER(bumdes_required_documents.name) LIKE '%halal%'")
                ->pluck('umkm_documents.umkm_profile_id')
                ->mapWithKeys(fn($id) => [$id => true])
                ->all();

            $products->getCollection()->transform(function ($product) use ($halalSet) {
                if ($product->umkmProfile) {
                    $product->umkmProfile->has_halal_cert = isset($halalSet[$product->umkm_profile_id]);
                }
                $product->price = $product->min_price;
                if ($product->activeDiscount) {
                    $product->activeDiscount->discounted_price =
                        $product->activeDiscount->calculateDiscountedPrice((float) $product->price);
                }
                return $product;
            });

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil diambil (MySQL Fallback)',
                'source' => 'mysql',
                'data' => $products
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil produk',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Endpoint Autocomplete produk (Live Search).
     */
    public function autocomplete(Request $request) {
        try {
            $q = $request->input('q') ?: $request->input('query');
            if (empty($q)) {
                return response()->json(['success' => true, 'data' => []]);
            }

            $suggestions = $this->elasticsearchService->suggestKeywords($q);

            return response()->json([
                'success' => true,
                'data' => $suggestions
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil rekomendasi pencarian',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($idOrSlug) {
        try {
            $product = Product::where('status', 'active')
                ->where(function($query) use ($idOrSlug) {
                    $query->where('id', $idOrSlug)
                          ->orWhere('slug', $idOrSlug);
                })
                ->with([
                    'images',
                    'variants.options',
                    'category',
                    'umkmProfile:id,shop_name,slug,logo,banner,description,owner_name,city,rating',
                    'activeDiscount',
                    'reviews.customer.user:id,name',
                ])
                ->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk tidak ditemukan atau tidak aktif.'
                ], 404);
            }

            if ($product->activeDiscount) {
                $product->activeDiscount->discounted_price =
                    $product->activeDiscount->calculateDiscountedPrice((float) $product->price);
            }

            // Halal cert untuk seller di detail produk
            if ($product->umkmProfile) {
                $product->umkmProfile->has_halal_cert = DB::table('umkm_documents')
                    ->join('bumdes_required_documents', 'umkm_documents.required_document_id', '=', 'bumdes_required_documents.id')
                    ->where('umkm_documents.umkm_profile_id', $product->umkm_profile_id)
                    ->where('umkm_documents.status', 'approved')
                    ->whereRaw("LOWER(bumdes_required_documents.name) LIKE '%halal%'")
                    ->exists();
            }

            return response()->json([
                'success' => true,
                'message' => 'Detail produk berhasil diambil.',
                'data' => $product
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail produk.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
