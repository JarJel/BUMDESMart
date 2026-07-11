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
            'category'    => 'nullable|string|max:100',
        ]);

        $doc = $bumdes->requiredDocuments()->create([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
            'is_required' => $validated['is_required'] ?? true,
            'category'    => $validated['category'] ?? null,
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
            'category'    => 'nullable|string|max:100',
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

    public function seedDefaults(Request $request)
    {
        $bumdes = $this->getBumdesProfile($request);

        $defaults = [
            // Semua kategori
            [
                'name'        => 'NIB (Nomor Induk Berusaha)',
                'description' => 'Nomor Induk Berusaha dari sistem OSS (oss.go.id). Gratis dan otomatis diterbitkan saat pendaftaran usaha.',
                'is_required' => true,
                'category'    => null,
            ],
            [
                'name'        => 'NPWP (Nomor Pokok Wajib Pajak)',
                'description' => 'Kartu NPWP dari Direktorat Jenderal Pajak. Wajib jika omzet usaha di atas Rp500 juta per tahun.',
                'is_required' => false,
                'category'    => null,
            ],

            // Makanan & Minuman
            [
                'name'        => 'Sertifikasi Halal MUI/BPJPH',
                'description' => 'Sertifikat Halal dari BPJPH/MUI. Wajib untuk usaha Makanan & Minuman mulai 18 Oktober 2026 (PP 42/2024).',
                'is_required' => false,
                'category'    => 'Makanan & Minuman',
            ],
            [
                'name'        => 'Sertifikat Produksi Pangan Industri Rumah Tangga (SPP-IRT)',
                'description' => 'Izin edar dari Dinas Kesehatan Kabupaten/Kota untuk pangan olahan berisiko rendah (padat/kering). Berlaku untuk 15 jenis produk per PerBPOM No. 22 Tahun 2018.',
                'is_required' => true,
                'category'    => 'Makanan & Minuman',
            ],
            [
                'name'        => 'Izin Edar BPOM MD (Produk Minuman & Risiko Tinggi)',
                'description' => 'Wajib untuk semua jenis MINUMAN, produk susu, produk bayi, dan pangan berisiko tinggi. Produk minuman tidak dapat menggunakan SPP-IRT (PerBPOM No. 22/2018).',
                'is_required' => false,
                'category'    => 'Makanan & Minuman',
            ],

            // Kesehatan & Kecantikan
            [
                'name'        => 'Notifikasi Kosmetika BPOM',
                'description' => 'Nomor notifikasi dari BPOM, wajib sebelum produk kosmetik diedarkan di Indonesia. Didaftarkan melalui e-sertifikasi.pom.go.id.',
                'is_required' => true,
                'category'    => 'Kesehatan & Kecantikan',
            ],
            [
                'name'        => 'Sertifikasi Halal Kosmetika',
                'description' => 'Sertifikat Halal dari BPJPH untuk produk kosmetik. Wajib mulai 18 Oktober 2026 (PP 42/2024).',
                'is_required' => false,
                'category'    => 'Kesehatan & Kecantikan',
            ],
            [
                'name'        => 'Izin Edar Suplemen Kesehatan / Obat Tradisional BPOM',
                'description' => 'Izin edar dari BPOM untuk produk jamu, suplemen kesehatan, dan obat tradisional.',
                'is_required' => true,
                'category'    => 'Kesehatan & Kecantikan',
            ],

            // Tekstil & Fashion
            [
                'name'        => 'Sertifikat SNI Pakaian Bayi',
                'description' => 'SNI wajib dari Kemenperin untuk produk pakaian bayi dan balita. Wajib jika menjual pakaian untuk usia di bawah 3 tahun.',
                'is_required' => false,
                'category'    => 'Tekstil & Fashion',
            ],
            [
                'name'        => 'Sertifikasi Halal Barang Gunaan (Fashion & Aksesori)',
                'description' => 'Sertifikat Halal dari BPJPH untuk produk fashion, pakaian, dan aksesori. Wajib mulai 18 Oktober 2026 (PP 42/2024).',
                'is_required' => false,
                'category'    => 'Tekstil & Fashion',
            ],

            // Elektronik
            [
                'name'        => 'Sertifikat SNI Produk Elektronik',
                'description' => 'SNI wajib dari Kemenperin untuk produk elektronik tertentu (AC, kulkas, mesin cuci, setrika, pompa air, televisi, dll). Cek daftar produk SNI wajib di bsn.go.id.',
                'is_required' => false,
                'category'    => 'Elektronik',
            ],

            // Pertanian & Peternakan
            [
                'name'        => 'Surat Izin Usaha Pertanian / Peternakan',
                'description' => 'Izin usaha dari Kementerian Pertanian melalui portal SIMPEL (perizinan.pertanian.go.id). Diperlukan untuk usaha pembibitan, budidaya, dan peternakan.',
                'is_required' => false,
                'category'    => 'Pertanian & Peternakan',
            ],

            // Jasa
            [
                'name'        => 'Surat Keterangan Usaha (SKU)',
                'description' => 'Surat keterangan dari Kelurahan atau Kecamatan yang menerangkan keberadaan usaha jasa.',
                'is_required' => true,
                'category'    => 'Jasa',
            ],
        ];

        $created = 0;
        foreach ($defaults as $item) {
            $exists = $bumdes->requiredDocuments()
                ->where('name', $item['name'])
                ->exists();

            if (!$exists) {
                $bumdes->requiredDocuments()->create($item);
                $created++;
            }
        }

        return response()->json([
            'message' => $created > 0
                ? "{$created} dokumen regulasi berhasil ditambahkan."
                : "Semua dokumen regulasi sudah ada.",
            'created' => $created,
        ]);
    }
}
