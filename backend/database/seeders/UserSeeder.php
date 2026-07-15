<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\UmkmProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Super Admin
        User::create([
            'name'              => 'Super Admin',
            'email'             => 'superadmin@bumdesmart.id',
            'password'          => 'password123',
            'role'              => 'super_admin',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        // Admin BUMDes
        User::create([
            'name'              => 'Admin BUMDes',
            'email'             => 'bumdes@bumdesmart.id',
            'password'          => 'password123',
            'role'              => 'admin_bumdes',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        // UMKM
        $umkmUser = User::create([
            'name'              => 'Mang Asep',
            'email'             => 'umkm@bumdesmart.id',
            'password'          => 'password123',
            'role'              => 'umkm',
            'phone'             => '081234567890',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        $umkmProfile1 = UmkmProfile::create([
            'user_id'    => $umkmUser->id,
            'shop_name'  => 'Keripik Mang Asep',
            'slug'       => 'keripik-mang-asep',
            'owner_name' => 'Mang Asep',
            'phone'      => '081234567890',
            'description'=> 'Keripik singkong khas desa Sukamaju',
            'city'       => 'Sukabumi',
            'province'   => 'Jawa Barat',
            'status'     => 'active',
        ]);

        // UMKM 2 (Bu Eti)
        $umkmUser2 = User::create([
            'name'              => 'Bu Eti',
            'email'             => 'bueti@bumdesmart.id',
            'password'          => 'password123',
            'role'              => 'umkm',
            'phone'             => '081234567891',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        $umkmProfile2 = UmkmProfile::create([
            'user_id'    => $umkmUser2->id,
            'shop_name'  => 'Bakso Bu Eti',
            'slug'       => 'bakso-bu-eti',
            'owner_name' => 'Bu Eti',
            'phone'      => '081234567891',
            'description'=> 'Bakso urat sapi asli khas desa Sukamaju',
            'city'       => 'Sukabumi',
            'province'   => 'Jawa Barat',
            'status'     => 'active',
        ]);

        // Customer
        $customerUser = User::create([
            'name'              => 'Budi Santoso',
            'email'             => 'customer@bumdesmart.id',
            'password'          => 'password123',
            'role'              => 'customer',
            'phone'             => '082100001111',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        Customer::create([
            'user_id' => $customerUser->id,
            'name'    => 'Budi Santoso',
            'phone'   => '082100001111',
            'gender'  => 'male',
        ]);

        // Pengirim
        User::create([
            'name'              => 'Andi Pengirim',
            'email'             => 'pengirim@bumdesmart.id',
            'password'          => 'password123',
            'role'              => 'pengirim',
            'phone'             => '085900002222',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        // Categories
        $catMakanan = \App\Models\Category::create([
            'name' => 'Makanan',
            'slug' => 'makanan',
        ]);
        $catMinuman = \App\Models\Category::create([
            'name' => 'Minuman',
            'slug' => 'minuman',
        ]);
        $catKerajinan = \App\Models\Category::create([
            'name' => 'Kerajinan',
            'slug' => 'kerajinan',
        ]);

        // Products for Mang Asep (umkm_profile_id = $umkmProfile1->id)
        $prod1 = \App\Models\Product::create([
            'umkm_profile_id' => $umkmProfile1->id,
            'category_id'     => $catMakanan->id,
            'name'            => 'Keripik Singkong Keju',
            'slug'            => 'keripik-singkong-keju',
            'description'     => 'Keripik singkong gurih rasa keju spesial dari desa.',
            'price'           => 12000.00,
            'stock'           => 100,
            'weight'          => 150,
            'has_variant'     => false,
            'is_digital'      => false,
            'sold_count'      => 5,
            'status'          => 'active',
        ]);

        \App\Models\ProductImage::create([
            'product_id' => $prod1->id,
            'file_path'  => '/uploads/products/singkong_keju.jpg',
            'is_primary' => true,
            'sort_order' => 0,
        ]);

        $prod2 = \App\Models\Product::create([
            'umkm_profile_id' => $umkmProfile1->id,
            'category_id'     => $catMakanan->id,
            'name'            => 'Madu Hutan Asli',
            'slug'            => 'madu-hutan-asli',
            'description'     => 'Madu hutan murni 100% alami tanpa bahan campuran.',
            'price'           => 75000.00,
            'stock'           => 20,
            'weight'          => 250,
            'has_variant'     => false,
            'is_digital'      => false,
            'sold_count'      => 2,
            'status'          => 'active',
        ]);

        \App\Models\ProductImage::create([
            'product_id' => $prod2->id,
            'file_path'  => '/uploads/products/madu_hutan.jpg',
            'is_primary' => true,
            'sort_order' => 0,
        ]);

        // Products for Bu Eti (umkm_profile_id = $umkmProfile2->id)
        $prod3 = \App\Models\Product::create([
            'umkm_profile_id' => $umkmProfile2->id,
            'category_id'     => $catMakanan->id,
            'name'            => 'Bakso Urat Frozen',
            'slug'            => 'bakso-urat-frozen',
            'description'     => 'Bakso urat sapi frozen lezat isi 10 pcs siap saji.',
            'price'           => 25000.00,
            'stock'           => 50,
            'weight'          => 300,
            'has_variant'     => false,
            'is_digital'      => false,
            'sold_count'      => 8,
            'status'          => 'active',
        ]);

        \App\Models\ProductImage::create([
            'product_id' => $prod3->id,
            'file_path'  => '/uploads/products/bakso_urat.jpg',
            'is_primary' => true,
            'sort_order' => 0,
        ]);

        $prod4 = \App\Models\Product::create([
            'umkm_profile_id' => $umkmProfile2->id,
            'category_id'     => $catMinuman->id,
            'name'            => 'Es Cendol Durian',
            'slug'            => 'es-cendol-durian',
            'description'     => 'Es cendol durian segar manis gurih nikmat.',
            'price'           => 15000.00,
            'stock'           => 30,
            'weight'          => 200,
            'has_variant'     => false,
            'is_digital'      => false,
            'sold_count'      => 12,
            'status'          => 'active',
        ]);

        \App\Models\ProductImage::create([
            'product_id' => $prod4->id,
            'file_path'  => '/uploads/products/es_cendol.jpg',
            'is_primary' => true,
            'sort_order' => 0,
        ]);
    }
}
