<?php

namespace App\Services;

use App\Models\User;
use App\Models\Customer;
use App\Models\UmkmProfile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Exception;

class AuthService
{
    /**
     * Registrasi pembeli/customer baru.
     */
    public function registerCustomer(array $data)
    {
        // 1. Buat User utama di tabel 'users' dengan role 'customer'
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'customer',
            'phone' => $data['phone'] ?? '',
            'status' => 'active', // Langsung aktif
        ]);

        // 2. Buat profil Customer di tabel 'customers'
        Customer::create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
        ]);

        return $user->load('customer');
    }

    /**
     * Registrasi Mitra/UMKM baru.
     */
    public function registerUmkm(array $data)
    {
        // 1. Buat User utama di tabel 'users' dengan role 'umkm'
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'umkm',
            'phone' => $data['phone'] ?? '',
            'status' => 'active', // Aktif agar bisa login ke dashboard untuk verifikasi
        ]);

        // 2. Buat profil UMKM di tabel 'umkm_profiles'
        UmkmProfile::create([
            'user_id'           => $user->id,
            'bumdes_profile_id' => $data['bumdes_profile_id'],
            'shop_name'         => $data['shop_name'],
            'slug'              => \Illuminate\Support\Str::slug($data['shop_name'] . '-' . uniqid()),
            'owner_name'        => $data['name'],
            'phone'             => $data['phone'] ?? null,
            'description'       => $data['description'] ?? null,
            'business_category' => $data['business_category'] ?? null,
            'status'            => 'pending',
        ]);

        return $user->load('umkmProfile');
    }

    /**
     * Registrasi Pengirim/Driver baru.
     */
    public function registerDriver(array $data)
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],
            'role'     => 'pengirim',
            'phone'    => $data['phone'] ?? '',
            'status'   => 'active',
        ]);

        \App\Models\DriverProfile::create([
            'user_id'       => $user->id,
            'vehicle_type'  => $data['vehicle_type'],
            'vehicle_brand' => $data['vehicle_brand'] ?? null,
            'vehicle_plate' => $data['vehicle_plate'],
            'vehicle_year'  => $data['vehicle_year'] ?? null,
            'sim_type'      => $data['sim_type'] ?? null,
            'is_available'  => true,
            'is_verified'   => false,
        ]);

        return $user->fresh();
    }

    /**
     * Logika Login Multi-Role.
     */
    public function login(array $credentials)
    {
        // Jalankan autentikasi default (menggunakan model User)
        if (!Auth::attempt($credentials)) {
            throw new Exception('Email atau password salah.');
        }

        $user = Auth::user();

        // Cek status keaktifan user
        if ($user->status !== 'active') {
            Auth::logout();
            throw new Exception('Akun Anda dinonaktifkan.');
        }

        // Memuat profil sesuai dengan role masing-masing
        if ($user->role === 'customer') {
            $user->load('customer');
        } elseif ($user->role === 'umkm') {
            $user->load('umkmProfile');
        }

        // Buat token Sanctum dengan ability role-nya
        $token = $user->createToken('AuthToken', [$user->role])->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
        ];
    }
}
