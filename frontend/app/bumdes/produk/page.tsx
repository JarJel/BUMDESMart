"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/axios";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { getFileUrl } from "@/lib/storage";

interface ProductData {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  status: string;
  has_variant: boolean;
  category?: { id: number; name: string };
  umkmProfile?: { id: number; shop_name: string; owner_name: string };
  images?: { file_path: string }[];
  primary_image?: { file_path: string };
  variants?: {
    id: number;
    name: string;
    options?: {
      id: number;
      value: string;
      price?: number;
      price_adjustment?: number;
      stock?: number;
      weight?: number;
    }[];
  }[];
  description?: string;
  weight?: number;
}

const STATUS_MAP: Record<string, string> = {
  active: "Aktif",
  inactive: "Arsip",
  draft: "Draft",
};

const statusBadge: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  draft: "bg-yellow-50 text-yellow-700",
};

export default function AdminBumdesProdukPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailProduct, setDetailProduct] = useState<ProductData | null>(null);
  const toast = useToast();

  const fetchProducts = () => {
    setLoading(true);
    api.get(`/admin/products`, { params: { search, page } })
      .then(res => {
        setProducts(res.data.data ?? []);
        setLastPage(res.data.meta?.last_page ?? 1);
        setTotal(res.data.meta?.total ?? 0);
      })
      .catch(() => {
        setProducts([]);
        toast.error("Gagal memuat data produk.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // debounce search
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const getImageUrl = (p: ProductData) => {
    const path = p.primary_image?.file_path ?? p.images?.[0]?.file_path;
    return getFileUrl(path);
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/products/${confirmDeleteId}`);
      toast.success("Produk berhasil dihapus.");
      setConfirmDeleteId(null);
      fetchProducts();
    } catch {
      toast.error("Gagal menghapus produk.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kelola Produk UMKM</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pantau dan kelola semua produk dari seluruh mitra UMKM</p>
        </div>

        {/* Search */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              placeholder="Cari nama produk atau nama toko..." 
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-400" 
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-sm text-gray-400">Memuat produk...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400">
              Tidak ada produk yang ditemukan.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 text-left">
                  <th className="px-4 py-3 font-medium">Produk</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">UMKM / Toko</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Kategori</th>
                  <th className="px-4 py-3 font-medium text-right">Harga</th>
                  <th className="px-4 py-3 font-medium text-center hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const imgUrl = getImageUrl(p);
                  const statusLabel = STATUS_MAP[p.status] ?? p.status;
                  const badgeClass = statusBadge[p.status] ?? "bg-gray-100 text-gray-500";

                  // Compute display price
                  const allOptions = (p.variants ?? []).flatMap(v => v.options ?? []);
                  const isVariant = p.has_variant && allOptions.length > 0;
                  let displayPrice: string;

                  if (isVariant) {
                    const prices = allOptions.map(o => Number(o.price ?? o.price_adjustment ?? 0));
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);
                    displayPrice = minPrice === maxPrice
                      ? `Rp ${minPrice.toLocaleString("id")}`
                      : `Rp ${minPrice.toLocaleString("id")} – ${maxPrice.toLocaleString("id")}`;
                  } else {
                    displayPrice = `Rp ${Number(p.price).toLocaleString("id")}`;
                  }

                  return (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                            {imgUrl ? (
                              <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
                            ) : (
                              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-xs line-clamp-1">{p.name}</p>
                            <p className="text-gray-400 text-xs md:hidden mt-0.5">{p.umkmProfile?.shop_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-xs font-semibold text-gray-700">{p.umkmProfile?.shop_name}</p>
                        <p className="text-[10px] text-gray-500">{p.umkmProfile?.owner_name}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--primary-muted)", color: "var(--primary)" }}>
                          {p.category?.name ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900">
                        {displayPrice}
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>{statusLabel}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setDetailProduct(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Detail Produk">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(p.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40"
                            title="Hapus Produk"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          
          {/* Pagination */}
          {!loading && products.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-500">Total {total} produk</p>
              <div className="flex items-center gap-2">
                <button 
                  disabled={page <= 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium disabled:opacity-50 hover:bg-gray-50"
                >
                  Sebelumnya
                </button>
                <span className="text-xs text-gray-600 font-medium px-2">Hal {page} dari {lastPage}</span>
                <button 
                  disabled={page >= lastPage} 
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium disabled:opacity-50 hover:bg-gray-50"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Hapus Produk UMKM"
        description="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan dan produk akan hilang dari katalog pembeli."
        confirmLabel="Ya, Hapus"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmDeleteId(null)}
      />

      {/* Modal Detail */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) setDetailProduct(null) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Detail Produk</h2>
              <button onClick={() => setDetailProduct(null)} className="p-1 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex items-start gap-4 mb-5 pb-5 border-b border-gray-100">
              <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                {getImageUrl(detailProduct) ? (
                  <img src={getImageUrl(detailProduct)!} alt={detailProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-snug">{detailProduct.name}</h3>
                <p className="text-xs text-gray-500 mt-1">Oleh: <span className="font-semibold text-gray-700">{detailProduct.umkmProfile?.shop_name}</span></p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge[detailProduct.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {STATUS_MAP[detailProduct.status] ?? detailProduct.status}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {detailProduct.category?.name ?? "Tanpa Kategori"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-900 mb-1">Deskripsi Produk</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{detailProduct.description || "Tidak ada deskripsi."}</p>
              </div>

              {!detailProduct.has_variant && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Harga</p>
                    <p className="text-sm font-semibold text-gray-900">Rp {Number(detailProduct.price).toLocaleString("id")}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Stok & Berat</p>
                    <p className="text-sm font-semibold text-gray-900">{detailProduct.stock} pcs • {detailProduct.weight} gr</p>
                  </div>
                </div>
              )}

              {detailProduct.has_variant && detailProduct.variants && detailProduct.variants.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-900 mb-2">Varian Produk</p>
                  <div className="space-y-2">
                    {detailProduct.variants.map((v, i) => (
                      <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-700">{v.name}</p>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {(v.options ?? []).map((o, j) => (
                            <div key={j} className="flex justify-between items-center px-3 py-2 text-xs">
                              <span className="font-medium text-gray-900">{o.value}</span>
                              <div className="flex gap-4 text-right">
                                <span className="text-gray-500">{o.stock} pcs</span>
                                <span className="font-semibold text-green-700">Rp {Number(o.price ?? o.price_adjustment ?? 0).toLocaleString("id")}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setDetailProduct(null)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                Tutup
              </button>
              <button 
                onClick={() => {
                  setConfirmDeleteId(detailProduct.id);
                  setDetailProduct(null);
                }} 
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Hapus Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
