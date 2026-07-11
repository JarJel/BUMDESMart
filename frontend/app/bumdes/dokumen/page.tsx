"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/axios";

const CATEGORIES = [
  "Makanan & Minuman",
  "Kerajinan Tangan",
  "Tekstil & Fashion",
  "Pertanian & Peternakan",
  "Elektronik",
  "Kesehatan & Kecantikan",
  "Jasa",
  "Lainnya",
];

interface RequiredDocument {
  id: number;
  name: string;
  description: string | null;
  is_required: boolean;
  category: string | null;
}

const EMPTY_FORM = { name: "", description: "", is_required: true, category: "" };

export default function BumdesDokumenPage() {
  const [docs, setDocs] = useState<RequiredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const fetchDocs = async () => {
    try {
      const res = await api.get("/admin/required-documents");
      setDocs(res.data.data ?? []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  };

  const openEdit = (doc: RequiredDocument) => {
    setEditingId(doc.id);
    setForm({ name: doc.name, description: doc.description ?? "", is_required: doc.is_required, category: doc.category ?? "" });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const payload = { ...form, category: form.category || null };
    try {
      if (editingId) {
        await api.put(`/admin/required-documents/${editingId}`, payload);
        showToast("Dokumen berhasil diperbarui.");
      } else {
        await api.post("/admin/required-documents", payload);
        showToast("Dokumen berhasil ditambahkan.");
      }
      setShowForm(false);
      fetchDocs();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Gagal menyimpan dokumen.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRequired = async (doc: RequiredDocument) => {
    try {
      await api.put(`/admin/required-documents/${doc.id}`, { is_required: !doc.is_required });
      fetchDocs();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus dokumen ini? Mitra yang sudah upload akan tetap tersimpan.")) return;
    try {
      await api.delete(`/admin/required-documents/${id}`);
      showToast("Dokumen dihapus.");
      fetchDocs();
    } catch {}
  };

  // Group: null category = semua, lainnya per kategori
  const globalDocs = docs.filter(d => !d.category);
  const categoryGroups = CATEGORIES.map(cat => ({
    category: cat,
    docs: docs.filter(d => d.category === cat),
  })).filter(g => g.docs.length > 0);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-gray-900 text-white text-sm shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dokumen Wajib Mitra</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tentukan dokumen yang harus dilampirkan mitra — bisa berlaku semua kategori atau khusus kategori tertentu.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#2D6A4F" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Dokumen
        </button>
      </div>

      {/* Form Tambah / Edit */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            {editingId ? "Edit Dokumen" : "Tambah Dokumen Wajib"}
          </h2>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Nama Dokumen <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: KTP, NIB, Sertifikat Halal"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Keterangan</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Contoh: Scan NIB asli dari OSS, format PDF/JPG"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Berlaku untuk kategori</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              >
                <option value="">Semua kategori usaha</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                "Semua kategori" = dokumen ini muncul untuk seluruh mitra, apapun jenis usahanya.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="is_required"
                checked={form.is_required}
                onChange={e => setForm({ ...form, is_required: e.target.checked })}
                className="w-4 h-4 accent-green-600"
              />
              <label htmlFor="is_required" className="text-sm text-gray-700">
                Dokumen ini <strong>wajib</strong> (mitra harus upload sebelum toko bisa aktif)
              </label>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#2D6A4F" }}
              >
                {submitting ? "Menyimpan..." : editingId ? "Perbarui" : "Simpan"}
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

      {loading ? (
        <div className="p-10 text-center text-sm text-gray-400">Memuat data...</div>
      ) : docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-400">Belum ada dokumen yang ditentukan.</p>
          <p className="text-xs text-gray-300 mt-1">Tambahkan dokumen agar mitra tahu apa yang perlu disiapkan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Global docs */}
          {globalDocs.length > 0 && (
            <DocGroup
              label="Semua Kategori Usaha"
              labelColor="bg-gray-100 text-gray-600"
              docs={globalDocs}
              onEdit={openEdit}
              onToggle={handleToggleRequired}
              onDelete={handleDelete}
            />
          )}

          {/* Per-category groups */}
          {categoryGroups.map(g => (
            <DocGroup
              key={g.category}
              label={g.category}
              labelColor="bg-blue-50 text-blue-700"
              docs={g.docs}
              onEdit={openEdit}
              onToggle={handleToggleRequired}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {docs.length > 0 && (
        <div className="flex gap-4 text-xs text-gray-400 pt-2">
          <span>{docs.length} total dokumen</span>
          <span>·</span>
          <span>{docs.filter(d => d.is_required).length} wajib</span>
          <span>·</span>
          <span>{docs.filter(d => !d.category).length} berlaku semua kategori</span>
        </div>
      )}
    </div>
  );
}

function DocGroup({
  label, labelColor, docs, onEdit, onToggle, onDelete,
}: {
  label: string;
  labelColor: string;
  docs: RequiredDocument[];
  onEdit: (doc: RequiredDocument) => void;
  onToggle: (doc: RequiredDocument) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2.5">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${labelColor}`}>
          {label}
        </span>
        <span className="text-xs text-gray-400">{docs.length} dokumen</span>
      </div>
      <div className="divide-y divide-gray-50">
        {docs.map(doc => (
          <div key={doc.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${doc.is_required ? "bg-green-100" : "bg-gray-100"}`}>
                <svg className={`w-3 h-3 ${doc.is_required ? "text-green-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
                {doc.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.description}</p>
                )}
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${doc.is_required ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {doc.is_required ? "Wajib" : "Opsional"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onEdit(doc)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => onToggle(doc)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
              >
                {doc.is_required ? "Opsionalkan" : "Wajibkan"}
              </button>
              <button
                onClick={() => onDelete(doc.id)}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 font-medium"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
