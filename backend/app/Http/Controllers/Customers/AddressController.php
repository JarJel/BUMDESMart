<?php

namespace App\Http\Controllers\Customers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use App\Models\Address;
use Illuminate\Support\Facades\Validator;
use Exception;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat memiliki alamat.'
            ], 403);
        }

        $addresses = Address::where('customer_id', $user->customer->id)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $addresses
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat menambah alamat.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'label' => 'nullable|string|max:255',
            'recipient_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'postal_code' => 'required|string|max:10',
            'latitude'    => 'nullable|numeric|between:-90,90',
            'longitude'   => 'nullable|numeric|between:-180,180',
            'is_default'  => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $customerId = $user->customer->id;
            $isDefault = $request->boolean('is_default', false);

            // If there are no existing addresses, this one should be default automatically
            $existingCount = Address::where('customer_id', $customerId)->count();
            if ($existingCount === 0) {
                $isDefault = true;
            }

            if ($isDefault) {
                Address::where('customer_id', $customerId)->update(['is_default' => false]);
            }

            $address = Address::create([
                'customer_id'    => $customerId,
                'label'          => $request->label ?? 'Utama',
                'recipient_name' => $request->recipient_name,
                'phone'          => $request->phone,
                'address'        => $request->address,
                'city'           => $request->city,
                'province'       => $request->province,
                'postal_code'    => $request->postal_code,
                'latitude'       => $request->latitude,
                'longitude'      => $request->longitude,
                'is_default'     => $isDefault,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Alamat berhasil ditambahkan.',
                'data' => $address
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambah alamat: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat mengubah alamat.'
            ], 403);
        }

        $address = Address::where('id', $id)
            ->where('customer_id', $user->customer->id)
            ->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan.'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'label' => 'nullable|string|max:255',
            'recipient_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'postal_code' => 'required|string|max:10',
            'latitude'    => 'nullable|numeric|between:-90,90',
            'longitude'   => 'nullable|numeric|between:-180,180',
            'is_default'  => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $isDefault = $request->boolean('is_default', false);

            if ($isDefault) {
                Address::where('customer_id', $user->customer->id)->update(['is_default' => false]);
            }

            $address->update([
                'label'          => $request->label ?? $address->label,
                'recipient_name' => $request->recipient_name,
                'phone'          => $request->phone,
                'address'        => $request->address,
                'city'           => $request->city,
                'province'       => $request->province,
                'postal_code'    => $request->postal_code,
                'latitude'       => $request->latitude,
                'longitude'      => $request->longitude,
                'is_default'     => $isDefault,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Alamat berhasil diperbarui.',
                'data' => $address
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui alamat: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat menghapus alamat.'
            ], 403);
        }

        $address = Address::where('id', $id)
            ->where('customer_id', $user->customer->id)
            ->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan.'
            ], 404);
        }

        try {
            $wasDefault = $address->is_default;
            $address->delete();

            // If we deleted the default address, set another address as default
            if ($wasDefault) {
                $nextAddress = Address::where('customer_id', $user->customer->id)
                    ->orderBy('created_at', 'desc')
                    ->first();
                if ($nextAddress) {
                    $nextAddress->update(['is_default' => true]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Alamat berhasil dihapus.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus alamat: ' . $e->getMessage()
            ], 500);
        }
    }

    public function setDefault(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'customer' || !$user->customer) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya customer yang dapat mengatur alamat utama.'
            ], 403);
        }

        $address = Address::where('id', $id)
            ->where('customer_id', $user->customer->id)
            ->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan.'
            ], 404);
        }

        try {
            Address::where('customer_id', $user->customer->id)->update(['is_default' => false]);
            $address->update(['is_default' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Alamat utama berhasil diubah.',
                'data' => $address
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyetel alamat utama: ' . $e->getMessage()
            ], 500);
        }
    }
}
