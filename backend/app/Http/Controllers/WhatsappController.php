<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class WhatsappController extends Controller
{
    public function sendWhatsapp(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'target' => 'required_without_all:user_id,customer_id|string|nullable',
            'user_id' => 'required_without_all:target,customer_id|integer|nullable',
            'customer_id' => 'required_without_all:target,user_id|integer|nullable',
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
                return response()->json([
                    'status' => false,
                    'error' => 'Customer phone number not found.'
                ], 404);
            }
            $target = $customer->phone;
        }

        $response = Http::withHeaders([
            'Authorization' => config('services.fonnte.token'),
        ])->withoutVerifying()->post(config('services.fonnte.endpoint'), [
            'target' => $target,
            'message' => $message,
            'countryCode' => '62',
        ]);

        $responseData = $response->json();
        if ($response->successful() && ($responseData['status'] ?? false) === true) {
            return response()->json([
                'status' => true,
                'data' => $responseData
            ]);
        }

        return response()->json([
            'status' => false,
            'error' => $responseData['reason'] ?? $response->body()
        ], $response->status() === 200 ? 400 : $response->status());
    }
}
