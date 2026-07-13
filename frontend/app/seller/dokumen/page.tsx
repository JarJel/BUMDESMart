"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

interface UploadedDoc {
  id: number;
  file_path: string;
  file_url: string;
  status: "pending" | "approved" | "rejected";
  updated_at: string;
}

interface RequiredDoc {
  id: number;
  name: string;
  description: string | null;
  is_required: boolean;
  uploaded: UploadedDoc | null;
}

const statusConfig = {
  pending:  { label: "Menunggu review", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  approved: { label: "Disetujui", className: "bg-green-50 text-green-700 border-green-200" },
  rejected: { label: "Ditolak", className: "bg-red-50 text-red-700 border-red-200" },
};

export default function DokumenPage() {
  const [docs, setDocs] = useState<RequiredDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");
  const toast = useToast();
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const fetchDocs = async () => {
    try {
      const res = await api.get("/seller/documents");
      setDocs(res.data.data ?? []);
    } catch {
      setError("Gagal memuat daftar dokumen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (docId: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("File terlalu besar. Maks 5MB.");
      return;
    }

    setUploading(prev => ({ ...prev, [docId]: true }));
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post(`/seller/documents/${docId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Dokumen berhasil diupload!");
      await fetchDocs();
    } catch (err: any) {
      const msg = err.response?.data?.errors?.file?.[0] ?? err.response?.data?.message ?? "Upload gagal.";
      toast.error(msg);
    } finally {
      setUploading(prev => ({ ...prev, [docId]: false }));
    }
  };

  const wajibDocs = docs.filter(d => d.is_required);
  const opsionalDocs = docs.filter(d => !d.is_required);
  const totalWajib = wajibDocs.length;
  const sudahUploadWajib = wajibDocs.filter(d => d.uploaded).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Memuat dokumen...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dokumen Usaha</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload dokumen yang diminta BUMDes untuk verifikasi toko kamu.
        </p>
      </div>

      <PanduanIzinEdar />

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      {/* Progress bar */}
      {totalWajib > 0 && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Progress dokumen wajib</p>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
              {sudahUploadWajib}/{totalWajib} diupload
            </p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${(sudahUploadWajib / totalWajib) * 100}%`, background: "var(--primary)" }}
            />
          </div>
          {sudahUploadWajib < totalWajib && (
            <p className="text-xs text-gray-400 mt-2">
              Lengkapi semua dokumen wajib agar BUMDes bisa memverifikasi toko kamu.
            </p>
          )}
        </div>
      )}

      {docs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-sm text-gray-400">BUMDes belum menentukan dokumen yang diperlukan.</p>
          <p className="text-xs text-gray-300 mt-1">Hubungi admin BUMDes kamu untuk informasi lebih lanjut.</p>
        </div>
      ) : (
        <>
          {/* Dokumen Wajib */}
          {wajibDocs.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Dokumen Wajib
              </h2>
              <div className="space-y-3">
                {wajibDocs.map(doc => (
                  <DocCard
                    key={doc.id}
                    doc={doc}
                    uploading={uploading[doc.id] ?? false}
                    inputRef={el => { fileInputRefs.current[doc.id] = el; }}
                    onUpload={(file) => handleUpload(doc.id, file)}
                    onClickUpload={() => fileInputRefs.current[doc.id]?.click()}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dokumen Opsional */}
          {opsionalDocs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Dokumen Opsional
              </h2>
              <div className="space-y-3">
                {opsionalDocs.map(doc => (
                  <DocCard
                    key={doc.id}
                    doc={doc}
                    uploading={uploading[doc.id] ?? false}
                    inputRef={el => { fileInputRefs.current[doc.id] = el; }}
                    onUpload={(file) => handleUpload(doc.id, file)}
                    onClickUpload={() => fileInputRefs.current[doc.id]?.click()}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PanduanIzinEdar() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-blue-800">Panduan: PIRT vs Izin Edar BPOM</span>
        </div>
        <svg className={`w-4 h-4 text-blue-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-blue-100">
          <p className="text-xs text-blue-700 mt-3">
            Berdasarkan <strong>PerBPOM No. 22 Tahun 2018</strong>, izin edar makanan dibagi dua sesuai risiko produk:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border border-green-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-green-800">SPP-IRT / PIRT</p>
                  <p className="text-[10px] text-green-600">Risiko Rendah · via Dinkes Kab/Kota</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 mb-2">Untuk produk <strong>padat, kering, tidak mudah basi</strong> yang diproduksi di rumah:</p>
              <ul className="text-[11px] text-gray-500 space-y-0.5 list-none">
                {["Keripik, abon, dendeng", "Kue kering, roti kering", "Kopi, teh, coklat bubuk", "Bumbu & rempah kering", "Selai, madu, gula aren", "Mie kering, bihun", "Kacang goreng, emping"].map(item => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-green-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg border border-red-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-red-700">Izin Edar BPOM MD</p>
                  <p className="text-[10px] text-red-500">Risiko Tinggi · via BPOM Pusat</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 mb-2">Wajib jika produk termasuk kategori <strong>risiko sedang–tinggi</strong>:</p>
              <ul className="text-[11px] text-gray-500 space-y-0.5 list-none">
                {[
                  "Semua jenis MINUMAN (jus, sirup, air minum, dll)",
                  "Produk susu & olahannya",
                  "Daging, ikan, seafood segar/beku",
                  "Produk dengan klaim kesehatan",
                  "Makanan/minuman untuk bayi",
                  "Suplemen & vitamin makanan",
                ].map(item => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-[11px] text-blue-600 bg-blue-100 rounded-lg px-3 py-2">
            Tidak yakin produkmu masuk kategori mana? Hubungi <strong>Dinas Kesehatan</strong> kab/kota setempat atau cek di <strong>istanaumkm.pom.go.id</strong>
          </p>
        </div>
      )}
    </div>
  );
}

function DocCard({
  doc, uploading, inputRef, onUpload, onClickUpload,
}: {
  doc: RequiredDoc;
  uploading: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onUpload: (file: File) => void;
  onClickUpload: () => void;
}) {
  const uploaded = doc.uploaded;
  const status = uploaded ? statusConfig[uploaded.status] : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <input
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        ref={inputRef}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) { onUpload(file); e.target.value = ""; }
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
            {doc.is_required && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                Wajib
              </span>
            )}
            {status && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${status.className}`}>
                {status.label}
              </span>
            )}
          </div>
          {doc.description && (
            <p className="text-xs text-gray-400 mt-1">{doc.description}</p>
          )}
        </div>

        <button
          onClick={onClickUpload}
          disabled={uploading}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {uploading ? "Mengupload..." : uploaded ? "Ganti File" : "Upload"}
        </button>
      </div>

      {uploaded && (
        <div className="mt-3 flex items-center justify-between gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs text-gray-500 truncate">
              {uploaded.file_path.split("/").pop()}
            </span>
          </div>
          <a
            href={uploaded.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium shrink-0 hover:underline"
            style={{ color: "var(--primary)" }}
          >
            Lihat
          </a>
        </div>
      )}

      {!uploaded && (
        <div
          onClick={onClickUpload}
          className="mt-3 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-green-300 hover:bg-green-50 transition-colors"
        >
          <p className="text-xs text-gray-400">Klik untuk upload · JPG, PNG, atau PDF · Maks 5MB</p>
        </div>
      )}
    </div>
  );
}
