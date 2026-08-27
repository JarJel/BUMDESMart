"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api/axios";
import { ProductCard } from "@/components/shared/ProductCard";
import { useToast } from "@/components/ui/Toast";
import { compressImage } from "@/lib/utils/compressImage";
import { getFileUrl } from "@/lib/storage";

interface Category { id: number; name: string; slug?: string; children?: Category[]; }

interface ExistingImage {
  id: number;
  file_path: string;
  is_primary?: boolean;
}

interface VariantOptionRow {
  id?: number; // existing option id from server
  value: string;
  description: string;
  price: string;
  stock: string;
  weight: string;
}

const PREDEFINED_VARIANTS: Record<string, { label: string, value: string, isWeight: boolean }[]> = {
  makanan_minuman: [
    { label: "Beda Rasa (Contoh: Pedas, Manis)", value: "Rasa", isWeight: false },
    { label: "Beda Ukuran/Berat (Contoh: 100gr, 500gr)", value: "Ukuran", isWeight: true },
    { label: "Beda Paket (Contoh: Paket A, Paket B)", value: "Paket", isWeight: false },
  ],
  fashion_kerajinan: [
    { label: "Beda Ukuran Size (Contoh: S, M, L)", value: "Size", isWeight: false },
    { label: "Beda Warna (Contoh: Merah, Putih)", value: "Warna", isWeight: false },
    { label: "Beda Motif (Contoh: Bunga, Garis)", value: "Motif", isWeight: false },
  ],
  pertanian_peternakan: [
    { label: "Beda Berat/Volume (Contoh: 1Kg, 5Kg)", value: "Berat", isWeight: true },
    { label: "Beda Grade/Kualitas (Contoh: Super, Standar)", value: "Kualitas", isWeight: false },
  ],
  jasa: [
    { label: "Beda Tipe Layanan (Contoh: Basic, Premium)", value: "Tipe", isWeight: false },
  ]
};

const DEFAULT_VARIANTS = [
  { label: "Beda Rasa (Contoh: Pedas, Manis)", value: "Rasa", isWeight: false },
  { label: "Beda Ukuran/Berat (Contoh: 100gr, 500gr)", value: "Ukuran", isWeight: true },
  { label: "Beda Warna (Contoh: Merah, Putih)", value: "Warna", isWeight: false },
  { label: "Beda Paket (Contoh: Paket A, Paket B)", value: "Paket", isWeight: false },
];

const BUSINESS_CATEGORY_MAP: Record<string, string[]> = {
  makanan_minuman:       ["makanan-minuman"],
  fashion_kerajinan:     ["tekstil-fashion", "kerajinan-tangan"],
  pertanian_peternakan:  ["pertanian-peternakan"],
  jasa:                  ["jasa"],
  perdagangan_umum:      [],
};

function buildCategoryOptions(tree: Category[], businessCategory: string | null) {
  const allowed = businessCategory ? (BUSINESS_CATEGORY_MAP[businessCategory] ?? []) : [];
  const result: { id: number; name: string; group: string }[] = [];

  const fillFrom = (parents: Category[]) => {
    for (const parent of parents) {
      const children = parent.children ?? [];
      if (children.length > 0) {
        for (const child of children) result.push({ id: child.id, name: child.name, group: parent.name });
      } else {
        result.push({ id: parent.id, name: parent.name, group: "" });
      }
    }
  };

  const filtered = allowed.length > 0 ? tree.filter(p => allowed.includes(p.slug ?? "")) : tree;
  fillFrom(filtered);
  if (result.length === 0) fillFrom(tree);
  return result;
}

export default function EditProdukPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const toast = useToast();
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [businessCategory, setBusinessCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    description: "",
    price: "",
    stock: "",
    weight: "",
    status: "active",
    is_pre_order: false,
    pre_order_days: "7",
  });

  // Variant state
  const [hasVariant, setHasVariant] = useState(false);
  const [variantType, setVariantType] = useState("");
  const [customVariantName, setCustomVariantName] = useState("");
  const [customIsWeight, setCustomIsWeight] = useState(false);
  const [variantOptions, setVariantOptions] = useState<VariantOptionRow[]>([
    { value: "", description: "", price: "", stock: "", weight: "" },
  ]);
  const [deletedOptionIds, setDeletedOptionIds] = useState<number[]>([]);

  // Foto yang sudah ada di server
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);

  // Foto baru yang ditambahkan
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Category[] }>("/categories"),
      api.get(`/seller/products/${id}`),
      api.get<{ data: { umkm_profile?: { business_category?: string } } }>("/profile"),
    ]).then(([catRes, prodRes, profileRes]) => {
      setCategoryTree(catRes.data.data ?? []);
      setBusinessCategory(profileRes.data.data?.umkm_profile?.business_category ?? null);

      const p = prodRes.data.data ?? prodRes.data;
      setForm({
        name: p.name ?? "",
        category_id: p.category_id?.toString() ?? "",
        description: p.description ?? "",
        price: p.price?.toString() ?? "",
        stock: p.stock?.toString() ?? "",
        weight: p.weight?.toString() ?? "",
        status: p.status ?? "active",
        is_pre_order: p.is_pre_order ?? false,
        pre_order_days: p.pre_order_days?.toString() ?? "7",
      });

      const imgs: ExistingImage[] = (p.images ?? []).map((img: any) => ({
        id: img.id,
        file_path: img.file_path,
        is_primary: img.is_primary ?? false,
      }));
      // Sort: primary first
      imgs.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
      setExistingImages(imgs);

      // Load variant data
      const hasVar = p.has_variant ?? false;
      setHasVariant(hasVar);
      if (hasVar && p.variants && p.variants.length > 0) {
        const firstVariant = p.variants[0];
        const loadedName = firstVariant.name ?? "";
        
        // Find if loadedName matches predefined
        let foundPredefined = false;
        let isWeight = false;
        
        const allOpts = PREDEFINED_VARIANTS[profileRes.data.data?.umkm_profile?.business_category ?? ""] || DEFAULT_VARIANTS;
        for (const o of allOpts) {
          if (o.value === loadedName) {
            foundPredefined = true;
            isWeight = o.isWeight;
            break;
          }
        }
        
        if (foundPredefined) {
          setVariantType(loadedName);
        } else {
          setVariantType("custom");
          setCustomVariantName(loadedName);
          // Auto detect if weights were different in existing options, else default false
          const hasDifferentWeights = firstVariant.options?.some((o: any) => Number(o.weight) > 0) ?? false;
          setCustomIsWeight(hasDifferentWeights);
        }

        const opts: VariantOptionRow[] = (firstVariant.options ?? []).map((opt: any) => ({
          id: opt.id,
          value: opt.value ?? "",
          description: opt.description ?? "",
          price: opt.price?.toString() ?? "",
          stock: opt.stock?.toString() ?? "",
          weight: opt.weight?.toString() ?? "",
        }));
        if (opts.length > 0) {
          setVariantOptions(opts);
        }
      }
    }).catch(() => {
      toast.error("Gagal memuat data produk.");
    }).finally(() => setLoading(false));
  }, [id]);

  const setField = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const removeExisting = (imgId: number) => {
    setExistingImages(prev => prev.filter(i => i.id !== imgId));
    setRemovedImageIds(prev => [...prev, imgId]);
  };

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const totalSlots = existingImages.length + newPhotos.length;
    const remaining = 5 - totalSlots;
    const toAdd = files.slice(0, remaining);

    for (const f of toAdd) {
      try {
        const compressed = await compressImage(f);
        setNewPhotos(prev => [...prev, compressed]);
        const reader = new FileReader();
        reader.onload = ev => setNewPhotoPreviews(prev => [...prev, ev.target?.result as string]);
        reader.readAsDataURL(compressed);
      } catch {
        toast.error(`Gagal memproses gambar: ${f.name}`);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNew = (idx: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== idx));
    setNewPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // Variant option helpers
  const getPredefinedOptions = () => {
    return PREDEFINED_VARIANTS[businessCategory || ""] || DEFAULT_VARIANTS;
  };
  
  const isWeightVariant = () => {
    if (variantType === "custom") return customIsWeight;
    const predefined = getPredefinedOptions().find(o => o.value === variantType);
    return predefined ? predefined.isWeight : false;
  };

  const finalVariantName = variantType === "custom" ? customVariantName : variantType;

  const addOption = () => {
    setVariantOptions(prev => [...prev, { value: "", description: "", price: "", stock: "", weight: "" }]);
  };

  const removeOption = (idx: number) => {
    if (variantOptions.length <= 1) return;
    const opt = variantOptions[idx];
    if (opt.id) {
      setDeletedOptionIds(prev => [...prev, opt.id!]);
    }
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
    else if (Number(form.weight) > 999999) e.weight = "Berat maksimal 999.999 gram (±1 ton)";

    if (form.is_pre_order) {
      if (!form.pre_order_days || Number(form.pre_order_days) < 1) {
        e.pre_order_days = "Waktu pre-order wajib diisi dan minimal 1 hari";
      }
    }

    if (hasVariant) {
      if (!finalVariantName.trim()) e.variant_name = "Nama variasi belum dipilih/diisi";
      const hasEmptyOption = variantOptions.some(opt => !opt.value.trim());
      const hasInvalidPrice = variantOptions.some(opt => !opt.price || Number(opt.price) <= 0);
      const hasInvalidStock = variantOptions.some(opt => opt.stock === "" || Number(opt.stock) < 0);
      const hasInvalidWeight = isWeightVariant() && variantOptions.some(opt => !opt.weight || Number(opt.weight) <= 0);
      
      if (hasEmptyOption) e.variant_options = "Semua pilihan harus punya nama";
      if (hasInvalidPrice) e.variant_price = "Harga setiap pilihan harus lebih dari 0";
      if (hasInvalidStock) e.variant_stock = "Stok setiap pilihan tidak boleh negatif";
      if (hasInvalidWeight) e.variant_weight = "Berat aktual setiap pilihan wajib diisi jika beda ukuran";
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
    fd.append("_method", "PUT"); // Laravel multipart PUT spoofing
    fd.append("name", form.name);
    fd.append("category_id", form.category_id);
    fd.append("description", form.description);
    fd.append("weight", form.weight);
    fd.append("status", statusOverride ?? form.status);
    fd.append("is_pre_order", form.is_pre_order ? "1" : "0");
    if (form.is_pre_order) {
      fd.append("pre_order_days", form.pre_order_days);
    }
    newPhotos.forEach(f => fd.append("images[]", f));
    removedImageIds.forEach(rid => fd.append("delete_image_ids[]", rid.toString()));

    if (hasVariant) {
      fd.append("has_variant", "1");
      fd.append("variant[name]", finalVariantName);
      variantOptions.forEach((opt, i) => {
        if (opt.id) {
          fd.append(`variant[options][${i}][id]`, opt.id.toString());
        }
        fd.append(`variant[options][${i}][value]`, opt.value);
        fd.append(`variant[options][${i}][description]`, opt.description);
        fd.append(`variant[options][${i}][price]`, opt.price);
        fd.append(`variant[options][${i}][stock]`, opt.stock);
        if (isWeightVariant()) {
          fd.append(`variant[options][${i}][weight]`, opt.weight);
        }
      });
      deletedOptionIds.forEach((did, i) => {
        fd.append(`variant[delete_option_ids][${i}]`, did.toString());
      });
    } else {
      fd.append("has_variant", "0");
      fd.append("price", form.price);
      fd.append("stock", form.stock);
    }

    try {
      await api.post(`/seller/products/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Produk berhasil diperbarui!");
      setTimeout(() => router.push("/seller/produk"), 1200);
    } catch (e: any) {
      const apiErrors = e.response?.data?.errors ?? {};
      const mapped: Record<string, string> = {};
      Object.entries(apiErrors).forEach(([k, v]) => { mapped[k] = (v as string[])[0]; });
      if (Object.keys(mapped).length > 0) {
        setErrors(mapped);
      } else {
        toast.error(e.response?.data?.error ?? e.response?.data?.message ?? "Gagal menyimpan produk.");
      }
    } finally {
      setSaving(false);
    }
  };

  const totalPhotos = existingImages.length + newPhotos.length;
  const primaryPreviewUrl = existingImages[0]
    ? (getFileUrl(existingImages[0].file_path))
    : newPhotoPreviews[0] ?? null;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-60">
        <p className="text-sm text-gray-400">Memuat data produk...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/seller/produk" className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Produk</h1>
          <p className="text-sm text-gray-500 mt-0.5">Perbarui informasi produk kamu</p>
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
              <input value={form.name} onChange={setField("name")} type="text" placeholder="Nama produk"
                className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 ${errors.name ? "border-red-300" : "border-gray-200"}`} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Kategori <span className="text-red-500">*</span></label>
              <select value={form.category_id} onChange={setField("category_id")}
                className={`w-full text-sm border rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-green-400 ${errors.category_id ? "border-red-300" : "border-gray-200"}`}>
                <option value="">Pilih Kategori</option>
                {Object.entries(
                  buildCategoryOptions(categoryTree, businessCategory).reduce<Record<string, { id: number; name: string; group: string }[]>>((acc, c) => {
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
              <span className="text-xs text-gray-400">{totalPhotos}/5 foto</span>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {/* Foto existing */}
              {existingImages.map((img, i) => {
                const url = getFileUrl(img.file_path) ?? "";
                return (
                  <div key={`ex-${img.id}`} className="aspect-square rounded-xl overflow-hidden relative group border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-medium">Utama</span>
                    )}
                    <button
                      onClick={() => removeExisting(img.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                );
              })}

              {/* Foto baru */}
              {newPhotoPreviews.map((src, i) => (
                <div key={`new-${i}`} className="aspect-square rounded-xl overflow-hidden relative group border border-gray-200 border-dashed">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {existingImages.length === 0 && i === 0 && (
                    <span className="absolute top-1 left-1 text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-medium">Utama</span>
                  )}
                  <button
                    onClick={() => removeNew(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}

              {/* Slot tambah */}
              {totalPhotos < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:border-green-400 hover:bg-green-50/50 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  <span className="text-xs text-gray-300 mt-1">Tambah</span>
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
                  <input value={form.weight} onChange={setField("weight")} type="number" min="1" max="999999" placeholder="200"
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 ${errors.weight ? "border-red-300" : "border-gray-200"}`} />
                  {errors.weight && <p className="text-xs text-red-500 mt-1">{errors.weight}</p>}
                </div>
              </div>
            )}

            {/* Variant section */}
            {hasVariant && (
              <div className="space-y-4">
                
                {/* Variant name dropdown */}
                <div className="bg-green-50/50 rounded-2xl border border-green-100 p-5 space-y-5">
                  <div>
                    <label className="text-sm font-bold text-gray-800 mb-2 block">Produk ini dibedakan berdasarkan apa? <span className="text-red-500">*</span></label>
                    <select
                      value={variantType}
                      onChange={e => {
                        setVariantType(e.target.value);
                        setErrors(prev => ({...prev, variant_name: ""}));
                      }}
                      className={`w-full text-sm border rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-green-400 ${errors.variant_name ? "border-red-300" : "border-gray-200"}`}
                    >
                      <option value="">-- Pilih Variasi --</option>
                      {getPredefinedOptions().map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                      <option value="custom">Beda Lainnya (Ketik Sendiri...)</option>
                    </select>
                    {errors.variant_name && <p className="text-xs text-red-500 mt-1">{errors.variant_name}</p>}
                  </div>

                  {variantType === "custom" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Nama Pembeda <span className="text-red-500">*</span></label>
                        <input
                          value={customVariantName}
                          onChange={e => setCustomVariantName(e.target.value)}
                          type="text"
                          placeholder="Contoh: Motif Sablon"
                          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-green-400"
                        />
                      </div>
                      <label className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-green-200 transition-colors">
                        <div className="flex items-center h-5 mt-0.5">
                          <input
                            type="checkbox"
                            checked={customIsWeight}
                            onChange={(e) => setCustomIsWeight(e.target.checked)}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Setiap pilihan memiliki berat yang berbeda</p>
                          <p className="text-xs text-gray-500 mt-0.5">Centang ini jika berat masing-masing pilihan tidak sama (mempengaruhi ongkir).</p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Berat Utama (jika varian bukan berat) */}
                  {!isWeightVariant() && (
                    <div className="pt-2 border-t border-green-200/50">
                      <label className="text-sm font-bold text-gray-800 mb-1.5 block">Berat Utama Produk <span className="text-red-500">*</span></label>
                      <p className="text-xs text-gray-500 mb-3">Karena pilihan di atas tidak mempengaruhi berat, silakan isi berat produk secara umum di sini.</p>
                      <div className="max-w-xs relative">
                        <input value={form.weight} onChange={setField("weight")} type="number" min="1" max="999999" placeholder="200"
                          className={`w-full text-sm border rounded-xl px-4 py-3 focus:outline-none focus:border-green-400 ${errors.weight ? "border-red-300" : "border-gray-200"}`} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Gram</span>
                      </div>
                      {errors.weight && <p className="text-xs text-red-500 mt-1">{errors.weight}</p>}
                    </div>
                  )}
                </div>

                {/* Options list as Cards */}
                {variantType && (
                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-bold text-gray-800">Daftar Pilihan Produk</h3>
                    
                    <div className="space-y-4">
                      {variantOptions.map((opt, i) => (
                        <div key={opt.id ?? `new-${i}`} className="bg-white border-2 border-gray-100 rounded-2xl p-5 relative shadow-sm hover:border-green-100 transition-colors">
                          <button
                            type="button"
                            onClick={() => removeOption(i)}
                            disabled={variantOptions.length <= 1}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                          
                          <div className="space-y-4 pr-10">
                            <div>
                              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Nama Pilihan <span className="text-red-500">*</span></label>
                              <input
                                value={opt.value}
                                onChange={e => updateOption(i, "value", e.target.value)}
                                type="text"
                                placeholder="Contoh: Pedas, Manis, dll"
                                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Harga Jual (Rp) <span className="text-red-500">*</span></label>
                                <input
                                  value={opt.price}
                                  onChange={e => updateOption(i, "price", e.target.value)}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Jumlah Stok <span className="text-red-500">*</span></label>
                                <input
                                  value={opt.stock}
                                  onChange={e => updateOption(i, "stock", e.target.value)}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                                />
                              </div>
                            </div>

                            {isWeightVariant() && (
                              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Berat Aktual (Gram) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                  <input
                                    value={opt.weight}
                                    onChange={e => updateOption(i, "weight", e.target.value)}
                                    type="number"
                                    min="1"
                                    placeholder="Contoh: 250"
                                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-green-50/30 focus:bg-white focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 pr-12"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">Gram</span>
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Keterangan Singkat <span className="text-gray-400 font-normal">(Boleh dikosongkan)</span></label>
                              <input
                                value={opt.description}
                                onChange={e => updateOption(i, "description", e.target.value)}
                                type="text"
                                placeholder="Opsional..."
                                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {(errors.variant_options || errors.variant_price || errors.variant_stock || errors.variant_weight) && (
                      <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                        {errors.variant_options || errors.variant_price || errors.variant_stock || errors.variant_weight}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={addOption}
                      className="flex items-center justify-center gap-2 text-sm font-bold text-green-700 hover:text-green-800 px-4 py-3.5 rounded-2xl border-2 border-dashed border-green-300 hover:border-green-400 hover:bg-green-50 transition-colors w-full"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                      Tambah Pilihan Lain
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sistem Pre-Order */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Sistem Pre-Order</h3>
                  <p className="text-xs text-gray-500">Aktifkan jika produk ini memerlukan waktu produksi/distribusi lebih lama.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, is_pre_order: !prev.is_pre_order }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${form.is_pre_order ? "bg-green-600" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.is_pre_order ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {form.is_pre_order && (
                <div className="max-w-xs mt-3 animate-fadeIn">
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Waktu Pre-Order (Hari) <span className="text-red-500">*</span></label>
                  <input
                    value={form.pre_order_days}
                    onChange={setField("pre_order_days")}
                    type="number"
                    min="1"
                    placeholder="7"
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 ${errors.pre_order_days ? "border-red-300" : "border-gray-200"}`}
                  />
                  {errors.pre_order_days && <p className="text-xs text-red-500 mt-1">{errors.pre_order_days}</p>}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Sidebar */}
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
                primary_image: primaryPreviewUrl ? { file_path: primaryPreviewUrl } : null,
              }} compact />
            </div>
            {hasVariant && variantOptions.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 mb-1.5">Varian: {finalVariantName || "—"}</p>
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
          onClick={() => handleSubmit()}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
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
