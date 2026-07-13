<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ShopStatusController extends Controller
{
    private function getUmkm(Request $request)
    {
        return $request->user()->umkmProfile;
    }

    public function toggle(Request $request)
    {
        $umkm = $this->getUmkm($request);
        $umkm->update([
            'is_open'      => !$umkm->is_open,
            'closed_until' => !$umkm->is_open ? null : $umkm->closed_until,
        ]);

        return response()->json([
            'message'  => $umkm->is_open ? 'Toko sekarang Buka.' : 'Toko sekarang Tutup.',
            'is_open'  => $umkm->is_open,
        ]);
    }

    public function updateHours(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'open_hours'                     => 'sometimes|nullable|array',
            'open_hours.*.open'              => 'required_with:open_hours|string|regex:/^\d{2}:\d{2}$/',
            'open_hours.*.close'             => 'required_with:open_hours|string|regex:/^\d{2}:\d{2}$/',
            'open_hours.*.closed'            => 'boolean',
            'closed_until'                   => 'sometimes|nullable|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $umkm = $this->getUmkm($request);
        $data = [];

        if ($request->has('open_hours')) {
            $data['open_hours'] = $request->open_hours;
        }

        if ($request->has('closed_until')) {
            $data['closed_until'] = $request->closed_until;
            // Jika set closed_until di masa depan, otomatis is_open = false
            if ($request->closed_until) {
                $data['is_open'] = false;
            }
        }

        $umkm->update($data);

        return response()->json([
            'message' => 'Jam toko berhasil disimpan.',
            'data'    => $umkm->fresh(),
        ]);
    }

    public function show(Request $request)
    {
        $umkm = $this->getUmkm($request);
        return response()->json([
            'data' => [
                'is_open'           => $umkm->is_open,
                'is_currently_open' => $umkm->is_currently_open,
                'open_hours'        => $umkm->open_hours,
                'closed_until'      => $umkm->closed_until?->toIso8601String(),
            ],
        ]);
    }
}
