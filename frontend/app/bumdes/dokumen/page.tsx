"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface RequiredDocument {
  id: number;
  name: string;
  description: string | null;
  is_required: boolean;
}

export default function BumdesDokumenPage() {
  const [docs, setDocs] = useState<RequiredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", is_required: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { Authorization: `Bearer ${token}` };

  const fetchDocs = async () => {
    try {
      const res = await axios.get(`${API}/admin/required-documents`, { headers });
      setDocs(res.data.data ?? []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setSubmitting(true);
    try {
      await axios.post(`${API}/admin/required-documents`, form, { headers });
      setSuccess("Dokumen berhasil ditambahkan.");
      setForm({ name: "", description: "", is_required: true });
      setShowForm(false);
      fetchDocs();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Gagal menambahkan dokumen.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRequired = async (doc: RequiredDocument) => {
    try {
      await axios.put(`${API}/admin/required-documents/${doc.id}`, { is_required: !doc.is_required }, { headers });
      fetchDocs();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus dokumen ini?")) return;
    try {
      await axios.delete(`${API}/admin/required-documents/${id}`, { headers });
      fetchDocs();
    } catch {}
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dokumen Wajib Mitra</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tentukan dokumen apa saja yang harus dilampirkan saat mendaftar menjadi mitra</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#2D6A4F" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Dokumen
        </button>
      </div>

      {success && <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">{success}</div>}

      {/* Form Tambah */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Tambah Dokumen Wajib</h2>
          {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Dokumen <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: KTP, SIUP, Foto Produk"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Contoh: Scan KTP asli pemilik usaha"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_required"
                checked={form.is_required}
                onChange={e => setForm({ ...form, is_required: e.target.checked })}
                className="w-4 h-4 accent-green-600"
              />
              <label htmlFor="is_required" className="text-sm text-gray-700">Dokumen ini wajib dilampirkan</label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#2D6A4F" }}
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Dokumen */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Daftar Dokumen</p>
          <span className="text-xs text-gray-400">{docs.length} dokumen</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Memuat data...</div>
        ) : docs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-400">Belum ada dokumen wajib yang ditentukan.</p>
            <p className="text-xs text-gray-300 mt-1">Tambahkan dokumen agar mitra tahu apa yang perlu disiapkan saat mendaftar.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${doc.is_required ? "bg-green-100" : "bg-gray-100"}`}>
                    <svg className={`w-3 h-3 ${doc.is_required ? "text-green-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6M9 7h1M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                    {doc.description && <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>}
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${doc.is_required ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {doc.is_required ? "Wajib" : "Opsional"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleRequired(doc)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                  >
                    {doc.is_required ? "Jadikan Opsional" : "Jadikan Wajib"}
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 font-medium"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
