<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Setting::all()]);
    }

    public function update(Request $request)
    {
        $settings = $request->validate(['settings' => 'required|array']);

        foreach ($settings['settings'] as $key => $value) {
            Setting::where('key', $key)->update(['value' => $value]);
        }

        return response()->json(['message' => 'Pengaturan berhasil disimpan.']);
    }
}
