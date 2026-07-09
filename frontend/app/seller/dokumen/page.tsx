"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

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
  const [toast, setToast] = useState("");
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDocs = async () => {
    try {
      const res = await axios.get(`${API}/seller/documents`, { headers });
      setDocs(res.data.data ?? []);
    } catch {
      setError("Gagal memuat daftar dokumen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleUpload = async (docId: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast("File terlalu besar. Maks 5MB.");
      return;
    }

    setUploading(prev => ({ ...prev, [docId]: true }));
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API}/seller/documents/${docId}`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      showToast("Dokumen berhasil diupload!");
      await fetchDocs();
    } catch (err: any) {
      const msg = err.response?.data?.errors?.file?.[0] ?? err.response?.data?.message ?? "Upload gagal.";
      showToast(msg);
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
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-gray-900 text-white text-sm shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dokumen Usaha</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload dokumen yang diminta BUMDes untuk verifikasi toko kamu.
        </p>
      </div>

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
