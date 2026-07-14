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
        User::firstOrCreate(
            ['email' => 'superadmin@bumdesmart.id'],
            [
                'name'              => 'Super Admin',
                'password'          => 'password123',
                'role'              => 'super_admin',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        // Admin BUMDes
        $adminUser = User::firstOrCreate(
            ['email' => 'bumdes@bumdesmart.id'],
            [
                'name'              => 'Admin BUMDes',
                'password'          => 'password123',
                'role'              => 'admin_bumdes',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        $bumdesProfile = \App\Models\BumdesProfile::firstOrCreate(
            ['user_id' => $adminUser->id],
            [
                'name'        => 'BUMDes Sukamaju',
                'slug'        => 'bumdes-sukamaju',
                'village'     => 'Sukamaju',
                'district'    => 'Cikembar',
                'city'        => 'Sukabumi',
                'province'    => 'Jawa Barat',
                'postal_code' => '43157',
                'phone'       => '081234567891',
                'email'       => 'sukamaju@bumdesmart.id',
                'description' => 'Badan Usaha Milik Desa Sukamaju yang mandiri dan berdaya saing.',
                'status'      => 'active',
            ]
        );

        // UMKM
        $umkmUser = User::firstOrCreate(
            ['email' => 'umkm@bumdesmart.id'],
            [
                'name'              => 'Mang Asep',
                'password'          => 'password123',
                'role'              => 'umkm',
                'phone'             => '081234567890',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        $umkmProfile = UmkmProfile::firstOrCreate(
            ['user_id' => $umkmUser->id],
            [
                'bumdes_profile_id' => $bumdesProfile->id,
                'shop_name'         => 'Keripik Mang Asep',
                'slug'              => 'keripik-mang-asep',
                'owner_name'        => 'Mang Asep',
                'phone'             => '081234567890',
                'description'       => 'Keripik singkong khas desa Sukamaju',
                'city'              => 'Sukabumi',
                'province'          => 'Jawa Barat',
                'status'            => 'active',
            ]
        );

        // Customer
        $customerUser = User::firstOrCreate(
            ['email' => 'customer@bumdesmart.id'],
            [
                'name'              => 'Budi Santoso',
                'password'          => 'password123',
                'role'              => 'customer',
                'phone'             => '082100001111',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        Customer::firstOrCreate(
            ['user_id' => $customerUser->id],
            [
                'name'   => 'Budi Santoso',
                'phone'  => '082100001111',
                'gender' => 'male',
            ]
        );

        // Pengirim
        User::firstOrCreate(
            ['email' => 'pengirim@bumdesmart.id'],
            [
                'name'              => 'Andi Pengirim',
                'password'          => 'password123',
                'role'              => 'pengirim',
                'phone'             => '085900002222',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        // Categories
        $catMakanan   = \App\Models\Category::firstOrCreate(['slug' => 'makanan'],   ['name' => 'Makanan']);
        $catMinuman   = \App\Models\Category::firstOrCreate(['slug' => 'minuman'],   ['name' => 'Minuman']);
        $catKerajinan = \App\Models\Category::firstOrCreate(['slug' => 'kerajinan'], ['name' => 'Kerajinan']);

        // Products for Mang Asep
        $prod1 = \App\Models\Product::firstOrCreate(
            ['slug' => 'keripik-singkong-keju'],
            [
                'umkm_profile_id' => $umkmProfile->id,
                'category_id'     => $catMakanan->id,
                'name'            => 'Keripik Singkong Keju',
                'description'     => 'Keripik singkong gurih rasa keju spesial dari desa.',
                'price'           => 12000.00,
                'stock'           => 100,
                'weight'          => 150,
                'has_variant'     => false,
                'is_digital'      => false,
                'sold_count'      => 5,
                'status'          => 'active',
            ]
        );

        \App\Models\ProductImage::firstOrCreate(
            ['product_id' => $prod1->id, 'is_primary' => true],
            ['file_path' => '/uploads/products/singkong_keju.jpg', 'sort_order' => 0]
        );

        $prod2 = \App\Models\Product::firstOrCreate(
            ['slug' => 'madu-hutan-asli'],
            [
                'umkm_profile_id' => $umkmProfile->id,
                'category_id'     => $catMakanan->id,
                'name'            => 'Madu Hutan Asli',
                'description'     => 'Madu hutan murni 100% alami tanpa bahan campuran.',
                'price'           => 75000.00,
                'stock'           => 20,
                'weight'          => 250,
                'has_variant'     => false,
                'is_digital'      => false,
                'sold_count'      => 2,
                'status'          => 'active',
            ]
        );

        \App\Models\ProductImage::firstOrCreate(
            ['product_id' => $prod2->id, 'is_primary' => true],
            ['file_path' => '/uploads/products/madu_hutan.jpg', 'sort_order' => 0]
        );
    }
}
