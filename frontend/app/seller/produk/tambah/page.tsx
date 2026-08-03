"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api/axios";
import { ProductCard } from "@/components/shared/ProductCard";
import { useToast } from "@/components/ui/Toast";
import { compressImage } from "@/lib/utils/compressImage";

interface Category { id: number; name: string; slug?: string; children?: Category[]; }

interface VariantOptionRow {
  value: string;
  price: string;
  stock: string;
}

// mapping business_category enum → slug kategori utama yang relevan
const BUSINESS_CATEGORY_MAP: Record<string, string[]> = {
  makanan_minuman:       ["makanan-minuman"],
  fashion_kerajinan:     ["tekstil-fashion", "kerajinan-tangan"],
  pertanian_peternakan:  ["pertanian-peternakan"],
  jasa:                  ["jasa"],
  perdagangan_umum:      [], // semua kategori
};

function buildCategoryOptions(tree: Category[], businessCategory: string | null): { id: number; name: string; group: string }[] {
  const allowed = businessCategory ? (BUSINESS_CATEGORY_MAP[businessCategory] ?? []) : [];
  const result: { id: number; name: string; group: string }[] = [];

  for (const parent of tree) {
    const include = allowed.length === 0 || allowed.includes(parent.slug as string ?? "");
    if (!include) continue;

    const children = parent.children ?? [];
    if (children.length > 0) {
      for (const child of children) {
        result.push({ id: child.id, name: child.name, group: parent.name });
      }
    } else {
      result.push({ id: parent.id, name: parent.name, group: "" });
    }
  }

  // fallback: kalau tidak ada yang cocok, tampilkan semua sub-kategori
  if (result.length === 0) {
    for (const parent of tree) {
      const children = parent.children ?? [];
      if (children.length > 0) {
        for (const child of children) {
          result.push({ id: child.id, name: child.name, group: parent.name });
        }
      } else {
        result.push({ id: parent.id, name: parent.name, group: "" });
      }
    }
  }
  return result;
}

export default function TambahProdukPage() {
  const router = useRouter();
  const toast = useToast();
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [businessCategory, setBusinessCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Variant state
  const [hasVariant, setHasVariant] = useState(false);
  const [variantName, setVariantName] = useState("");
  const [variantOptions, setVariantOptions] = useState<VariantOptionRow[]>([
    { value: "", price: "", stock: "" },
  ]);

  // Foto
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Category[] }>("/categories"),
      api.get<{ data: { umkm_profile?: { business_category?: string } } }>("/profile"),
    ]).then(([catRes, profileRes]) => {
      setCategoryTree(catRes.data.data ?? []);
      setBusinessCategory(profileRes.data.data?.umkm_profile?.business_category ?? null);
    }).catch(() => {});
  }, []);

  const categoryOptions = buildCategoryOptions(categoryTree, businessCategory);

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);

    for (const f of toAdd) {
      try {
        const compressed = await compressImage(f);
        setPhotos(prev => [...prev, compressed]);
        const reader = new FileReader();
        reader.onload = ev => setPhotoPreviews(prev => [...prev, ev.target?.result as string]);
        reader.readAsDataURL(compressed);
      } catch {
        toast.error(`Gagal memproses gambar: ${f.name}`);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // Variant option helpers
  const addOption = () => {
    setVariantOptions(prev => [...prev, { value: "", price: "", stock: "" }]);
  };

  const removeOption = (idx: number) => {
    if (variantOptions.length <= 1) return;
    setVariantOptions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, field: keyof VariantOptionRow, value: string) => {
    setVariantOptions(prev => prev.map((opt, i) => i === idx ? { ...opt, [field]: value } : opt));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nama produk wajib diisi";
    if (!form.category_id) e.category_id = "Kategori wajib dipilih";
    if (!form.description.trim()) e.description = "Deskripsi wajib diisi";
    if (!form.weight || Number(form.weight) <= 0) e.weight = "Berat wajib diisi (gram)";

    if (hasVariant) {
      if (!variantName.trim()) e.variant_name = "Nama grup varian wajib diisi";
      const hasEmptyOption = variantOptions.some(opt => !opt.value.trim());
      const hasInvalidPrice = variantOptions.some(opt => !opt.price || Number(opt.price) <= 0);
      const hasInvalidStock = variantOptions.some(opt => opt.stock === "" || Number(opt.stock) < 0);
      if (hasEmptyOption) e.variant_options = "Semua opsi harus punya nilai";
      if (hasInvalidPrice) e.variant_price = "Harga setiap opsi harus lebih dari 0";
      if (hasInvalidStock) e.variant_stock = "Stok setiap opsi tidak boleh negatif";
    } else {
      if (!form.price || Number(form.price) <= 0) e.price = "Harga harus lebih dari 0";
      if (!form.stock || Number(form.stock) < 0) e.stock = "Stok tidak boleh negatif";
    }
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
    fd.append("weight", form.weight);
    fd.append("status", statusOverride ?? form.status);
    photos.forEach(f => fd.append("images[]", f));

    if (hasVariant) {
      fd.append("has_variant", "1");
      fd.append("variant[name]", variantName);
      variantOptions.forEach((opt, i) => {
        fd.append(`variant[options][${i}][value]`, opt.value);
        fd.append(`variant[options][${i}][price]`, opt.price);
        fd.append(`variant[options][${i}][stock]`, opt.stock);
      });
    } else {
      fd.append("has_variant", "0");
      fd.append("price", form.price);
      fd.append("stock", form.stock);
    }

    try {
      await api.post("/seller/products", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Produk berhasil ditambahkan!");
      setTimeout(() => router.push("/seller/produk"), 1200);
    } catch (e: any) {
      const apiErrors = e.response?.data?.errors ?? {};
      const mapped: Record<string, string> = {};
      Object.entries(apiErrors).forEach(([k, v]) => { mapped[k] = (v as string[])[0]; });
      if (Object.keys(mapped).length > 0) {
        setErrors(mapped);
      } else {
        toast.error(e.response?.data?.error ?? "Gagal menyimpan produk.");
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
                {Object.entries(
                  categoryOptions.reduce<Record<string, typeof categoryOptions>>((acc, c) => {
                    const g = c.group || "Lainnya";
                    (acc[g] = acc[g] || []).push(c);
                    return acc;
                  }, {})
                ).map(([group, opts]) => (
                  <optgroup key={group} label={group}>
                    {opts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                ))}
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
            <p className="text-xs text-gray-400">Rasio 1:1 (kotak) · JPG/PNG/WEBP · Otomatis dikompres ke WebP · Foto pertama = foto utama.</p>
          </div>

          {/* Harga & Stok */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Harga & Stok</h2>
            </div>

            {/* Toggle Varian */}
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">Produk punya varian?</p>
                <p className="text-xs text-gray-400 mt-0.5">Contoh: ukuran, warna, rasa</p>
              </div>
              <button
                type="button"
                onClick={() => setHasVariant(!hasVariant)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${hasVariant ? "bg-green-600" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${hasVariant ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Non-variant: price & stock */}
            {!hasVariant && (
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
            )}

            {/* Variant section */}
            {hasVariant && (
              <div className="space-y-4">
                {/* Berat tetap ditampilkan */}
                <div className="max-w-xs">
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Berat (gram) <span className="text-red-500">*</span></label>
                  <input value={form.weight} onChange={setField("weight")} type="number" min="0" placeholder="200"
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 ${errors.weight ? "border-red-300" : "border-gray-200"}`} />
                  {errors.weight && <p className="text-xs text-red-500 mt-1">{errors.weight}</p>}
                </div>

                {/* Variant name */}
                <div className="bg-green-50/50 rounded-xl border border-green-100 p-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Nama Grup Varian <span className="text-red-500">*</span></label>
                    <input
                      value={variantName}
                      onChange={e => setVariantName(e.target.value)}
                      type="text"
                      placeholder="Contoh: Ukuran, Warna, Rasa"
                      className={`w-full text-sm border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-green-400 ${errors.variant_name ? "border-red-300" : "border-gray-200"}`}
                    />
                    {errors.variant_name && <p className="text-xs text-red-500 mt-1">{errors.variant_name}</p>}
                  </div>

                  {/* Options list */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_120px_90px_32px] gap-2 px-1">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Nilai</span>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Harga (Rp)</span>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Stok</span>
                      <span />
                    </div>

                    {variantOptions.map((opt, i) => (
                      <div key={i} className="grid grid-cols-[1fr_120px_90px_32px] gap-2 items-center">
                        <input
                          value={opt.value}
                          onChange={e => updateOption(i, "value", e.target.value)}
                          type="text"
                          placeholder="Contoh: S, M, L"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-green-400"
                        />
                        <input
                          value={opt.price}
                          onChange={e => updateOption(i, "price", e.target.value)}
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-green-400"
                        />
                        <input
                          value={opt.stock}
                          onChange={e => updateOption(i, "stock", e.target.value)}
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-green-400"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(i)}
                          disabled={variantOptions.length <= 1}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {(errors.variant_options || errors.variant_price || errors.variant_stock) && (
                    <p className="text-xs text-red-500">{errors.variant_options || errors.variant_price || errors.variant_stock}</p>
                  )}

                  {/* Add option button */}
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800 px-3 py-2 rounded-lg border border-dashed border-green-300 hover:border-green-400 hover:bg-green-50 transition-colors w-full justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Tambah Opsi
                  </button>
                </div>
              </div>
            )}
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
                price: hasVariant
                  ? (variantOptions[0]?.price ? Number(variantOptions[0].price) : 0)
                  : (form.price || 0),
                slug: "preview",
                primary_image: photoPreviews[0] ? { file_path: photoPreviews[0] } : null,
              }} compact />
            </div>
            {hasVariant && variantOptions.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 mb-1.5">Varian: {variantName || "—"}</p>
                <div className="flex flex-wrap gap-1">
                  {variantOptions.filter(o => o.value.trim()).map((o, i) => (
                    <span key={i} className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-green-50 text-green-700 border border-green-200">
                      {o.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
