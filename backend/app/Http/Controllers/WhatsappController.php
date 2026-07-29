<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

use App\Services\WhatsappService;

class WhatsappController extends Controller
{
    public function sendWhatsapp(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'target' => 'required_without_all:user_id,customer_id,seller_id,umkm_id,driver_id,kurir_id|string|nullable',
            'user_id' => 'required_without_all:target,customer_id,seller_id,umkm_id,driver_id,kurir_id|integer|nullable',
            'customer_id' => 'required_without_all:target,user_id,seller_id,umkm_id,driver_id,kurir_id|integer|nullable',
            'seller_id' => 'required_without_all:target,user_id,customer_id,umkm_id,driver_id,kurir_id|integer|nullable',
            'umkm_id' => 'required_without_all:target,user_id,customer_id,seller_id,driver_id,kurir_id|integer|nullable',
            'driver_id' => 'required_without_all:target,user_id,customer_id,seller_id,umkm_id,kurir_id|integer|nullable',
            'kurir_id' => 'required_without_all:target,user_id,customer_id,seller_id,umkm_id,driver_id|integer|nullable',
        ]);

        $target = $request->input('target');
        $message = $request->input('message');

        if ($request->filled('user_id')) {
            $user = \App\Models\User::find($request->input('user_id'));
            if (!$user || !$user->phone) {
                return response()->json([
                    'status' => false,
                    'error' => 'User phone number not found.'
                ], 404);
            }
            $target = $user->phone;
        } elseif ($request->filled('customer_id')) {
            $customer = \App\Models\Customer::find($request->input('customer_id'));
            if (!$customer || !$customer->phone) {
                // Fallback to related User
                if ($customer && $customer->user && $customer->user->phone) {
                    $target = $customer->user->phone;
                } else {
                    return response()->json([
                        'status' => false,
                        'error' => 'Customer phone number not found.'
                    ], 404);
                }
            } else {
                $target = $customer->phone;
            }
        } elseif ($request->filled('seller_id') || $request->filled('umkm_id')) {
            $sellerId = $request->input('seller_id') ?? $request->input('umkm_id');
            $seller = \App\Models\UmkmProfile::find($sellerId);
            if (!$seller || !$seller->phone) {
                // Fallback to related User
                if ($seller && $seller->user && $seller->user->phone) {
                    $target = $seller->user->phone;
                } else {
                    return response()->json([
                        'status' => false,
                        'error' => 'Seller phone number not found.'
                    ], 404);
                }
            } else {
                $target = $seller->phone;
            }
        } elseif ($request->filled('driver_id') || $request->filled('kurir_id')) {
            $driverId = $request->input('driver_id') ?? $request->input('kurir_id');
            $driver = \App\Models\DriverProfile::find($driverId);
            if ($driver && $driver->user && $driver->user->phone) {
                $target = $driver->user->phone;
            } else {
                // Fallback: search user by driver ID in users table with role 'pengirim'
                $user = \App\Models\User::where('role', 'pengirim')->find($driverId);
                if ($user && $user->phone) {
                    $target = $user->phone;
                } else {
                    return response()->json([
                        'status' => false,
                        'error' => 'Courier phone number not found.'
                    ], 404);
                }
            }
        }

        $result = WhatsappService::send($target, $message);

        if ($result['status'] === true) {
            return response()->json([
                'status' => true,
                'data' => $result['data']
            ]);
        }

        return response()->json([
            'status' => false,
            'error' => $result['error']
        ], 400);
    }
}
