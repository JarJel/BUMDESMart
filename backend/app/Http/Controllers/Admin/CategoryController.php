<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::with('children')
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'parent_id'   => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'sort_order'  => 'nullable|integer|min:0',
            'is_active'   => 'nullable|boolean',
        ]);

        $validated['slug']      = Str::slug($validated['name']);
        $validated['is_active'] = $validated['is_active'] ?? true;

        $category = Category::create($validated);

        return response()->json(['message' => 'Kategori berhasil ditambahkan.', 'data' => $category], 201);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'parent_id'   => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'sort_order'  => 'nullable|integer|min:0',
            'is_active'   => 'nullable|boolean',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return response()->json(['message' => 'Kategori berhasil diperbarui.', 'data' => $category]);
    }

    public function destroy(Category $category)
    {
        if ($category->children()->exists()) {
            return response()->json(['message' => 'Kategori ini memiliki sub-kategori. Hapus sub-kategori terlebih dahulu.'], 422);
        }

        if ($category->products()->exists()) {
            return response()->json(['message' => 'Kategori ini masih digunakan oleh produk. Tidak dapat dihapus.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Kategori berhasil dihapus.']);
    }

    public function seedDefaults()
    {
        $defaults = [
            ['name' => 'Makanan & Minuman',       'sort_order' => 1],
            ['name' => 'Kerajinan Tangan',         'sort_order' => 2],
            ['name' => 'Tekstil & Fashion',        'sort_order' => 3],
            ['name' => 'Pertanian & Peternakan',   'sort_order' => 4],
            ['name' => 'Elektronik',               'sort_order' => 5],
            ['name' => 'Kesehatan & Kecantikan',   'sort_order' => 6],
            ['name' => 'Jasa',                     'sort_order' => 7],
            ['name' => 'Lainnya',                  'sort_order' => 8],
        ];

        $added = 0;
        foreach ($defaults as $item) {
            $slug = Str::slug($item['name']);
            $exists = Category::where('slug', $slug)->whereNull('parent_id')->exists();
            if (!$exists) {
                Category::create([
                    'name'       => $item['name'],
                    'slug'       => $slug,
                    'sort_order' => $item['sort_order'],
                    'is_active'  => true,
                ]);
                $added++;
            }
        }

        return response()->json([
            'message' => $added > 0
                ? "{$added} kategori default berhasil ditambahkan."
                : "Semua kategori default sudah ada.",
        ]);
    }
}
