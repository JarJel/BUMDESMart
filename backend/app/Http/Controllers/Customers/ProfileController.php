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
            'name'        => 'sometimes|required|string|max:255',
            'phone'       => 'sometimes|nullable|string|max:20',
            'date_of_birth' => 'sometimes|nullable|date',
            'gender'      => 'sometimes|nullable|in:male,female,other',
            // UMKM fields
            'shop_name'   => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'address'     => 'sometimes|nullable|string|max:500',
            'city'        => 'sometimes|nullable|string|max:100',
            'province'    => 'sometimes|nullable|string|max:100',
            'postal_code' => 'sometimes|nullable|string|max:10',
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
                    $umkmData = $request->only([
                        'shop_name', 'description', 'phone',
                        'address', 'city', 'province', 'postal_code'
                    ]);
                    $user->umkmProfile->update(array_filter($umkmData, fn($v) => !is_null($v)));
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
                // Delete old avatar if exists and is not default/remote URL
                if ($user->avatar && !str_starts_with($user->avatar, 'http') && file_exists(public_path($user->avatar))) {
                    @unlink(public_path($user->avatar));
                }

                $file = $request->file('avatar');
                $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                
                // Ensure directory exists
                $destinationPath = public_path('uploads/avatars');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0755, true);
                }

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
