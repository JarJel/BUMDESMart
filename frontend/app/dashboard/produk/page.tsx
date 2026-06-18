"use client";

import Link from "next/link";
import { useState } from "react";

const produkData = [
  { id: 1, nama: "Keripik Singkong Original", sku: "KSO-001", kategori: "Makanan & Minuman", harga: 12000, stok: 150, status: "Aktif", terjual: 520 },
  { id: 2, nama: "Keripik Pisang Cokelat", sku: "KPC-002", kategori: "Makanan & Minuman", harga: 15000, stok: 80, status: "Aktif", terjual: 310 },
  { id: 3, nama: "Keripik Singkong Pedas", sku: "KSP-003", kategori: "Makanan & Minuman", harga: 12000, stok: 0, status: "Stok Habis", terjual: 410 },
  { id: 4, nama: "Keripik Balado Manis", sku: "KBM-004", kategori: "Makanan & Minuman", harga: 14000, stok: 60, status: "Aktif", terjual: 180 },
  { id: 5, nama: "Keripik Kentang Spesial", sku: "KKS-005", kategori: "Makanan & Minuman", harga: 18000, stok: 0, status: "Arsip", terjual: 95 },
];

const tabs = ["Semua", "Aktif", "Stok Habis", "Arsip"];
const tabCount = { Semua: 5, Aktif: 3, "Stok Habis": 1, Arsip: 1 };

const statusBadge: Record<string, string> = {
  Aktif: "bg-green-50 text-green-700",
  "Stok Habis": "bg-red-50 text-red-600",
  Arsip: "bg-gray-100 text-gray-500",
};

export default function ProdukPage() {
  const [activeTab, setActiveTab] = useState("Semua");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  const filtered = produkData.filter((p) => {
    const matchTab = activeTab === "Semua" || p.status === activeTab;
    const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const toggleSelect = (id: number) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const allSelected = filtered.length > 0 && filtered.every((p) => selected.includes(p.id));

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produk Saya</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola semua produk toko Anda</p>
        </div>
        <Link href="/dashboard/produk/tambah" className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90" style={{ background: "var(--primary)" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tambah Produk
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {tabCount[tab as keyof typeof tabCount]}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk..." className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-400" />
        </div>
        <select className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600">
          <option>Semua Kategori</option>
          <option>Makanan & Minuman</option>
        </select>
        <select className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600">
          <option>Urutkan: Terlaris</option>
          <option>Harga Terendah</option>
          <option>Stok Terendah</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : filtered.map((p) => p.id))} className="rounded" />
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
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--primary-muted)" }}>
                      <svg className="w-5 h-5" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-xs">{p.nama}</p>
                      <p className="text-gray-400 text-xs">{p.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--primary-muted)", color: "var(--primary)" }}>{p.kategori}</span>
                </td>
                <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900">Rp {p.harga.toLocaleString("id")}</td>
                <td className="px-4 py-3 text-right text-xs hidden md:table-cell">
                  <span className={p.stok === 0 ? "text-red-500 font-medium" : "text-gray-700"}>{p.stok}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
          <p className="text-xs text-gray-400">Menampilkan {filtered.length} dari {produkData.length} produk</p>
          <div className="flex gap-1">
            {[1,2,3].map((n) => (
              <button key={n} className={`w-7 h-7 rounded-lg text-xs font-medium ${n === 1 ? "text-white" : "text-gray-500 hover:bg-gray-50"}`} style={n === 1 ? { background: "var(--primary)" } : {}}>{n}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}