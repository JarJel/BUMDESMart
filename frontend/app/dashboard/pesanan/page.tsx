"use client";
import { useState } from "react";

const orders = [
  { id: "ORD-001", pelanggan: "Rina Kartika", produk: "Keripik Singkong Original x2", alamat: "Jl. Melati No. 5, Bandung", total: 24000, status: "Baru", tanggal: "17 Jun 2026" },
  { id: "ORD-002", pelanggan: "Budi Santoso", produk: "Keripik Pisang Cokelat x1", alamat: "Jl. Mawar No. 12, Bandung", total: 15000, status: "Diproses", tanggal: "17 Jun 2026" },
  { id: "ORD-003", pelanggan: "Sari Dewi", produk: "Keripik Singkong Pedas x3", alamat: "Jl. Anggrek No. 8, Bandung", total: 36000, status: "Dikirim", tanggal: "16 Jun 2026" },
  { id: "ORD-004", pelanggan: "Ahmad Yusuf", produk: "Keripik Singkong Original x1", alamat: "Jl. Kenanga No. 3, Bandung", total: 12000, status: "Selesai", tanggal: "15 Jun 2026" },
  { id: "ORD-005", pelanggan: "Dewi Rahayu", produk: "Keripik Pisang Cokelat x2", alamat: "Jl. Dahlia No. 7, Bandung", total: 30000, status: "Dibatalkan", tanggal: "14 Jun 2026" },
];

const tabs = ["Semua", "Baru", "Diproses", "Dikirim", "Selesai", "Dibatalkan"];
const statusColor: Record<string, string> = {
  Baru: "bg-blue-50 text-blue-600",
  Diproses: "bg-yellow-50 text-yellow-700",
  Dikirim: "bg-purple-50 text-purple-600",
  Selesai: "bg-green-50 text-green-700",
  Dibatalkan: "bg-red-50 text-red-600",
};

export default function PesananPage() {
  const [activeTab, setActiveTab] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = orders.filter((o) => {
    const matchTab = activeTab === "Semua" || o.status === activeTab;
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.pelanggan.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const summary = { total: orders.length, baru: orders.filter((o) => o.status === "Baru").length, dikirim: orders.filter((o) => o.status === "Dikirim").length, selesai: orders.filter((o) => o.status === "Selesai").length };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Daftar Pesanan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola semua pesanan masuk toko Anda</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 overflow-x-auto">
        {tabs.map((tab) => {
          const count = tab === "Semua" ? orders.length : orders.filter((o) => o.status === tab).length;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab} <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari ID atau nama pelanggan..." className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-400" />
        </div>
        <input type="date" className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600" />
        <input type="date" className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
              <th className="text-left px-5 py-3 font-medium">ID Pesanan</th>
              <th className="text-left px-5 py-3 font-medium">Pelanggan</th>
              <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Produk</th>
              <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Tanggal</th>
              <th className="text-right px-5 py-3 font-medium">Total</th>
              <th className="text-center px-5 py-3 font-medium">Status</th>
              <th className="text-center px-5 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-gray-900 text-xs">{o.id}</td>
                <td className="px-5 py-3">
                  <p className="text-xs font-medium text-gray-900">{o.pelanggan}</p>
                  <p className="text-xs text-gray-400 truncate max-w-32">{o.alamat}</p>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500 hidden md:table-cell max-w-36 truncate">{o.produk}</td>
                <td className="px-5 py-3 text-xs text-gray-400 hidden lg:table-cell">{o.tanggal}</td>
                <td className="px-5 py-3 text-right text-xs font-bold text-gray-900">Rp {o.total.toLocaleString("id")}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[o.status]}`}>{o.status}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {o.status === "Baru" && (
                      <button className="px-2.5 py-1 text-xs font-semibold text-white rounded-lg" style={{ background: "var(--primary)" }}>Konfirmasi</button>
                    )}
                    {o.status === "Dikirim" && (
                      <button className="px-2.5 py-1 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Lacak</button>
                    )}
                    <button className="px-2.5 py-1 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Detail</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Bar */}
        <div className="flex flex-wrap gap-4 px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          <span>Total: <strong className="text-gray-900">{summary.total}</strong> pesanan</span>
          <span>Baru: <strong className="text-blue-600">{summary.baru}</strong></span>
          <span>Dalam Pengiriman: <strong className="text-purple-600">{summary.dikirim}</strong></span>
          <span>Selesai: <strong className="text-green-700">{summary.selesai}</strong></span>
        </div>
      </div>
    </div>
  );
}