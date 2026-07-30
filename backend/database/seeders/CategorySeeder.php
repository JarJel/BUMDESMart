<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $tree = [
            [
                'name' => 'Makanan & Minuman',
                'description' => 'Produk makanan dan minuman olahan maupun segar',
                'sort_order' => 1,
                'children' => [
                    ['name' => 'Makanan Basah',   'description' => 'Lauk, gorengan, dan makanan siap saji',     'sort_order' => 1],
                    ['name' => 'Makanan Kering',  'description' => 'Keripik, kue kering, dan makanan tahan lama', 'sort_order' => 2],
                    ['name' => 'Minuman',          'description' => 'Minuman kemasan, segar, dan tradisional',    'sort_order' => 3],
                    ['name' => 'Jajanan & Camilan','description' => 'Snack, kue basah, dan jajanan pasar',       'sort_order' => 4],
                ],
            ],
            [
                'name' => 'Kerajinan Tangan',
                'description' => 'Produk kerajinan buatan tangan masyarakat desa',
                'sort_order' => 2,
                'children' => [
                    ['name' => 'Anyaman & Rotan', 'description' => 'Produk anyaman bambu, rotan, dan pandan',   'sort_order' => 1],
                    ['name' => 'Gerabah & Keramik','description' => 'Kerajinan tanah liat dan keramik',         'sort_order' => 2],
                    ['name' => 'Kayu & Ukiran',   'description' => 'Produk berbahan kayu dan ukiran',           'sort_order' => 3],
                    ['name' => 'Rajutan & Jahitan','description' => 'Produk rajutan, sulam, dan jahit tangan',  'sort_order' => 4],
                ],
            ],
            [
                'name' => 'Tekstil & Fashion',
                'description' => 'Pakaian, kain, dan aksesori fashion',
                'sort_order' => 3,
                'children' => [
                    ['name' => 'Batik & Tenun',   'description' => 'Kain batik, tenun, dan songket',            'sort_order' => 1],
                    ['name' => 'Pakaian Jadi',    'description' => 'Baju, celana, gamis, dan sejenisnya',       'sort_order' => 2],
                    ['name' => 'Aksesoris & Perhiasan', 'description' => 'Gelang, kalung, cincin, dan aksesori','sort_order' => 3],
                    ['name' => 'Tas & Dompet',    'description' => 'Tas, dompet, dan produk kulit',             'sort_order' => 4],
                ],
            ],
            [
                'name' => 'Pertanian & Peternakan',
                'description' => 'Hasil bumi, tanaman, dan produk peternakan',
                'sort_order' => 4,
                'children' => [
                    ['name' => 'Sayur & Buah Segar','description' => 'Sayuran dan buah-buahan segar dari kebun','sort_order' => 1],
                    ['name' => 'Beras & Biji-bijian','description' => 'Beras, jagung, kedelai, dan biji-bijian','sort_order' => 2],
                    ['name' => 'Rempah & Bumbu',  'description' => 'Jahe, kunyit, cabai, dan rempah dapur',    'sort_order' => 3],
                    ['name' => 'Hasil Ternak',    'description' => 'Telur, susu, madu, dan produk hewan',       'sort_order' => 4],
                    ['name' => 'Bibit & Tanaman', 'description' => 'Bibit sayur, buah, dan tanaman hias',       'sort_order' => 5],
                ],
            ],
            [
                'name' => 'Elektronik',
                'description' => 'Peralatan elektronik dan aksesori',
                'sort_order' => 5,
                'children' => [
                    ['name' => 'Aksesori HP',      'description' => 'Casing, charger, kabel, dan pelindung layar','sort_order' => 1],
                    ['name' => 'Peralatan Rumah',  'description' => 'Kipas, lampu, dan elektronik rumah tangga', 'sort_order' => 2],
                    ['name' => 'Lampu & Listrik',  'description' => 'Lampu LED, fitting, dan aksesoris listrik', 'sort_order' => 3],
                ],
            ],
            [
                'name' => 'Kesehatan & Kecantikan',
                'description' => 'Produk kesehatan, jamu, dan kecantikan',
                'sort_order' => 6,
                'children' => [
                    ['name' => 'Jamu & Herbal',    'description' => 'Jamu tradisional, empon-empon, dan herbal', 'sort_order' => 1],
                    ['name' => 'Perawatan Tubuh',  'description' => 'Sabun, lotion, dan produk perawatan',       'sort_order' => 2],
                    ['name' => 'Kosmetik Lokal',   'description' => 'Make-up dan kosmetik produksi lokal',        'sort_order' => 3],
                ],
            ],
            [
                'name' => 'Jasa',
                'description' => 'Layanan dan jasa dari UMKM desa',
                'sort_order' => 7,
                'children' => [
                    ['name' => 'Jahit & Bordir',   'description' => 'Jasa jahit, permak, dan bordir',           'sort_order' => 1],
                    ['name' => 'Reparasi',         'description' => 'Servis elektronik, perabot, dan kendaraan', 'sort_order' => 2],
                    ['name' => 'Jasa Titip & Antar','description' => 'Pesan antar, titip beli, dan kurir lokal', 'sort_order' => 3],
                    ['name' => 'Jasa Pertanian',   'description' => 'Jasa bajak, semprot, panen, dan lainnya',  'sort_order' => 4],
                ],
            ],
            [
                'name' => 'Lainnya',
                'description' => 'Produk yang belum masuk kategori di atas',
                'sort_order' => 8,
                'children' => [],
            ],
        ];

        foreach ($tree as $parent) {
            $children = $parent['children'];
            unset($parent['children']);

            $parentSlug = Str::slug($parent['name']);
            $existingParent = DB::table('categories')->where('slug', $parentSlug)->first();

            if ($existingParent) {
                $parentId = $existingParent->id;
            } else {
                $parentId = DB::table('categories')->insertGetId([
                    'name'        => $parent['name'],
                    'slug'        => $parentSlug,
                    'description' => $parent['description'],
                    'sort_order'  => $parent['sort_order'],
                    'is_active'   => true,
                    'parent_id'   => null,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }

            foreach ($children as $child) {
                $childSlug = $parentSlug . '-' . Str::slug($child['name']);
                $exists = DB::table('categories')->where('slug', $childSlug)->exists();
                if (!$exists) {
                    DB::table('categories')->insert([
                        'name'        => $child['name'],
                        'slug'        => $childSlug,
                        'description' => $child['description'],
                        'sort_order'  => $child['sort_order'],
                        'is_active'   => true,
                        'parent_id'   => $parentId,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                }
            }
        }
    }
}
