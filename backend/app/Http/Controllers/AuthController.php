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
use OpenApi\Attributes as OA;

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
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
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
            'shop_name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'bumdes_profile_id' => 'required|exists:bumdes_profiles,id',
            'business_category' => 'nullable|string|in:makanan_minuman,fashion_kerajinan,pertanian_peternakan,perdagangan_umum,jasa',
            'agreed_to_terms'   => 'required|accepted',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
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
     * API Register Pengirim/Driver.
     */
    public function registerDriver(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'              => 'required|string|max:255',
            'email'             => 'required|string|email|unique:users,email',
            'password'          => 'required|string|min:8|confirmed',
            'phone'             => 'required|string|max:20',
            'bumdes_profile_id' => 'required|exists:bumdes_profiles,id',
            'vehicle_type'        => 'required|in:motor,mobil,pickup_box,pickup_bak',
            'vehicle_brand'       => 'required|string|max:100',
            'vehicle_plate'       => 'required|string|max:20',
            'vehicle_year'        => 'nullable|integer|min:1990|max:2030',
            'sim_type'            => 'required|in:A,B,C,A1,B1',
            'id_number'           => 'nullable|string|digits:16',
            'bank_name'           => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_name'   => 'nullable|string|max:100',
            'photo_profile'       => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'photo_ktp'           => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ], [
            'email.unique'             => 'Email sudah terdaftar, gunakan email lain.',
            'email.required'           => 'Email wajib diisi.',
            'email.email'              => 'Format email tidak valid.',
            'password.min'             => 'Password minimal 8 karakter.',
            'password.confirmed'       => 'Konfirmasi password tidak cocok.',
            'name.required'            => 'Nama lengkap wajib diisi.',
            'phone.required'           => 'Nomor HP wajib diisi.',
            'bumdes_profile_id.required' => 'BUMDes wajib dipilih.',
            'bumdes_profile_id.exists'   => 'BUMDes yang dipilih tidak valid.',
            'vehicle_type.required'    => 'Jenis kendaraan wajib dipilih.',
            'vehicle_type.in'          => 'Jenis kendaraan tidak valid.',
            'vehicle_brand.required'   => 'Merek kendaraan wajib diisi.',
            'vehicle_plate.required'   => 'Nomor plat wajib diisi.',
            'vehicle_year.integer'     => 'Tahun kendaraan harus berupa angka.',
            'vehicle_year.min'         => 'Tahun kendaraan minimal 1990.',
            'vehicle_year.max'         => 'Tahun kendaraan tidak valid.',
            'sim_type.required'        => 'Jenis SIM wajib dipilih.',
            'sim_type.in'              => 'Jenis SIM tidak valid.',
            'id_number.digits'         => 'Nomor KTP harus tepat 16 digit angka.',
            'photo_profile.image'      => 'File foto profil harus berupa gambar.',
            'photo_profile.max'        => 'Ukuran foto profil maksimal 5MB.',
            'photo_ktp.image'          => 'File foto KTP harus berupa gambar.',
            'photo_ktp.max'            => 'Ukuran foto KTP maksimal 5MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $data = $request->except(['photo_profile', 'photo_ktp']);
            if ($request->hasFile('photo_profile')) {
                $data['photo_profile'] = \App\Helpers\ImageHelper::uploadAsWebp($request->file('photo_profile'), 'driver/photos');
            }
            if ($request->hasFile('photo_ktp')) {
                $data['photo_ktp'] = \App\Helpers\ImageHelper::uploadAsWebp($request->file('photo_ktp'), 'driver/ktp');
            }
            $user = $this->authService->registerDriver($data);
            return response()->json([
                'message' => 'Pendaftaran pengirim berhasil.',
                'user'    => $user,
            ], 201);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    #[OA\Post(
        path: "/login",
        summary: "User Login",
        description: "Authenticate user by email and password, returns access token and user info",
        tags: ["Authentication"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["email", "password"],
            properties: [
                new OA\Property(property: "email", type: "string", format: "email", example: "umkm@bumdesmart.id"),
                new OA\Property(property: "password", type: "string", format: "password", example: "password123")
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: "Login successful",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "message", type: "string", example: "Login successful"),
                new OA\Property(property: "role", type: "string", example: "umkm"),
                new OA\Property(property: "token", type: "string", example: "1|mWzzUuGwI2JrS3ml..."),
                new OA\Property(property: "user", type: "object")
            ]
        )
    )]
    #[OA\Response(
        response: 401,
        description: "Invalid credentials or disabled account",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "error", type: "string", example: "Email atau password salah.")
            ]
        )
    )]
    #[OA\Response(
        response: 422,
        description: "Validation error"
    )]
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
        $otp = (string) random_int(100000, 999999);

        // 2. Simpan OTP ke tabel password_reset_tokens (tersimpan sebagai hash)
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => Hash::make($otp),
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
     * API Verifikasi OTP (step 2 — tanpa reset password).
     * OTP tidak dihapus di sini, tetap tersimpan untuk dipakai di step reset.
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|exists:users,email',
            'otp'   => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        // Cek OTP ada & cocok
        if (!$resetRecord || !Hash::check($request->otp, $resetRecord->token)) {
            return response()->json([
                'errors' => ['otp' => ['Kode OTP salah atau tidak valid.']]
            ], 422);
        }

        // Cek kedaluwarsa (15 menit) dengan toleransi timezone mismatch
        $isExpired = true;
        
        // 1. Cek dengan parse UTC
        $createdAtUtc = \Carbon\Carbon::parse($resetRecord->created_at, 'UTC');
        if (abs(now('UTC')->diffInSeconds($createdAtUtc)) <= 900) {
            $isExpired = false;
        }
        
        // 2. Cek dengan parse Timezone Aplikasi Default
        if ($isExpired) {
            $createdAtApp = \Carbon\Carbon::parse($resetRecord->created_at, config('app.timezone'));
            if (abs(now()->diffInSeconds($createdAtApp)) <= 900) {
                $isExpired = false;
            }
        }

        if ($isExpired) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'errors' => ['otp' => ['Kode OTP telah kedaluwarsa. Silakan minta kode baru.']]
            ], 422);
        }

        return response()->json(['message' => 'OTP valid.'], 200);
    }

    /**
     * API Reset Password menggunakan OTP.
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'otp' => 'required|string|size:6',
            'email' => 'required|string|email|exists:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // 1. Ambil OTP dari tabel password_reset_tokens
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        // 2. Validasi kecocokan OTP dan masa berlaku (15 menit)
        if (!$resetRecord || !Hash::check($request->otp, $resetRecord->token)) {
            return response()->json([
                'errors' => [
                    'otp' => ['Kode OTP salah atau tidak valid.']
                ]
            ], 422);
        }

        // Cek kedaluwarsa (15 menit) dengan toleransi timezone mismatch
        $isExpired = true;
        
        // 1. Cek dengan parse UTC
        $createdAtUtc = \Carbon\Carbon::parse($resetRecord->created_at, 'UTC');
        if (abs(now('UTC')->diffInSeconds($createdAtUtc)) <= 900) {
            $isExpired = false;
        }
        
        // 2. Cek dengan parse Timezone Aplikasi Default
        if ($isExpired) {
            $createdAtApp = \Carbon\Carbon::parse($resetRecord->created_at, config('app.timezone'));
            if (abs(now()->diffInSeconds($createdAtApp)) <= 900) {
                $isExpired = false;
            }
        }

        if ($isExpired) {
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
            $response = Http::when(app()->environment('local'), fn($q) => $q->withoutVerifying())
                ->get('https://oauth2.googleapis.com/tokeninfo', [
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
                $user = \App\Models\User::forceCreate([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make(Str::random(24)),
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
