<?php

namespace App\Services;

use App\Models\User;
use App\Models\Customer;
use App\Models\UmkmProfile;
use App\Jobs\SendWhatsappJob;
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
        $user = User::forceCreate([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'customer',
            'phone' => $data['phone'] ?? '',
            'status' => 'active',
        ]);

        // 2. Buat profil Customer di tabel 'customers'
        Customer::create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
        ]);

        // 3. Kirim notifikasi WhatsApp otomatis
        if ($user->phone) {
            $message = "Halo {$user->name},\n\nTerima kasih telah mendaftar di BumDesMartNukita!\nAkun Anda berhasil dibuat dengan email {$user->email}. Silakan masuk ke aplikasi untuk mulai berbelanja produk-produk UMKM terbaik.\n\nSelamat berbelanja!\nTim BumDesMartNukita";
            SendWhatsappJob::dispatch($user->phone, $message);
        }

        return $user->load('customer');
    }

    /**
     * Registrasi Mitra/UMKM baru.
     */
    public function registerUmkm(array $data)
    {
        // 1. Buat User utama di tabel 'users' dengan role 'umkm'
        $user = User::forceCreate([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'umkm',
            'phone' => $data['phone'] ?? '',
            'status' => 'active',
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
            'agreed_to_terms'   => true,
            'agreed_at'         => now(),
            'status'            => 'pending',
        ]);

        // 3. Kirim notifikasi WhatsApp otomatis
        if ($user->phone) {
            $message = "Halo {$user->name},\n\nTerima kasih telah mendaftar sebagai Mitra/UMKM di BumDesMartNukita!\nPendaftaran untuk toko \"{$data['shop_name']}\" telah kami terima dan saat ini sedang menunggu proses verifikasi oleh pihak BUMDes.\n\nKami akan segera memberikan informasi lebih lanjut jika akun toko Anda telah disetujui.\n\nSalam hangat,\nTim BumDesMartNukita";
            SendWhatsappJob::dispatch($user->phone, $message);
        }

        return $user->load('umkmProfile');
    }

    /**
     * Registrasi Pengirim/Driver baru.
     */
    public function registerDriver(array $data)
    {
        $user = User::forceCreate([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],
            'role'     => 'pengirim',
            'phone'    => $data['phone'] ?? '',
            'status'   => 'active',
        ]);

        \App\Models\DriverProfile::create([
            'user_id'             => $user->id,
            'bumdes_profile_id'   => $data['bumdes_profile_id'] ?? null,
            'vehicle_type'        => $data['vehicle_type'],
            'vehicle_brand'       => $data['vehicle_brand'] ?? null,
            'vehicle_plate'       => $data['vehicle_plate'],
            'vehicle_year'        => $data['vehicle_year'] ?? null,
            'sim_type'            => $data['sim_type'] ?? null,
            'id_number'           => $data['id_number'] ?? null,
            'photo_profile'       => $data['photo_profile'] ?? null,
            'photo_ktp'           => $data['photo_ktp'] ?? null,
            'bank_name'           => $data['bank_name'] ?? null,
            'bank_account_number' => $data['bank_account_number'] ?? null,
            'bank_account_name'   => $data['bank_account_name'] ?? null,
            'is_available'        => false,
            'is_verified'         => false,
        ]);

        // Kirim notifikasi WhatsApp otomatis
        if ($user->phone) {
            $vehicleBrand = $data['vehicle_brand'] ?? '-';
            $vehiclePlate = $data['vehicle_plate'] ?? '-';
            $message = "Halo {$user->name},\n\nTerima kasih telah mendaftar sebagai Kurir di BumDesMartNukita!\nPendaftaran Anda dengan kendaraan {$vehicleBrand} ({$vehiclePlate}) telah berhasil. Saat ini akun Anda sedang dalam proses peninjauan dan verifikasi oleh Admin.\n\nKami akan mengirimkan notifikasi setelah akun Anda aktif dan siap menerima pesanan.\n\nSalam hangat,\nTim BumDesMartNukita";
            SendWhatsappJob::dispatch($user->phone, $message);
        }

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
        if ($user->status === 'suspended') {
            Auth::logout();
            throw new Exception('Akun Anda sedang ditangguhkan. Silakan ajukan permohonan pengaktifan kembali.');
        }
        
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
