<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BumdesRequiredDocument;
use App\Models\BumdesProfile;
use Illuminate\Http\Request;

class RequiredDocumentController extends Controller
{
    private function getBumdesProfile(Request $request)
    {
        return BumdesProfile::where('user_id', $request->user()->id)->firstOrFail();
    }

    public function index(Request $request)
    {
        $bumdes = $this->getBumdesProfile($request);
        $docs = $bumdes->requiredDocuments()->orderBy('created_at')->get();

        return response()->json(['data' => $docs]);
    }

    public function store(Request $request)
    {
        $bumdes = $this->getBumdesProfile($request);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'is_required' => 'boolean',
        ]);

        $doc = $bumdes->requiredDocuments()->create([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_required' => $validated['is_required'] ?? true,
        ]);

        return response()->json(['message' => 'Dokumen berhasil ditambahkan', 'data' => $doc], 201);
    }

    public function update(Request $request, BumdesRequiredDocument $document)
    {
        $bumdes = $this->getBumdesProfile($request);

        if ($document->bumdes_profile_id !== $bumdes->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:500',
            'is_required' => 'boolean',
        ]);

        $document->update($validated);

        return response()->json(['message' => 'Dokumen berhasil diperbarui', 'data' => $document]);
    }

    public function destroy(Request $request, BumdesRequiredDocument $document)
    {
        $bumdes = $this->getBumdesProfile($request);

        if ($document->bumdes_profile_id !== $bumdes->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $document->delete();

        return response()->json(['message' => 'Dokumen berhasil dihapus']);
    }
}
