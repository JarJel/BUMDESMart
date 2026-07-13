"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  parent_id: number | null;
  children?: Category[];
}

const EMPTY_FORM = {
  name: "",
  description: "",
  parent_id: "" as string | number,
  sort_order: 0,
  is_active: true,
};

export default function BumdesKategoriPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const toast = useToast();

  const fetchCategories = async () => {
    try {
      const res = await api.get("/admin/categories");
      setCategories(res.data.data ?? []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const allFlat = categories.flatMap(c => [c, ...(c.children ?? [])]);

  const openAdd = (parentId?: number) => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, parent_id: parentId ?? "" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      parent_id: cat.parent_id ?? "",
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const payload = {
      ...form,
      parent_id: form.parent_id === "" ? null : Number(form.parent_id),
    };
    try {
      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, payload);
        toast.success("Kategori berhasil diperbarui.");
      } else {
        await api.post("/admin/categories", payload);
        toast.success("Kategori berhasil ditambahkan.");
      }
      setShowForm(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Gagal menyimpan kategori.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await api.put(`/admin/categories/${cat.id}`, { is_active: !cat.is_active });
      fetchCategories();
    } catch {
      toast.error("Gagal mengubah status.");
    }
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/admin/categories/${deleteId}`);
      toast.success("Kategori dihapus.");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Gagal menghapus kategori.");
    } finally {
      setDeleteId(null);
    }
  };

  const totalCount = allFlat.length;
  const activeCount = allFlat.filter(c => c.is_active).length;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kategori Produk</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola kategori dan sub-kategori untuk produk mitra di marketplace.
          </p>
        </div>
        <button
          onClick={() => openAdd()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
          style={{ background: "#2D6A4F" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Kategori
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            {editingId ? "Edit Kategori" : "Tambah Kategori"}
          </h2>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Nama Kategori <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Makanan & Minuman"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Deskripsi</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Keterangan singkat tentang kategori ini"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Induk Kategori</label>
                <select
                  value={form.parent_id}
                  onChange={e => setForm({ ...form, parent_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
                >
                  <option value="">Tidak ada (kategori utama)</option>
                  {categories
                    .filter(c => c.id !== editingId)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Urutan Tampil</label>
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 accent-green-600"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Aktifkan kategori ini (tampil di marketplace)
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

      {/* List */}
      {loading ? (
        <div className="p-10 text-center text-sm text-gray-400">Memuat kategori...</div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-400">Belum ada kategori.</p>
          <p className="text-xs text-gray-300 mt-1">Tambahkan kategori agar mitra bisa mengelompokkan produk mereka.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <CategoryRow
                cat={cat}
                indent={0}
                onEdit={openEdit}
                onToggle={handleToggleActive}
                onDelete={id => setDeleteId(id)}
                onAddChild={openAdd}
              />
              {(cat.children ?? []).map(child => (
                <CategoryRow
                  key={child.id}
                  cat={child}
                  indent={1}
                  onEdit={openEdit}
                  onToggle={handleToggleActive}
                  onDelete={id => setDeleteId(id)}
                  onAddChild={openAdd}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {totalCount > 0 && (
        <div className="flex gap-4 text-xs text-gray-400 pt-2">
          <span>{totalCount} total kategori</span>
          <span>·</span>
          <span>{activeCount} aktif</span>
          <span>·</span>
          <span>{categories.length} kategori utama</span>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Kategori?"
        description="Kategori yang masih digunakan produk atau memiliki sub-kategori tidak dapat dihapus."
        confirmLabel="Ya, Hapus"
        onConfirm={executeDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

function CategoryRow({
  cat, indent, onEdit, onToggle, onDelete, onAddChild,
}: {
  cat: Category;
  indent: number;
  onEdit: (c: Category) => void;
  onToggle: (c: Category) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors gap-3 ${indent > 0 ? "border-t border-gray-50" : ""}`}
      style={{ paddingLeft: indent > 0 ? "2.5rem" : undefined }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {indent > 0 && (
          <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{cat.name}</p>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${cat.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {cat.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          {cat.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{cat.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">/{cat.slug}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {indent === 0 && (
          <button
            onClick={() => onAddChild(cat.id)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium"
          >
            + Sub
          </button>
        )}
        <button
          onClick={() => onEdit(cat)}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
        >
          Edit
        </button>
        <button
          onClick={() => onToggle(cat)}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
        >
          {cat.is_active ? "Nonaktifkan" : "Aktifkan"}
        </button>
        <button
          onClick={() => onDelete(cat.id)}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 font-medium"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}
