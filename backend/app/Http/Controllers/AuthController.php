<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\SendOtpMail;
use Illuminate\Support\Facades\Http;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * API Register Customer.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!$this->isGoogleEmail($request->email)) {
            return response()->json([
                'errors' => [
                    'email' => ['Email harus berupa akun Google (Gmail atau Google Workspace).']
                ]
            ], 422);
        }

        try {
            $user = $this->authService->registerCustomer($request->all());
            return response()->json([
                'message' => 'Customer registered successfully',
                'user' => $user
            ], 201);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * API Register UMKM/Seller.
     */
    public function registerUmkm(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'name_umkm' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!$this->isGoogleEmail($request->email)) {
            return response()->json([
                'errors' => [
                    'email' => ['Email harus berupa akun Google (Gmail atau Google Workspace).']
                ]
            ], 422);
        }

        try {
            $user = $this->authService->registerUmkm($request->all());
            return response()->json([
                'message' => 'UMKM registered successfully. Verification is pending BUMDes approval.',
                'user' => $user
            ], 201);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * API Login Multi-Role (BUMDes/Admin, Seller/UMKM, Customer).
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $credentials = $request->only('email', 'password');
            $result = $this->authService->login($credentials);

            return response()->json([
                'message' => 'Login successful',
                'role' => $result['user']->role,
                'user' => $result['user'],
                'token' => $result['token']
            ], 200);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 401);
        }
    }

    /**
     * API Logout.
     */
    public function logout(Request $request)
    {
        // Hapus token aktif saat ini yang digunakan untuk request
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful'
        ], 200);
    }

    /**
     * API Get Authenticated User Profile.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'customer') {
            $user->load('customer');
        } elseif ($user->role === 'umkm') {
            $user->load('umkmProfile');
        }

        return response()->json($user);
    }

    /**
     * API Send Reset Password Link (Sekarang mengirim OTP).
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // 1. Generate 6-digit OTP
        $otp = (string) rand(100000, 999999);

        // 2. Simpan OTP ke tabel password_reset_tokens
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => $otp,
                'created_at' => now(),
            ]
        );

        // 3. Kirim OTP ke Email
        try {
            Mail::to($request->email)->send(new SendOtpMail($otp));
            return response()->json([
                'message' => 'Kode OTP berhasil dikirim ke email Anda.'
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Gagal mengirim email OTP: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * API Reset Password menggunakan OTP.
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'otp' => 'required|string|size:6',
            'email' => 'required|string|email|exists:users,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // 1. Ambil OTP dari tabel password_reset_tokens
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        // 2. Validasi kecocokan OTP dan masa berlaku (15 menit)
        if (!$resetRecord || $resetRecord->token !== $request->otp) {
            return response()->json([
                'errors' => [
                    'otp' => ['Kode OTP salah atau tidak valid.']
                ]
            ], 422);
        }

        // Cek kedaluwarsa (15 menit)
        $createdAt = \Carbon\Carbon::parse($resetRecord->created_at);
        if ($createdAt->addMinutes(15)->isPast()) {
            // Hapus OTP yang kedaluwarsa
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json([
                'errors' => [
                    'otp' => ['Kode OTP telah kedaluwarsa. Silakan minta kode baru.']
                ]
            ], 422);
        }

        // 3. Update Password User
        try {
            $user = \App\Models\User::where('email', $request->email)->first();
            $user->password = Hash::make($request->password);
            $user->save();

            // Hapus token setelah berhasil digunakan
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            // Trigger event password reset
            event(new PasswordReset($user));

            return response()->json([
                'message' => 'Kata sandi berhasil disetel ulang.'
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Gagal mengubah kata sandi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Memeriksa apakah email terdaftar di Google (Gmail atau Google Workspace).
     */
    protected function isGoogleEmail(string $email): bool
    {
        $email = strtolower($email);

        // 1. Cek jika menggunakan domain gmail.com atau googlemail.com
        if (str_ends_with($email, '@gmail.com') || str_ends_with($email, '@googlemail.com')) {
            return true;
        }

        // 2. Cek MX records untuk domain kustom (Google Workspace)
        $domain = substr(strrchr($email, "@"), 1);
        if ($domain && getmxrr($domain, $mxhosts)) {
            foreach ($mxhosts as $host) {
                if (str_contains(strtolower($host), 'google.com') || str_contains(strtolower($host), 'googlemail.com')) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * API Login / Register via Google ID Token.
     */
    public function loginWithGoogle(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $idToken = $request->id_token;

            // 1. Verifikasi token ke Google API
            $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $idToken
            ]);

            if (!$response->successful()) {
                return response()->json(['error' => 'Token Google tidak valid.'], 401);
            }

            $payload = $response->json();

            // Verifikasi aud (Client ID) jika dikonfigurasi di env
            $clientId = env('GOOGLE_CLIENT_ID');
            if ($clientId && $payload['aud'] !== $clientId) {
                return response()->json(['error' => 'Audience token tidak cocok.'], 401);
            }

            $email = $payload['email'];
            $name = $payload['name'];
            $avatar = $payload['picture'] ?? null;

            // 2. Cari atau buat user baru
            $user = \App\Models\User::where('email', $email)->first();

            if (!$user) {
                // Buat user baru (Customer)
                $user = \App\Models\User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make(Str::random(24)), // Password acak
                    'role' => 'customer',
                    'phone' => '',
                    'avatar' => $avatar,
                    'status' => 'active',
                ]);

                // Buat profil Customer
                \App\Models\Customer::create([
                    'user_id' => $user->id,
                    'name' => $name,
                ]);
            } else {
                // Update avatar jika ada perubahan
                if ($avatar && $user->avatar !== $avatar) {
                    $user->avatar = $avatar;
                    $user->save();
                }

                // Cek status keaktifan user
                if ($user->status !== 'active') {
                    return response()->json(['error' => 'Akun Anda dinonaktifkan.'], 403);
                }
            }

            // Load relasi profile
            if ($user->role === 'customer') {
                $user->load('customer');
            } elseif ($user->role === 'umkm') {
                $user->load('umkmProfile');
            }

            // 3. Buat token Sanctum
            $token = $user->createToken('AuthToken', [$user->role])->plainTextToken;

            return response()->json([
                'message' => 'Login via Google sukses.',
                'role' => $user->role,
                'user' => $user,
                'token' => $token
            ], 200);

        } catch (Exception $e) {
            return response()->json(['error' => 'Terjadi kesalahan login Google: ' . $e->getMessage()], 500);
        }
    }
}
