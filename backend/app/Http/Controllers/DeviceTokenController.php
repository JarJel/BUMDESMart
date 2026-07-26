<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    // POST /device-token  — dipanggil FE setelah user subscribe OneSignal
    public function store(Request $request)
    {
        $request->validate([
            'token'     => 'required|string',
            'device_id' => 'nullable|string',
        ]);

        $userId = $request->user()->id;

        DeviceToken::updateOrCreate(
            ['user_id' => $userId, 'token' => $request->token],
            [
                'platform'     => 'web',
                'device_id'    => $request->device_id,
                'last_used_at' => now(),
            ]
        );

        return response()->json(['message' => 'Token tersimpan.']);
    }

    // DELETE /device-token  — dipanggil FE saat logout
    public function destroy(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        DeviceToken::where('user_id', $request->user()->id)
            ->where('token', $request->token)
            ->delete();

        return response()->json(['message' => 'Token dihapus.']);
    }
}
