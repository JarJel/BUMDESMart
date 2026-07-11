<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;
use Exception;

class ProductController extends Controller
{
    #[OA\Get(
        path: "/seller/products",
        summary: "List Seller Products",
        description: "Retrieve a paginated list of products belonging to the authenticated UMKM seller.",
        tags: ["Seller Products"],
        security: [["sanctum" => []]]
    )]
    #[OA\Parameter(
        name: "search",
        in: "query",
        description: "Search products by name",
        required: false,
        schema: new OA\Schema(type: "string")
    )]
    #[OA\Parameter(
        name: "category_id",
        in: "query",
        description: "Filter products by category ID",
        required: false,
        schema: new OA\Schema(type: "integer")
    )]
    #[OA\Parameter(
        name: "status",
        in: "query",
        description: "Filter products by status",
        required: false,
        schema: new OA\Schema(type: "string", enum: ["active", "inactive", "draft"])
    )]
    #[OA\Response(
        response: 200,
        description: "Successful operation",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "success", type: "boolean", example: true),
                new OA\Property(property: "data", type: "object")
            ]
        )
    )]
    #[OA\Response(response: 403, description: "Unauthorized")]
    #[OA\Response(response: 404, description: "Seller profile not found")]
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'umkm') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only UMKM can access this resource.'
            ], 403);
        }

        $umkmProfile = $user->umkmProfile;
        if (!$umkmProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Profil UMKM tidak ditemukan.'
            ], 404);
        }

        try {
            $query = Product::where('umkm_profile_id', $umkmProfile->id)
                ->with(['category', 'images', 'primaryImage']);

            if ($request->has('search')) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }

            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $products = $query->orderBy('created_at', 'desc')->paginate(10);

            return response()->json([
                'success' => true,
                'data' => $products
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Gagal mengambil data produk: ' . $e->getMessage()
            ], 500);
        }
    }

    #[OA\Post(
        path: "/seller/products",
        summary: "Create Seller Product",
        description: "Create a new product for the authenticated UMKM seller.",
        tags: ["Seller Products"],
        security: [["sanctum" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\MediaType(
            mediaType: "multipart/form-data",
            schema: new OA\Schema(
                required: ["category_id", "name", "description", "price", "stock", "weight"],
                properties: [
                    new OA\Property(property: "category_id", type: "integer", example: 1),
                    new OA\Property(property: "name", type: "string", example: "Keripik Singkong Pedas"),
                    new OA\Property(property: "description", type: "string", example: "Keripik singkong khas desa Sukamaju"),
                    new OA\Property(property: "price", type: "number", format: "float", example: 15000),
                    new OA\Property(property: "stock", type: "integer", example: 50),
                    new OA\Property(property: "weight", type: "integer", description: "Weight in grams", example: 200),
                    new OA\Property(property: "is_digital", type: "boolean", example: false),
                    new OA\Property(property: "status", type: "string", enum: ["active", "inactive", "draft"], example: "draft"),
                    new OA\Property(
                        property: "images[]",
                        type: "array",
                        items: new OA\Items(type: "string", format: "binary"),
                        description: "Product image files (max: 2MB per file)"
                    )
                ]
            )
        )
    )]
    #[OA\Response(
        response: 201,
        description: "Product created successfully",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "success", type: "boolean", example: true),
                new OA\Property(property: "message", type: "string", example: "Produk berhasil ditambahkan."),
                new OA\Property(property: "data", type: "object")
            ]
        )
    )]
    #[OA\Response(response: 422, description: "Validation error")]
    #[OA\Response(response: 403, description: "Unauthorized")]
    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'umkm') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only UMKM can access this resource.'
            ], 403);
        }

        $umkmProfile = $user->umkmProfile;
        if (!$umkmProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Profil UMKM tidak ditemukan.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:categories,id',
            'name'        => 'required|string|max:255',
            'description' => 'required|string',
            'price'       => 'required|numeric|min:0',
            'stock'       => 'required|integer|min:0',
            'weight'      => 'required|integer|min:0',
            'is_digital'  => 'sometimes|boolean',
            'status'      => 'sometimes|in:active,inactive,draft',
            'images'      => 'sometimes|array',
            'images.*'    => 'image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $slug = Str::slug($request->name);
            if (Product::where('slug', $slug)->exists()) {
                $slug = $slug . '-' . time();
            }

            $product = Product::create([
                'umkm_profile_id' => $umkmProfile->id,
                'category_id'     => $request->category_id,
                'name'            => $request->name,
                'slug'            => $slug,
                'description'     => $request->description,
                'price'           => $request->price,
                'stock'           => $request->stock,
                'weight'          => $request->weight ?? 0,
                'is_digital'      => $request->is_digital ?? false,
                'has_variant'     => false,
                'status'          => $request->status ?? 'draft',
            ]);

            if ($request->hasFile('images')) {
                $destinationPath = public_path('uploads/products');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0755, true);
                }

                foreach ($request->file('images') as $index => $file) {
                    $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $file->move($destinationPath, $filename);

                    ProductImage::create([
                        'product_id' => $product->id,
                        'file_path'  => '/uploads/products/' . $filename,
                        'is_primary' => $index === 0,
                        'sort_order' => $index,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil ditambahkan.',
                'data' => $product->load(['category', 'images'])
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Gagal menambahkan produk: ' . $e->getMessage()
            ], 500);
        }
    }

    #[OA\Get(
        path: "/seller/products/{id}",
        summary: "Show Seller Product",
        description: "Retrieve details of a specific product belonging to the authenticated UMKM seller.",
        tags: ["Seller Products"],
        security: [["sanctum" => []]]
    )]
    #[OA\Parameter(
        name: "id",
        in: "path",
        description: "Product ID",
        required: true,
        schema: new OA\Schema(type: "integer")
    )]
    #[OA\Response(
        response: 200,
        description: "Successful operation",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "success", type: "boolean", example: true),
                new OA\Property(property: "data", type: "object")
            ]
        )
    )]
    #[OA\Response(response: 403, description: "Unauthorized")]
    #[OA\Response(response: 404, description: "Product or Seller profile not found")]
    public function show(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'umkm') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only UMKM can access this resource.'
            ], 403);
        }

        $umkmProfile = $user->umkmProfile;
        if (!$umkmProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Profil UMKM tidak ditemukan.'
            ], 404);
        }

        try {
            $product = Product::where('id', $id)
                ->where('umkm_profile_id', $umkmProfile->id)
                ->with(['category', 'images', 'primaryImage'])
                ->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk tidak ditemukan atau Anda tidak memiliki akses.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $product
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Gagal mengambil detail produk: ' . $e->getMessage()
            ], 500);
        }
    }

    #[OA\Post(
        path: "/seller/products/{id}",
        summary: "Update Seller Product",
        description: "Update product details and images. Use multipart/form-data and pass _method=PUT in body for PUT override.",
        tags: ["Seller Products"],
        security: [["sanctum" => []]]
    )]
    #[OA\Parameter(
        name: "id",
        in: "path",
        description: "Product ID",
        required: true,
        schema: new OA\Schema(type: "integer")
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\MediaType(
            mediaType: "multipart/form-data",
            schema: new OA\Schema(
                properties: [
                    new OA\Property(property: "_method", type: "string", example: "PUT", description: "Method spoofing for PUT request"),
                    new OA\Property(property: "category_id", type: "integer", example: 1),
                    new OA\Property(property: "name", type: "string", example: "Keripik Singkong Extra Pedas"),
                    new OA\Property(property: "description", type: "string", example: "Keripik pedas nikmat desa Sukamaju"),
                    new OA\Property(property: "price", type: "number", format: "float", example: 16000),
                    new OA\Property(property: "stock", type: "integer", example: 60),
                    new OA\Property(property: "weight", type: "integer", example: 200),
                    new OA\Property(property: "is_digital", type: "boolean", example: false),
                    new OA\Property(property: "status", type: "string", enum: ["active", "inactive", "draft"]),
                    new OA\Property(
                        property: "images[]",
                        type: "array",
                        items: new OA\Items(type: "string", format: "binary"),
                        description: "New product images to upload"
                    ),
                    new OA\Property(
                        property: "delete_image_ids[]",
                        type: "array",
                        items: new OA\Items(type: "integer"),
                        description: "IDs of product images to delete"
                    )
                ]
            )
        )
    )]
    #[OA\Response(
        response: 200,
        description: "Product updated successfully",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "success", type: "boolean", example: true),
                new OA\Property(property: "message", type: "string", example: "Produk berhasil diperbarui."),
                new OA\Property(property: "data", type: "object")
            ]
        )
    )]
    #[OA\Response(response: 422, description: "Validation error")]
    #[OA\Response(response: 404, description: "Product not found")]
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'umkm') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only UMKM can access this resource.'
            ], 403);
        }

        $umkmProfile = $user->umkmProfile;
        if (!$umkmProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Profil UMKM tidak ditemukan.'
            ], 404);
        }

        $product = Product::where('id', $id)
            ->where('umkm_profile_id', $umkmProfile->id)
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan atau Anda tidak memiliki akses.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'category_id'       => 'sometimes|required|exists:categories,id',
            'name'              => 'sometimes|required|string|max:255',
            'description'       => 'sometimes|required|string',
            'price'             => 'sometimes|required|numeric|min:0',
            'stock'             => 'sometimes|required|integer|min:0',
            'weight'            => 'sometimes|required|integer|min:0',
            'is_digital'        => 'sometimes|boolean',
            'status'            => 'sometimes|in:active,inactive,draft',
            'images'            => 'sometimes|array',
            'images.*'          => 'image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'delete_image_ids'  => 'sometimes|array',
            'delete_image_ids.*'=> 'exists:product_images,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $updateData = $request->only([
                'category_id', 'name', 'description', 'price', 'stock', 'weight', 'is_digital', 'status'
            ]);

            if ($request->has('name') && $request->name !== $product->name) {
                $slug = Str::slug($request->name);
                if (Product::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                    $slug = $slug . '-' . time();
                }
                $updateData['slug'] = $slug;
            }

            $product->update($updateData);

            if ($request->has('delete_image_ids')) {
                $deleteIds = $request->delete_image_ids;
                $imagesToDelete = ProductImage::where('product_id', $product->id)
                    ->whereIn('id', $deleteIds)
                    ->get(['id', 'file_path']);

                // Hapus file dari filesystem dulu
                foreach ($imagesToDelete as $img) {
                    if (file_exists(public_path($img->file_path))) {
                        @unlink(public_path($img->file_path));
                    }
                }
                // Hapus DB record sekaligus (1 query, bukan N)
                ProductImage::whereIn('id', $deleteIds)->where('product_id', $product->id)->delete();
            }

            if ($request->hasFile('images')) {
                $destinationPath = public_path('uploads/products');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0755, true);
                }

                $currentImagesCount = ProductImage::where('product_id', $product->id)->count();

                foreach ($request->file('images') as $index => $file) {
                    $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $file->move($destinationPath, $filename);

                    ProductImage::create([
                        'product_id' => $product->id,
                        'file_path'  => '/uploads/products/' . $filename,
                        'is_primary' => ($currentImagesCount === 0 && $index === 0),
                        'sort_order' => $currentImagesCount + $index,
                    ]);
                }
            }

            if (!ProductImage::where('product_id', $product->id)->where('is_primary', true)->exists()) {
                $firstImage = ProductImage::where('product_id', $product->id)->first();
                if ($firstImage) {
                    $firstImage->update(['is_primary' => true]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil diperbarui.',
                'data' => $product->load(['category', 'images'])
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Gagal memperbarui produk: ' . $e->getMessage()
            ], 500);
        }
    }

    #[OA\Delete(
        path: "/seller/products/{id}",
        summary: "Delete Seller Product",
        description: "Delete a product belonging to the authenticated UMKM seller.",
        tags: ["Seller Products"],
        security: [["sanctum" => []]]
    )]
    #[OA\Parameter(
        name: "id",
        in: "path",
        description: "Product ID",
        required: true,
        schema: new OA\Schema(type: "integer")
    )]
    #[OA\Response(
        response: 200,
        description: "Product deleted successfully",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "success", type: "boolean", example: true),
                new OA\Property(property: "message", type: "string", example: "Produk berhasil dihapus.")
            ]
        )
    )]
    #[OA\Response(response: 403, description: "Unauthorized")]
    #[OA\Response(response: 404, description: "Product not found")]
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'umkm') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only UMKM can access this resource.'
            ], 403);
        }

        $umkmProfile = $user->umkmProfile;
        if (!$umkmProfile) {
            return response()->json([
                'success' => false,
                'message' => 'Profil UMKM tidak ditemukan.'
            ], 404);
        }

        $product = Product::where('id', $id)
            ->where('umkm_profile_id', $umkmProfile->id)
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan atau Anda tidak memiliki akses.'
            ], 404);
        }

        DB::beginTransaction();
        try {
            $productImages = ProductImage::where('product_id', $product->id)->get();
            foreach ($productImages as $img) {
                if (file_exists(public_path($img->file_path))) {
                    @unlink(public_path($img->file_path));
                }
            }

            $product->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Produk berhasil dihapus.'
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Gagal menghapus produk: ' . $e->getMessage()
            ], 500);
        }
    }
}
