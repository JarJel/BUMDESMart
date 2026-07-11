"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api/axios";
import { ProductCard } from "@/components/shared/ProductCard";
import { useToast } from "@/components/ui/Toast";

interface Category { id: number; name: string; }

export default function TambahProdukPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const toast = useToast();

  // Form state
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    description: "",
    price: "",
    stock: "",
    weight: "",
    status: "active",
  });

  // Foto
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<{ data: Category[] }>("/categories")
      .then(res => setCategories(res.data.data ?? []))
      .catch(() => {});
  }, []);

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);
    setPhotos(prev => [...prev, ...toAdd]);
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setPhotoPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nama produk wajib diisi";
    if (!form.category_id) e.category_id = "Kategori wajib dipilih";
    if (!form.description.trim()) e.description = "Deskripsi wajib diisi";
    if (!form.price || Number(form.price) <= 0) e.price = "Harga harus lebih dari 0";
    if (!form.stock || Number(form.stock) < 0) e.stock = "Stok tidak boleh negatif";
    if (!form.weight || Number(form.weight) <= 0) e.weight = "Berat wajib diisi (gram)";
    return e;
  };

  const handleSubmit = async (statusOverride?: string) => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("category_id", form.category_id);
    fd.append("description", form.description);
    fd.append("price", form.price);
    fd.append("stock", form.stock);
    fd.append("weight", form.weight);
    fd.append("status", statusOverride ?? form.status);
    photos.forEach(f => fd.append("images[]", f));

    try {
      await api.post("/seller/products", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Produk berhasil ditambahkan!");
      setSuccessMsg("Produk berhasil disimpan!");
      setTimeout(() => router.push("/seller/produk"), 1200);
    } catch (e: any) {
      const apiErrors = e.response?.data?.errors ?? {};
      const mapped: Record<string, string> = {};
      Object.entries(apiErrors).forEach(([k, v]) => { mapped[k] = (v as string[])[0]; });
      if (Object.keys(mapped).length > 0) {
        setErrors(mapped);
      } else {
        setErrors({ _global: e.response?.data?.error ?? "Gagal menyimpan produk." });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/seller/produk" className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tambah Produk Baru</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lengkapi informasi produk kamu</p>
        </div>
      </div>

      {errors._global && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{errors._global}</div>
      )}
      {successMsg && (
        <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">{successMsg}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">

          {/* Informasi Produk */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Informasi Produk</h2>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Nama Produk <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={setField("name")} type="text" placeholder="Contoh: Keripik Singkong Original 200gr"
                className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 ${errors.name ? "border-red-300" : "border-gray-200"}`} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Kategori <span className="text-red-500">*</span></label>
              <select value={form.category_id} onChange={setField("category_id")}
                className={`w-full text-sm border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-green-400 ${errors.category_id ? "border-red-300" : "border-gray-200"}`}>
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Deskripsi Produk <span className="text-red-500">*</span></label>
              <textarea value={form.description} onChange={setField("description")} rows={4}
                placeholder="Deskripsikan produk kamu secara lengkap..."
                className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 resize-none ${errors.description ? "border-red-300" : "border-gray-200"}`} />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Foto Produk */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Foto Produk</h2>
              <span className="text-xs text-gray-400">{photos.length}/5 foto</span>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {photoPreviews.map((src, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden relative group border border-gray-200">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-medium">Utama</span>
                  )}
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:border-green-400 hover:bg-green-50/50 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <span className="text-xs text-gray-300 mt-1">{photos.length === 0 ? "Utama" : "Tambah"}</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleAddPhoto}
            />
            <p className="text-xs text-gray-400">Rasio 1:1 (kotak) · Ideal 800×800px · Maks. 2MB per foto · JPG/PNG/WEBP · Foto pertama = foto utama.</p>
          </div>

          {/* Harga & Stok */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Harga & Stok</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Harga Jual <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">Rp</span>
                  <input value={form.price} onChange={setField("price")} type="number" min="0" placeholder="0"
                    className={`w-full text-sm border rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-green-400 ${errors.price ? "border-red-300" : "border-gray-200"}`} />
                </div>
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Stok <span className="text-red-500">*</span></label>
                <input value={form.stock} onChange={setField("stock")} type="number" min="0" placeholder="0"
                  className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 ${errors.stock ? "border-red-300" : "border-gray-200"}`} />
                {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Berat (gram) <span className="text-red-500">*</span></label>
                <input value={form.weight} onChange={setField("weight")} type="number" min="0" placeholder="200"
                  className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 ${errors.weight ? "border-red-300" : "border-gray-200"}`} />
                {errors.weight && <p className="text-xs text-red-500 mt-1">{errors.weight}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Right - Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Status Produk</h2>
            <select value={form.status} onChange={setField("status")}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-green-400">
              <option value="active">Aktif</option>
              <option value="draft">Draft</option>
              <option value="inactive">Arsip</option>
            </select>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Preview Produk</h2>
              <p className="text-xs text-gray-400 mt-0.5">Tampilan seperti yang dilihat pembeli</p>
            </div>
            <div className="pointer-events-none w-40 mx-auto">
              <ProductCard product={{
                name: form.name || "Nama Produk",
                price: form.price || 0,
                slug: "preview",
                primary_image: photoPreviews[0] ? { file_path: photoPreviews[0] } : null,
              }} compact />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          onClick={() => handleSubmit("active")}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          {saving ? "Menyimpan..." : "Simpan & Publikasikan"}
        </button>
        <button
          onClick={() => handleSubmit("draft")}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Simpan sebagai Draft
        </button>
        <Link href="/seller/produk" className="px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-600 ml-auto">
          Batal
        </Link>
      </div>
    </div>
  );
}
