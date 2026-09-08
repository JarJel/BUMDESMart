"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import { getFileUrl } from "@/lib/storage";

/* ─── Types ─── */
interface Discount {
  id: number;
  product_id: number;
  type: "percentage" | "nominal";
  value: string;
  start_date: string | null;
  end_date: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  discounted_price: number;
  product: { id: number; name: string; price: string };
}

interface Product {
  id: number;
  name: string;
  price: string;
  status: string;
  has_variant?: boolean;
  variants?: {
    id: number;
    name: string;
    options?: { id: number; value?: string; price?: string | number; price_adjustment?: string | number; stock?: number }[];
  }[];
  primary_image?: { file_path: string } | null;
  images?: { file_path: string }[];
}

const FILTER_TABS = [
  { key: "semua", label: "Semua" },
  { key: "aktif", label: "Aktif" },
  { key: "nonaktif", label: "Nonaktif" },
  { key: "kadaluarsa", label: "Kadaluarsa" },
];

const emptyForm = {
  product_id: "",
  type: "percentage" as "percentage" | "nominal",
  value: "",
  start_date: "",
  end_date: "",
  max_uses: "",
};

/* ─── Helpers ─── */
const fmt = (n: number | string) =>
  `Rp ${Number(n).toLocaleString("id-ID")}`;

const getProductPriceDisplay = (p: Product) => {
  const allOptions = (p.variants ?? []).flatMap((v) => v.options ?? []);
  if (p.has_variant && allOptions.length > 0) {
    const prices = allOptions.map((o) => Number(o.price ?? o.price_adjustment ?? 0));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return minPrice === maxPrice
      ? `Rp ${minPrice.toLocaleString("id-ID")}`
      : `Rp ${minPrice.toLocaleString("id-ID")} – ${maxPrice.toLocaleString("id-ID")}`;
  }
  return `Rp ${Number(p.price || 0).toLocaleString("id-ID")}`;
};

const badge = (d: Discount) => {
  if (!d.is_active)
    return { label: "Nonaktif", cls: "bg-gray-100 text-gray-500" };
  if (d.end_date && new Date(d.end_date) < new Date())
    return { label: "Kadaluarsa", cls: "bg-red-50 text-red-600" };
  return { label: "Aktif", cls: "bg-green-50 text-green-700" };
};

/* ─── Custom Product Select Component ─── */
function ProductSelectDropdown({
  products,
  value,
  onChange,
}: {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const preparedProducts = useMemo(() => {
    return products.map((p) => {
      const imgPath = p.primary_image?.file_path ?? p.images?.[0]?.file_path;
      return {
        ...p,
        imgUrl: imgPath ? getFileUrl(imgPath) : null,
        priceText: getProductPriceDisplay(p),
      };
    });
  }, [products]);

  const selectedProduct = useMemo(
    () => preparedProducts.find((p) => String(p.id) === value),
    [preparedProducts, value]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside, { passive: true });
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return preparedProducts;
    const lower = search.toLowerCase();
    return preparedProducts.filter((p) => p.name.toLowerCase().includes(lower));
  }, [preparedProducts, search]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm border rounded-xl bg-gray-50 transition-all text-left ${
          isOpen
            ? "border-green-500 ring-2 ring-green-500/20 bg-white"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        {selectedProduct ? (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100 flex items-center justify-center">
              {selectedProduct.imgUrl ? (
                <img src={selectedProduct.imgUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-xs truncate">{selectedProduct.name}</p>
              <p className="text-[11px] font-medium text-green-700">{selectedProduct.priceText}</p>
            </div>
            {selectedProduct.has_variant && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                Varian
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-xs">-- Pilih Produk --</span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-green-600" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Hidden input for HTML form handling */}
      <input type="hidden" name="product_id" value={value} required />

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {products.length > 5 && (
            <div className="p-2 border-b border-gray-50 bg-gray-50/50">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama produk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                  autoFocus
                />
                <svg
                  className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 p-1 overscroll-contain">
            {filteredProducts.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">Tidak ada produk ditemukan</div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = String(p.id) === value;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange(String(p.id));
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition-colors ${
                      isSelected ? "bg-green-50/80 text-green-900" : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100 flex items-center justify-center">
                        {p.imgUrl ? (
                          <img src={p.imgUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs truncate ${isSelected ? "font-bold text-green-900" : "font-semibold text-gray-800"}`}>
                          {p.name}
                        </p>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">{p.priceText}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.has_variant && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                          Varian
                        </span>
                      )}
                      {isSelected && (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Modal Form ─── */
function DiscountModal({
  products,
  editing,
  onClose,
  onSaved,
}: {
  products: Product[];
  editing: Discount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!editing;
  const isLocked = isEdit && editing!.used_count > 0;
  const toast = useToast();

  const [form, setForm] = useState(
    isEdit
      ? {
          product_id: String(editing!.product_id),
          type: editing!.type,
          value: editing!.value,
          start_date: editing!.start_date?.slice(0, 10) ?? "",
          end_date: editing!.end_date?.slice(0, 10) ?? "",
          max_uses: editing!.max_uses != null ? String(editing!.max_uses) : "",
        }
      : emptyForm
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id) {
      setError("Silakan pilih produk terlebih dahulu.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        end_date: form.end_date || null,
      };

      if (!isLocked) {
        body.start_date = form.start_date || null;
        body.type = form.type;
        body.value = Number(form.value);
      }

      if (!isEdit) {
        body.product_id = Number(form.product_id);
      }

      if (isEdit) {
        await api.put(`/seller/discounts/${editing!.id}`, body);
        toast.success("Diskon berhasil diubah");
      } else {
        await api.post("/seller/discounts", body);
        toast.success("Diskon berhasil ditambahkan");
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const errs = err.response?.data?.errors;
      if (errs) {
        setError(Object.values(errs).flat().join(", "));
      } else {
        setError(
          err.response?.data?.message ?? err.response?.data?.error ?? "Terjadi kesalahan. Coba lagi."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-gray-900">
            {isEdit ? "Edit Diskon" : "Tambah Diskon"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          {isLocked && (
            <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-xs text-yellow-700">
              Diskon ini sudah pernah digunakan. Hanya <strong>maks. penggunaan</strong>, <strong>tanggal berakhir</strong>, dan <strong>status aktif</strong> yang bisa diubah.
            </div>
          )}

          {/* Produk — hanya saat tambah */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Produk <span className="text-red-500">*</span>
              </label>
              <ProductSelectDropdown
                products={products}
                value={form.product_id}
                onChange={(id) => setForm((prev) => ({ ...prev, product_id: id }))}
              />
            </div>
          )}

          {/* Tipe & Nilai — non-edit atau belum pernah dipakai */}
          {!isLocked && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tipe Diskon <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  {(["percentage", "nominal"] as const).map((t) => (
                    <label
                      key={t}
                      className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors ${
                        form.type === t
                          ? "border-green-400 bg-green-50 text-green-700 font-semibold"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={t}
                        checked={form.type === t}
                        onChange={handleChange}
                        className="accent-green-600"
                      />
                      {t === "percentage" ? "Persentase (%)" : "Nominal (Rp)"}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nilai Diskon <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                    {form.type === "percentage" ? "%" : "Rp"}
                  </span>
                  <input
                    type="number"
                    name="value"
                    value={form.value}
                    onChange={handleChange}
                    required
                    min={1}
                    max={form.type === "percentage" ? 100 : undefined}
                    placeholder={form.type === "percentage" ? "Mis: 20" : "Mis: 10000"}
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tanggal Mulai <span className="text-xs text-gray-400">(opsional)</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tanggal Berakhir <span className="text-xs text-gray-400">(opsional)</span>
            </label>
            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Maks. Penggunaan <span className="text-xs text-gray-400">(opsional)</span>
            </label>
            <input
              type="number"
              name="max_uses"
              value={form.max_uses}
              onChange={handleChange}
              min={1}
              max={2147483647}
              placeholder="Mis: 50, kosongkan = unlimited"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--primary)" }}
            >
              {submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Diskon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function DiskonPage() {
  const [filter, setFilter] = useState("semua");
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const toast = useToast();
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/seller/discounts?filter=${filter}`);
      setDiscounts(res.data.data?.data ?? []);
    } catch {
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/seller/products?per_page=100");
      const all: Product[] = res.data.data?.data ?? [];
      setProducts(all.filter((p) => p.status === "active"));
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [filter]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
    if (deleteConfirmId === null) return;
    const id = deleteConfirmId;
    setDeleting(id);
    try {
      await api.delete(`/seller/discounts/${id}`);
      toast.success("Diskon berhasil dihapus");
      fetchDiscounts();
    } catch {
      toast.error("Gagal menghapus diskon");
    } finally {
      setDeleting(null);
      setDeleteConfirmId(null);
    }
  };

  const handleToggle = async (id: number) => {
    setToggling(id);
    try {
      await api.patch(`/seller/discounts/${id}/toggle`);
      toast.success("Status diskon berhasil diubah");
      fetchDiscounts();
    } catch {
      toast.error("Gagal mengubah status diskon");
    } finally {
      setToggling(null);
    }
  };

  const openAdd = () => {
    if (products.length === 0) {
      toast.warning("Anda harus memiliki produk yang aktif terlebih dahulu sebelum membuat diskon.");
      return;
    }
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (d: Discount) => {
    setEditing(d);
    setShowModal(true);
  };

  return (
    <>
      {showModal && (
        <DiscountModal
          products={products}
          editing={editing}
          onClose={() => setShowModal(false)}
          onSaved={fetchDiscounts}
        />
      )}

      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Diskon</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Kelola program diskon untuk produk toko kamu
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: "var(--primary)" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Tambah Diskon
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 border-b border-gray-100">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-sm text-gray-400">
              Memuat data diskon...
            </div>
          ) : discounts.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-400">Belum ada diskon.</p>
              <button
                onClick={openAdd}
                className="text-sm font-semibold hover:underline"
                style={{ color: "var(--primary)" }}
              >
                Buat diskon pertamamu →
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                  <th className="text-left px-5 py-3 font-medium">Produk</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                    Tipe
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    Nilai / Harga Akhir
                  </th>
                  <th className="text-center px-4 py-3 font-medium hidden lg:table-cell">
                    Masa Berlaku
                  </th>
                  <th className="text-center px-4 py-3 font-medium hidden lg:table-cell">
                    Penggunaan
                  </th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => {
                  const b = badge(d);
                  const isExpired =
                    d.end_date && new Date(d.end_date) < new Date();
                  return (
                    <tr
                      key={d.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                    >
                      {/* Produk */}
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 text-xs line-clamp-1">
                          {d.product?.name ?? "Produk Terhapus"}
                        </p>
                        {d.product && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Harga asli: {fmt(d.product.price)}
                          </p>
                        )}
                      </td>

                      {/* Tipe */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                          {d.type === "percentage"
                            ? `${Number(d.value)}%`
                            : `Rp ${Number(d.value).toLocaleString("id-ID")}`}
                        </span>
                      </td>

                      {/* Nilai */}
                      <td className="px-4 py-3 text-right">
                        <p className="text-xs font-bold text-green-700">
                          {fmt(d.discounted_price)}
                        </p>
                        {d.product && (
                          <p className="text-xs text-gray-400 line-through">
                            {fmt(d.product.price)}
                          </p>
                        )}
                      </td>

                      {/* Masa Berlaku */}
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <p className="text-xs text-gray-600">
                          {d.start_date
                            ? new Date(d.start_date).toLocaleDateString(
                                "id-ID",
                                { day: "2-digit", month: "short", year: "numeric" }
                              )
                            : "—"}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            isExpired ? "text-red-500" : "text-gray-500"
                          }`}
                        >
                          {d.end_date
                            ? `s/d ${new Date(d.end_date).toLocaleDateString(
                                "id-ID",
                                { day: "2-digit", month: "short", year: "numeric" }
                              )}`
                            : "Tanpa batas"}
                        </p>
                      </td>

                      {/* Penggunaan */}
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <p className="text-xs text-gray-700 font-medium">
                          {d.used_count}
                          {d.max_uses != null && (
                            <span className="text-gray-400">
                              /{d.max_uses}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {d.max_uses == null ? "Unlimited" : "kali"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {isExpired ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">
                              Kadaluarsa
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggle(d.id)}
                              disabled={toggling === d.id}
                              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                              style={{
                                backgroundColor: d.is_active ? "var(--primary)" : "#e5e7eb",
                              }}
                            >
                              <span className="sr-only">Toggle diskon</span>
                              <span
                                className="pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center"
                                style={{
                                  left: d.is_active ? "20px" : "0px",
                                }}
                              >
                                {toggling === d.id && (
                                  <svg className="animate-spin h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                  </svg>
                                )}
                              </span>
                            </button>
                          )}
                          <span className={`text-[10px] font-semibold tracking-wider uppercase ${isExpired ? 'text-red-500' : d.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                            {isExpired ? 'Kadaluarsa' : d.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </td>


                      {/* Aksi */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(d)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>


                          {/* Hapus */}
                          <button
                            onClick={() => handleDelete(d.id)}
                            disabled={deleting === d.id}
                            title="Hapus"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && discounts.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400">
                Menampilkan {discounts.length} diskon
              </p>
            </div>
          )}
        </div>
      </div>
      {deleteConfirmId !== null && (
        <ConfirmDeleteModal
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={executeDelete}
          loading={deleting !== null}
        />
      )}
    </>
  );
}

function ConfirmDeleteModal({
  onClose,
  onConfirm,
  title = "Hapus Diskon",
  message = "Apakah Anda yakin ingin menghapus diskon ini? Tindakan ini tidak dapat dibatalkan.",
  loading = false,
}: {
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 p-6 flex flex-col items-center text-center animate-fade-in">
        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h3 className="font-bold text-gray-900 text-lg mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
        
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
