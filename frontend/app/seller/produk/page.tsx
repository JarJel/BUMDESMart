"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ProductData } from "@/lib/api/product";
import api from "@/lib/api/axios";

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

const tabs = ["Semua", "Aktif", "Draft", "Arsip"];

export default function ProdukPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Semua");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchProducts = () => {
    setLoading(true);
    api.get<{ data: { data: ProductData[] } }>("/seller/products")
      .then(res => setProducts(res.data.data?.data ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const tabFilter = (p: ProductData) => {
    if (activeTab === "Semua") return true;
    if (activeTab === "Aktif") return p.status === "active";
    if (activeTab === "Draft") return p.status === "draft";
    if (activeTab === "Arsip") return p.status === "inactive";
    return true;
  };

  const filtered = products
    .filter(tabFilter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const tabCount = {
    Semua: products.length,
    Aktif: products.filter(p => p.status === "active").length,
    Draft: products.filter(p => p.status === "draft").length,
    Arsip: products.filter(p => p.status === "inactive").length,
  };

  const toggleSelect = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const allSelected = filtered.length > 0 && filtered.every(p => selected.includes(p.id));

  const getImageUrl = (p: ProductData) => {
    const path = p.primary_image?.file_path ?? p.images?.[0]?.file_path;
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:8000/${path}`;
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produk Saya</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola semua produk toko kamu</p>
        </div>
        <Link href="/seller/produk/tambah" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90" style={{ background: "var(--primary)" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tambah Produk
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {tab}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {tabCount[tab as keyof typeof tabCount]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk..." className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Memuat produk...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">
            {products.length === 0 ? "Belum ada produk. Yuk tambah produk pertamamu!" : "Tidak ada produk yang sesuai filter."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : filtered.map(p => p.id))} className="rounded" />
                </th>
                <th className="text-left px-4 py-3 font-medium">Produk</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Kategori</th>
                <th className="text-right px-4 py-3 font-medium">Harga</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Stok</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const imgUrl = getImageUrl(p);
                const statusLabel = STATUS_MAP[p.status] ?? p.status;
                const badgeClass = statusBadge[p.status] ?? "bg-gray-100 text-gray-500";
                return (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                    </td>
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
                          <p className="text-gray-400 text-xs">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--primary-muted)", color: "var(--primary)" }}>
                        {p.category?.name ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900">
                      Rp {Number(p.price).toLocaleString("id")}
                    </td>
                    <td className="px-4 py-3 text-right text-xs hidden md:table-cell">
                      <span className={p.stock === 0 ? "text-red-500 font-medium" : "text-gray-700"}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>{statusLabel}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/seller/produk/${p.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">Menampilkan {filtered.length} dari {products.length} produk</p>
          </div>
        )}
      </div>
    </div>
  );
}
