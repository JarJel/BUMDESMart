<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = PlatformSetting::orderBy('group')->orderBy('key')->get();

        $grouped = $settings->groupBy('group')->map(fn($items) => $items->values());

        return response()->json(['data' => $grouped]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings'       => 'required|array',
            'settings.*.key' => 'required|string|exists:platform_settings,key',
            'settings.*.value' => 'nullable|string',
        ]);

        foreach ($validated['settings'] as $item) {
            PlatformSetting::where('key', $item['key'])->update(['value' => $item['value'] ?? '']);
        }

        return response()->json(['message' => 'Pengaturan berhasil disimpan.']);
    }
}
