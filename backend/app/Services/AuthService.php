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
            'password' => Hash::make($data['password']),
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
            'password' => Hash::make($data['password']),
            'role' => 'umkm',
            'phone' => $data['phone'] ?? '',
            'status' => 'active', // Aktif agar bisa login ke dashboard untuk verifikasi
        ]);

        // 2. Buat profil UMKM di tabel 'umkm_profile'
        UmkmProfile::create([
            'user_id' => $user->id,
            'name_umkm' => $data['name_umkm'],
            'phone' => $data['phone'] ?? null,
            'status' => 'pending', // Menunggu persetujuan BUMDes
        ]);

        return $user->load('umkmProfile');
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
