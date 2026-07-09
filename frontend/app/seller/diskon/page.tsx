"use client";

// TODO (Oki): Implementasi penuh halaman ini setelah backend siap.
// Endpoint yang akan digunakan:
//   GET    /api/v1/seller/discounts          → list semua diskon milik seller
//   POST   /api/v1/seller/discounts          → buat diskon baru
//   PUT    /api/v1/seller/discounts/:id      → edit diskon
//   DELETE /api/v1/seller/discounts/:id      → hapus diskon
//   PATCH  /api/v1/seller/discounts/:id/toggle → aktifkan / nonaktifkan
//
// Shape data dari API (satu item):
// {
//   id: number,
//   product: { id: number, name: string, image: string | null },
//   type: "percentage" | "nominal",
//   value: number,              // % atau Rp
//   start_date: string | null,  // ISO date, null = langsung aktif
//   end_date: string | null,    // ISO date, null = tidak ada kadaluarsa
//   max_uses: number | null,    // null = unlimited
//   used_count: number,
//   is_active: boolean,
//   created_at: string,
// }

import { useState } from "react";

type FilterTab = "semua" | "aktif" | "nonaktif" | "kadaluarsa";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "aktif", label: "Aktif" },
  { key: "nonaktif", label: "Nonaktif" },
  { key: "kadaluarsa", label: "Kadaluarsa" },
];

export default function DiskonPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("semua");

  // TODO (Oki): Ganti dengan useEffect + axios.get ke /api/v1/seller/discounts
  const discounts: never[] = [];
  const loading = false;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Diskon Produk</h1>
          <p className="text-sm text-gray-400 mt-0.5">Kelola diskon untuk produk-produk di toko kamu.</p>
        </div>
        {/* TODO (Oki): Buka modal atau navigasi ke halaman tambah diskon */}
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ background: "var(--primary)" }}
          onClick={() => {/* TODO */}}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Diskon
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Produk</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Tipe</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Nilai</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Periode</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Kuota</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                  Memuat data diskon...
                </td>
              </tr>
            ) : discounts.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              // TODO (Oki): Render baris data dari discounts
              null
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--primary-light, #f0fdf4)" }}>
        <svg className="w-7 h-7" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-700">Belum ada diskon</p>
      <p className="text-xs text-gray-400 mt-1 text-center max-w-xs">
        Buat diskon untuk produk-produkmu agar lebih menarik pembeli.
      </p>
    </div>
  );
}
