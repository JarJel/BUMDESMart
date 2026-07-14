<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Exception;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'customer') {
            $user->load('customer');
        } elseif ($user->role === 'umkm') {
            $user->load('umkmProfile');
        }

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name'              => 'sometimes|required|string|max:255',
            'phone'             => 'sometimes|nullable|string|max:20',
            'date_of_birth'     => 'sometimes|nullable|date',
            'gender'            => 'sometimes|nullable|in:male,female,other',
            // UMKM fields
            'shop_name'         => 'sometimes|required|string|max:255',
            'owner_name'        => 'sometimes|nullable|string|max:255',
            'description'       => 'sometimes|nullable|string',
            'address'           => 'sometimes|nullable|string|max:500',
            'city'              => 'sometimes|nullable|string|max:100',
            'province'          => 'sometimes|nullable|string|max:100',
            'postal_code'       => 'sometimes|nullable|string|max:10',
            'email'             => 'sometimes|nullable|email|max:255',
            'nib'               => 'sometimes|nullable|string|max:30',
            'npwp'              => 'sometimes|nullable|string|max:20',
            'business_category' => 'sometimes|nullable|string|max:100',
            'latitude'          => 'sometimes|nullable|numeric|between:-90,90',
            'longitude'         => 'sometimes|nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            if ($request->has('name')) {
                $user->name = $request->name;
                $user->save();
            }

            if ($user->role === 'customer' && $user->customer) {
                $customerData = collect($request->only([
                    'phone', 'date_of_birth', 'gender'
                ]))->filter()->toArray();
                $user->customer->update($customerData);
            }

            if ($user->role === 'umkm') {
                $user->load('umkmProfile');
                if ($user->umkmProfile) {
                    $isActive = $user->umkmProfile->status === 'active';

                    if ($isActive && $request->has('shop_name')) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Nama toko tidak dapat diubah setelah terverifikasi. Hubungi admin BUMDes untuk mengubah nama toko.',
                        ], 422);
                    }

                    if ($isActive && $request->has('business_category') && $request->business_category !== $user->umkmProfile->business_category) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Kategori usaha tidak dapat diubah setelah terverifikasi karena mempengaruhi dokumen izin yang dibutuhkan. Hubungi admin BUMDes.',
                        ], 422);
                    }

                    $umkmData = array_filter(
                        $request->only([
                            'shop_name', 'owner_name', 'description', 'phone', 'email',
                            'address', 'city', 'province', 'postal_code',
                            'nib', 'npwp', 'business_category', 'latitude', 'longitude',
                        ]),
                        fn($v) => !is_null($v)
                    );
                    $user->umkmProfile->update($umkmData);
                }
            }

            if ($user->role === 'umkm') {
                $user->load('umkmProfile');
            } else {
                $user->load('customer');
            }

            return response()->json([
                'success' => true,
                'message' => 'Profil berhasil diperbarui.',
                'data' => $user
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Gagal memperbarui profil: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateAvatar(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            if ($request->hasFile('avatar')) {
                if ($user->avatar && !str_starts_with($user->avatar, 'http') && file_exists(public_path($user->avatar))) {
                    @unlink(public_path($user->avatar));
                }

                $file = $request->file('avatar');
                $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $destinationPath = public_path('uploads/avatars');
                if (!file_exists($destinationPath)) mkdir($destinationPath, 0755, true);

                $file->move($destinationPath, $filename);
                $user->avatar = '/uploads/avatars/' . $filename;
                $user->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Foto profil berhasil diubah.',
                'avatar_url' => $user->avatar
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Gagal mengunggah foto profil: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateShopLogo(Request $request)
    {
        return $this->uploadShopMedia($request, 'logo', 'logos');
    }

    public function updateShopBanner(Request $request)
    {
        return $this->uploadShopMedia($request, 'banner', 'banners');
    }

    public function updateHalalCert(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'umkm' || !$user->umkmProfile) {
            return response()->json(['success' => false, 'message' => 'Hanya UMKM yang dapat mengunggah dokumen.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $profile = $user->umkmProfile;
            if ($profile->halal_cert && file_exists(public_path($profile->halal_cert))) {
                @unlink(public_path($profile->halal_cert));
            }

            $file = $request->file('file');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $dir = public_path('uploads/documents');
            if (!file_exists($dir)) mkdir($dir, 0755, true);

            $file->move($dir, $filename);
            $path = '/uploads/documents/' . $filename;
            $profile->update(['halal_cert' => $path]);

            return response()->json([
                'success' => true,
                'message' => 'Sertifikat halal berhasil diunggah.',
                'path' => $path,
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private function uploadShopMedia(Request $request, string $field, string $folder): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'umkm' || !$user->umkmProfile) {
            return response()->json(['success' => false, 'message' => 'Hanya UMKM yang dapat mengunggah media toko.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|image|mimes:jpeg,png,jpg,webp|max:3072',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $profile = $user->umkmProfile;
            if ($profile->$field && !str_starts_with($profile->$field, 'http') && file_exists(public_path($profile->$field))) {
                @unlink(public_path($profile->$field));
            }

            $file = $request->file('file');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $dir = public_path("uploads/shop/{$folder}");
            if (!file_exists($dir)) mkdir($dir, 0755, true);

            $file->move($dir, $filename);
            $path = "/uploads/shop/{$folder}/{$filename}";
            $profile->update([$field => $path]);

            return response()->json([
                'success' => true,
                'message' => ucfirst($field) . ' berhasil diunggah.',
                'path' => $path,
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function reapplyRequest(Request $request)
    {
        $user = $request->user();
        $umkm = $user->umkmProfile;

        if (!$umkm) {
            return response()->json(['message' => 'Profil UMKM tidak ditemukan.'], 404);
        }

        if ($umkm->status !== 'rejected') {
            return response()->json(['message' => 'Hanya bisa mengajukan ulang jika pendaftaran ditolak.'], 422);
        }

        $umkm->update(['status' => 'pending', 'rejection_reason' => null]);

        return response()->json(['message' => 'Berhasil mengajukan ulang. Menunggu verifikasi BUMDes.']);
    }

    public function sellerBalance(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'umkm' || !$user->umkmProfile) {
            return response()->json(['data' => ['pending' => 0, 'available' => 0]]);
        }
        $balance = \App\Models\UmkmBalance::where('owner_id', $user->umkmProfile->id)
            ->where('owner_type', 'umkm')
            ->first();
        return response()->json([
            'data' => [
                'pending'   => $balance?->pending ?? 0,
                'available' => $balance?->available ?? 0,
            ]
        ]);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password'          => 'required|string',
            'new_password'              => 'required|string|min:8',
            'new_password_confirmation' => 'required|same:new_password',
        ], [
            'current_password.required'          => 'Kata sandi saat ini wajib diisi.',
            'new_password.required'              => 'Kata sandi baru wajib diisi.',
            'new_password.min'                   => 'Kata sandi baru minimal 8 karakter.',
            'new_password_confirmation.same'     => 'Konfirmasi kata sandi baru tidak cocok.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Kata sandi saat ini salah.'
            ], 422);
        }

        try {
            $user->password = Hash::make($request->new_password);
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Kata sandi berhasil diperbarui.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah kata sandi: ' . $e->getMessage()
            ], 500);
        }
    }
}
