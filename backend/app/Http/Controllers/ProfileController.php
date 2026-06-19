<?php

namespace App\Http\Controllers;

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
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'date_of_birth' => 'sometimes|nullable|date',
            'gender' => 'sometimes|nullable|in:male,female,other',
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

            $user->load('customer');

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
}
