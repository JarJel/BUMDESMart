"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api/axios";

interface Overview {
  users: { total: number; active: number; inactive: number; super_admin: number; admin_bumdes: number; umkm: number; customer: number };
  bumdes: { total: number; active: number; inactive: number };
  umkm: { total: number; pending: number; active: number; rejected: number };
  products: { total: number; active: number };
  monthly_data: { label: string; orders: number; revenue: number }[];
  top_bumdes: { id: number; name: string; city: string; umkm_count: number }[];
}

interface BumdesRow {
  id: number;
  name: string;
  city: string;
  province: string;
  status: string;
  total_umkm: number;
  active_umkm: number;
}

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${Math.round(n).toLocaleString("id")}`;
}

function formatRpFull(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function LaporanPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bumdes, setBumdes] = useState<BumdesRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/super-admin/reports/overview"),
      api.get("/super-admin/reports/bumdes"),
    ]).then(([ovRes, bdRes]) => {
      setOverview(ovRes.data.data);
      setBumdes(bdRes.data.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalRevenue = overview?.monthly_data.reduce((s, d) => s + d.revenue, 0) ?? 0;
  const totalOrders  = overview?.monthly_data.reduce((s, d) => s + d.orders, 0) ?? 0;

  const summaryCards = [
    { label: "Total Pesanan (YTD)",      value: totalOrders.toLocaleString("id"),   sub: `tahun ${new Date().getFullYear()}`,       dot: "bg-blue-400"   },
    { label: "Pendapatan Platform (YTD)", value: formatRp(totalRevenue),             sub: "dari pesanan selesai & dikirim",           dot: "bg-green-500"  },
    { label: "BUMDes Aktif",              value: String(overview?.bumdes.active ?? 0), sub: `dari ${overview?.bumdes.total ?? 0} terdaftar`, dot: "bg-purple-400" },
    { label: "UMKM Mitra Aktif",          value: String(overview?.umkm.active ?? 0),  sub: `${overview?.umkm.pending ?? 0} menunggu verifikasi`, dot: "bg-orange-400" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Laporan Platform</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ringkasan data &amp; kinerja seluruh ekosistem BumDesMartNukita</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => {
              if (!overview) return;
              const year = new Date().getFullYear();
              const rows = [
                ["Laporan Platform BumDesMartNukita"],
                ["Tahun", String(year)],
                [],
                ["Ringkasan Pengguna"],
                ["Total Pengguna", String(overview.users.total)],
                ["Customer", String(overview.users.customer)],
                ["UMKM / Seller", String(overview.users.umkm)],
                ["Admin BUMDes", String(overview.users.admin_bumdes)],
                [],
                ["Ringkasan Platform"],
                ["BUMDes Aktif", String(overview.bumdes.active) + " / " + String(overview.bumdes.total)],
                ["UMKM Aktif", String(overview.umkm.active) + " / " + String(overview.umkm.total)],
                ["Produk Aktif", String(overview.products.active) + " / " + String(overview.products.total)],
                [],
                ["Tren Bulanan " + year],
                ["Bulan", "Pesanan", "Pendapatan Platform"],
                ...overview.monthly_data.map(d => [d.label, String(d.orders), formatRpFull(d.revenue)]),
                [],
                ["Top BUMDes"],
                ["Nama BUMDes", "Kota", "UMKM Aktif"],
                ...bumdes.map(b => [b.name, b.city, String(b.active_umkm) + " / " + String(b.total_umkm)]),
              ];
              downloadCSV(rows, `laporan-platform-${year}.csv`);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Unduh Excel
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
              <p className="text-xs text-gray-500 leading-tight">{c.label}</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{loading ? "—" : c.value}</p>
            <p className="text-xs mt-1 text-gray-400">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* User stats */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Statistik Pengguna</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Customer",    value: overview?.users.customer    ?? 0 },
            { label: "UMKM/Seller", value: overview?.users.umkm        ?? 0 },
            { label: "Admin BUMDes", value: overview?.users.admin_bumdes ?? 0 },
            { label: "Total Aktif", value: overview?.users.active       ?? 0 },
          ].map(s => (
            <div key={s.label} className="text-center py-3 bg-gray-50 rounded-xl">
              <p className="text-xl font-bold text-gray-900">{loading ? "—" : s.value.toLocaleString("id")}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly table */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">
            Pesanan &amp; Pendapatan Bulanan ({new Date().getFullYear()})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium">Bulan</th>
                <th className="text-right px-5 py-3 font-medium">Pesanan</th>
                <th className="text-right px-5 py-3 font-medium">Pendapatan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">Memuat data...</td></tr>
              ) : (
                (overview?.monthly_data ?? []).map(d => (
                  <tr key={d.label} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-900">{d.label}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{d.orders.toLocaleString("id")}</td>
                    <td className="px-5 py-3 text-right text-gray-700">{formatRp(d.revenue)}</td>
                  </tr>
                ))
              )}
              {!loading && overview && (
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-5 py-3 text-gray-900">Total</td>
                  <td className="px-5 py-3 text-right text-gray-900">{totalOrders.toLocaleString("id")}</td>
                  <td className="px-5 py-3 text-right text-gray-900">{formatRp(totalRevenue)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BUMDes breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Rekapitulasi per BUMDes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium">BUMDes</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Lokasi</th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Total UMKM</th>
                <th className="text-right px-5 py-3 font-medium">Aktif</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Memuat data...</td></tr>
              ) : bumdes.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Belum ada data BUMDes.</td></tr>
              ) : (
                bumdes.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-900">{b.name}</td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">
                      {b.city}{b.province ? `, ${b.province}` : ""}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${b.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {b.status === "active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">{b.total_umkm}</td>
                    <td className="px-5 py-3 text-right font-semibold text-green-700">{b.active_umkm}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
