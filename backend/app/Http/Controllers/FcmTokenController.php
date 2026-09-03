<?php

namespace App\Http\Controllers;

use App\Models\FcmToken;
use Illuminate\Http\Request;

class FcmTokenController extends Controller
{
    public function store(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        FcmToken::updateOrCreate(
            ['token' => $request->token],
            ['user_id' => $request->user()->id, 'device_info' => $request->userAgent()]
        );

        return response()->json(['message' => 'Token disimpan.']);
    }

    public function destroy(Request $request)
    {
        $request->validate(['token' => 'required|string']);
        FcmToken::where('token', $request->token)->where('user_id', $request->user()->id)->delete();
        return response()->json(['message' => 'Token dihapus.']);
    }
}
