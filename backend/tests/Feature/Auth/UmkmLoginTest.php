<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Models\UmkmProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UmkmLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_umkm_can_login_with_valid_credentials(): void
    {
        // 1. Create UMKM user and profile
        $user = User::create([
            'name'              => 'Mang Asep',
            'email'             => 'umkm@bumdesmart.id',
            'password'          => 'password123',
            'role'              => 'umkm',
            'phone'             => '081234567890',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        UmkmProfile::create([
            'user_id'     => $user->id,
            'shop_name'   => 'Keripik Mang Asep',
            'slug'        => 'keripik-mang-asep',
            'owner_name'  => 'Mang Asep',
            'phone'       => '081234567890',
            'description' => 'Keripik singkong khas desa Sukamaju',
            'city'        => 'Sukabumi',
            'province'    => 'Jawa Barat',
            'status'      => 'active',
        ]);

        // 2. Send login request to API
        $response = $this->postJson('/api/v1/login', [
            'email'    => 'umkm@bumdesmart.id',
            'password' => 'password123',
        ]);

        // 3. Assertions
        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'role',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'role',
                    'status',
                    'umkm_profile'
                ],
                'token'
            ]);

        $this->assertEquals('umkm', $response->json('role'));
        $this->assertEquals('umkm@bumdesmart.id', $response->json('user.email'));
    }

    public function test_umkm_cannot_login_with_invalid_password(): void
    {
        // Create UMKM user
        User::create([
            'name'              => 'Mang Asep',
            'email'             => 'umkm@bumdesmart.id',
            'password'          => 'password123',
            'role'              => 'umkm',
            'phone'             => '081234567890',
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);

        // Send invalid login request
        $response = $this->postJson('/api/v1/login', [
            'email'    => 'umkm@bumdesmart.id',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'error' => 'Email atau password salah.'
            ]);
    }

    public function test_inactive_umkm_cannot_login(): void
    {
        // Create inactive UMKM user
        User::create([
            'name'              => 'Mang Asep',
            'email'             => 'umkm@bumdesmart.id',
            'password'          => 'password123',
            'role'              => 'umkm',
            'phone'             => '081234567890',
            'status'            => 'inactive',
            'email_verified_at' => now(),
        ]);

        // Send login request
        $response = $this->postJson('/api/v1/login', [
            'email'    => 'umkm@bumdesmart.id',
            'password' => 'password123',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'error' => 'Akun Anda dinonaktifkan.'
            ]);
    }
}
