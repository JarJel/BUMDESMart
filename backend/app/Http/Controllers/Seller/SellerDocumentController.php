<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\BumdesRequiredDocument;
use App\Models\UmkmDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SellerDocumentController extends Controller
{
    public function index(Request $request)
    {
        $umkm = $request->user()->umkmProfile;

        if (!$umkm) {
            return response()->json(['error' => 'Profil UMKM tidak ditemukan.'], 404);
        }

        $requiredDocs = BumdesRequiredDocument::where('bumdes_profile_id', $umkm->bumdes_profile_id)
            ->orderBy('is_required', 'desc')
            ->orderBy('name')
            ->get();

        $uploadedDocs = UmkmDocument::where('umkm_profile_id', $umkm->id)
            ->whereNotNull('required_document_id')
            ->get()
            ->keyBy('required_document_id');

        $result = $requiredDocs->map(function ($doc) use ($uploadedDocs) {
            $uploaded = $uploadedDocs->get($doc->id);
            return [
                'id'          => $doc->id,
                'name'        => $doc->name,
                'description' => $doc->description,
                'is_required' => $doc->is_required,
                'uploaded'    => $uploaded ? [
                    'id'         => $uploaded->id,
                    'file_path'  => $uploaded->file_path,
                    'file_url'   => asset('storage/' . $uploaded->file_path),
                    'status'     => $uploaded->status,
                    'updated_at' => $uploaded->updated_at,
                ] : null,
            ];
        });

        return response()->json(['data' => $result]);
    }

    public function upload(Request $request, $requiredDocId)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $umkm = $request->user()->umkmProfile;

        if (!$umkm) {
            return response()->json(['error' => 'Profil UMKM tidak ditemukan.'], 404);
        }

        $requiredDoc = BumdesRequiredDocument::where('id', $requiredDocId)
            ->where('bumdes_profile_id', $umkm->bumdes_profile_id)
            ->first();

        if (!$requiredDoc) {
            return response()->json(['error' => 'Dokumen tidak ditemukan atau tidak sesuai BUMDes.'], 404);
        }

        $path = $request->file('file')->store('umkm-documents', 'public');

        $doc = UmkmDocument::updateOrCreate(
            [
                'umkm_profile_id'     => $umkm->id,
                'required_document_id' => $requiredDoc->id,
            ],
            [
                'document_type' => 'other',
                'file_path'     => $path,
                'status'        => 'pending',
                'verified_by'   => null,
                'verified_at'   => null,
            ]
        );

        return response()->json([
            'message' => 'Dokumen berhasil diupload.',
            'data'    => [
                'id'       => $doc->id,
                'file_url' => asset('storage/' . $doc->file_path),
                'status'   => $doc->status,
            ],
        ], 201);
    }
}
