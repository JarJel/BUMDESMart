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

        UmkmProfile::create([
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
    }
}
