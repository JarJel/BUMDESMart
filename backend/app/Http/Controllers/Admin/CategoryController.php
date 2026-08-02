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
        $tree = [
            [
                'name' => 'Makanan & Minuman',
                'description' => 'Produk makanan dan minuman olahan maupun segar',
                'sort_order' => 1,
                'children' => [
                    ['name' => 'Makanan Basah',    'description' => 'Lauk, gorengan, dan makanan siap saji',       'sort_order' => 1],
                    ['name' => 'Makanan Kering',   'description' => 'Keripik, kue kering, dan makanan tahan lama', 'sort_order' => 2],
                    ['name' => 'Minuman',           'description' => 'Minuman kemasan, segar, dan tradisional',     'sort_order' => 3],
                    ['name' => 'Jajanan & Camilan', 'description' => 'Snack, kue basah, dan jajanan pasar',        'sort_order' => 4],
                ],
            ],
            [
                'name' => 'Kerajinan Tangan',
                'description' => 'Produk kerajinan buatan tangan masyarakat desa',
                'sort_order' => 2,
                'children' => [
                    ['name' => 'Anyaman & Rotan',  'description' => 'Produk anyaman bambu, rotan, dan pandan',    'sort_order' => 1],
                    ['name' => 'Gerabah & Keramik', 'description' => 'Kerajinan tanah liat dan keramik',          'sort_order' => 2],
                    ['name' => 'Kayu & Ukiran',    'description' => 'Produk berbahan kayu dan ukiran',             'sort_order' => 3],
                    ['name' => 'Rajutan & Jahitan', 'description' => 'Produk rajutan, sulam, dan jahit tangan',   'sort_order' => 4],
                ],
            ],
            [
                'name' => 'Tekstil & Fashion',
                'description' => 'Pakaian, kain, dan aksesori fashion',
                'sort_order' => 3,
                'children' => [
                    ['name' => 'Batik & Tenun',         'description' => 'Kain batik, tenun, dan songket',               'sort_order' => 1],
                    ['name' => 'Pakaian Jadi',          'description' => 'Baju, celana, gamis, dan sejenisnya',          'sort_order' => 2],
                    ['name' => 'Aksesoris & Perhiasan', 'description' => 'Gelang, kalung, cincin, dan aksesori',         'sort_order' => 3],
                    ['name' => 'Tas & Dompet',          'description' => 'Tas, dompet, dan produk kulit',                'sort_order' => 4],
                ],
            ],
            [
                'name' => 'Pertanian & Peternakan',
                'description' => 'Hasil bumi, tanaman, dan produk peternakan',
                'sort_order' => 4,
                'children' => [
                    ['name' => 'Sayur & Buah Segar', 'description' => 'Sayuran dan buah-buahan segar dari kebun', 'sort_order' => 1],
                    ['name' => 'Beras & Biji-bijian', 'description' => 'Beras, jagung, kedelai, dan biji-bijian', 'sort_order' => 2],
                    ['name' => 'Rempah & Bumbu',      'description' => 'Jahe, kunyit, cabai, dan rempah dapur',   'sort_order' => 3],
                    ['name' => 'Hasil Ternak',         'description' => 'Telur, susu, madu, dan produk hewan',    'sort_order' => 4],
                    ['name' => 'Bibit & Tanaman',      'description' => 'Bibit sayur, buah, dan tanaman hias',    'sort_order' => 5],
                ],
            ],
            [
                'name' => 'Elektronik',
                'description' => 'Peralatan elektronik dan aksesori',
                'sort_order' => 5,
                'children' => [
                    ['name' => 'Aksesori HP',     'description' => 'Casing, charger, kabel, dan pelindung layar',  'sort_order' => 1],
                    ['name' => 'Peralatan Rumah', 'description' => 'Kipas, lampu, dan elektronik rumah tangga',    'sort_order' => 2],
                    ['name' => 'Lampu & Listrik', 'description' => 'Lampu LED, fitting, dan aksesoris listrik',    'sort_order' => 3],
                ],
            ],
            [
                'name' => 'Kesehatan & Kecantikan',
                'description' => 'Produk kesehatan, jamu, dan kecantikan',
                'sort_order' => 6,
                'children' => [
                    ['name' => 'Jamu & Herbal',    'description' => 'Jamu tradisional, empon-empon, dan herbal',   'sort_order' => 1],
                    ['name' => 'Perawatan Tubuh',  'description' => 'Sabun, lotion, dan produk perawatan',         'sort_order' => 2],
                    ['name' => 'Kosmetik Lokal',   'description' => 'Make-up dan kosmetik produksi lokal',          'sort_order' => 3],
                ],
            ],
            [
                'name' => 'Jasa',
                'description' => 'Layanan dan jasa dari UMKM desa',
                'sort_order' => 7,
                'children' => [
                    ['name' => 'Jahit & Bordir',    'description' => 'Jasa jahit, permak, dan bordir',            'sort_order' => 1],
                    ['name' => 'Reparasi',          'description' => 'Servis elektronik, perabot, dan kendaraan',  'sort_order' => 2],
                    ['name' => 'Jasa Titip & Antar', 'description' => 'Pesan antar, titip beli, dan kurir lokal', 'sort_order' => 3],
                    ['name' => 'Jasa Pertanian',    'description' => 'Jasa bajak, semprot, panen, dan lainnya',   'sort_order' => 4],
                ],
            ],
            [
                'name' => 'Lainnya',
                'description' => 'Produk yang belum masuk kategori di atas',
                'sort_order' => 8,
                'children' => [],
            ],
        ];

        $added = 0;
        foreach ($tree as $item) {
            $children = $item['children'];
            unset($item['children']);

            $parentSlug = Str::slug($item['name']);
            $parent = Category::where('slug', $parentSlug)->whereNull('parent_id')->first();

            if (!$parent) {
                $parent = Category::create([
                    'name'        => $item['name'],
                    'slug'        => $parentSlug,
                    'description' => $item['description'] ?? null,
                    'sort_order'  => $item['sort_order'],
                    'is_active'   => true,
                ]);
                $added++;
            }

            foreach ($children as $child) {
                $childSlug = $parentSlug . '-' . Str::slug($child['name']);
                $exists = Category::where('slug', $childSlug)->where('parent_id', $parent->id)->exists();
                if (!$exists) {
                    Category::create([
                        'name'        => $child['name'],
                        'slug'        => $childSlug,
                        'description' => $child['description'] ?? null,
                        'sort_order'  => $child['sort_order'],
                        'is_active'   => true,
                        'parent_id'   => $parent->id,
                    ]);
                    $added++;
                }
            }
        }

        return response()->json([
            'message' => $added > 0
                ? "{$added} kategori berhasil ditambahkan."
                : "Semua kategori standar sudah ada.",
        ]);
    }
}
