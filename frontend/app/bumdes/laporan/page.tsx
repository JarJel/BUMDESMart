"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/axios";

interface MitraData {
  id: number;
  shop_name: string;
  owner_name: string;
  status: string;
  total_orders: number;
  orders_this_month: number;
  total_revenue: number;
  revenue_this_month: number;
  joined_at: string;
}

interface Summary {
  bumdes_name: string;
  total_mitra: number;
  active_mitra: number;
  total_revenue_month: number;
  total_orders_month: number;
}

function rupiah(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} Rb`;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:   { label: "Aktif",    cls: "bg-green-50 text-green-700"   },
  pending:  { label: "Pending",  cls: "bg-yellow-50 text-yellow-700" },
  rejected: { label: "Ditolak", cls: "bg-red-50 text-red-600"       },
  inactive: { label: "Nonaktif",cls: "bg-gray-100 text-gray-500"    },
};

export default function BumdesLaporanPage() {
  const [mitra, setMitra]     = useState<MitraData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sort, setSort] = useState<"revenue_this_month" | "revenue_total" | "orders_this_month" | "orders_total">("revenue_this_month");

  useEffect(() => {
    api.get("/admin/reports/mitra")
      .then(r => {
        setMitra(r.data.data ?? []);
        setSummary(r.data.summary ?? null);
      })
      .catch(() => setError("Gagal memuat data laporan."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = mitra
    .filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.shop_name.toLowerCase().includes(q) || m.owner_name.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || m.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sort === "revenue_this_month") return b.revenue_this_month - a.revenue_this_month;
      if (sort === "revenue_total")      return b.total_revenue - a.total_revenue;
      if (sort === "orders_this_month")  return b.orders_this_month - a.orders_this_month;
      return b.total_orders - a.total_orders;
    });

  const totalRevMonth  = filtered.reduce((s, m) => s + m.revenue_this_month, 0);
  const totalRevAll    = filtered.reduce((s, m) => s + m.total_revenue, 0);
  const totalOrdMonth  = filtered.reduce((s, m) => s + m.orders_this_month, 0);
  const totalOrdAll    = filtered.reduce((s, m) => s + m.total_orders, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Laporan Keuangan Mitra</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {summary ? `${summary.bumdes_name} · ` : ""}Rekap pendapatan & transaksi untuk pelaporan BUMDes
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center text-sm text-gray-400">Memuat laporan...</div>
      ) : error ? (
        <div className="p-10 text-center text-sm text-red-500">{error}</div>
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-2xl border border-green-100 p-4">
                <p className="text-xs text-gray-500 mb-1">Pendapatan Bulan Ini</p>
                <p className="text-lg font-bold text-green-700">{rupiah(summary.total_revenue_month)}</p>
                <p className="text-xs text-gray-400 mt-0.5">gabungan semua mitra</p>
              </div>
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
                <p className="text-xs text-gray-500 mb-1">Pesanan Bulan Ini</p>
                <p className="text-lg font-bold text-blue-700">{summary.total_orders_month}</p>
                <p className="text-xs text-gray-400 mt-0.5">transaksi selesai</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs text-gray-500 mb-1">Mitra Aktif</p>
                <p className="text-lg font-bold text-gray-900">{summary.active_mitra}</p>
                <p className="text-xs text-gray-400 mt-0.5">dari {summary.total_mitra} terdaftar</p>
              </div>
              <div className="bg-yellow-50 rounded-2xl border border-yellow-100 p-4">
                <p className="text-xs text-gray-500 mb-1">Total Kumulatif</p>
                <p className="text-lg font-bold text-yellow-700">{rupiah(totalRevAll)}</p>
                <p className="text-xs text-gray-400 mt-0.5">sepanjang waktu</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama toko atau pemilik..."
              className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-white"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="pending">Pending</option>
              <option value="rejected">Ditolak</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as typeof sort)}
              className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-white"
            >
              <option value="revenue_this_month">Urutkan: Pendapatan Bulan Ini</option>
              <option value="revenue_total">Urutkan: Total Pendapatan</option>
              <option value="orders_this_month">Urutkan: Pesanan Bulan Ini</option>
              <option value="orders_total">Urutkan: Total Pesanan</option>
            </select>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-400">
              Tidak ada mitra yang ditemukan.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500">Toko</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Status</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500">Pesanan Bln Ini</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500">Pendapatan Bln Ini</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500">Total Pesanan</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500">Total Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(m => {
                      const st = STATUS_LABEL[m.status] ?? { label: m.status, cls: "bg-gray-100 text-gray-500" };
                      return (
                        <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900 leading-tight">{m.shop_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{m.owner_name}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="font-semibold text-gray-900">{m.orders_this_month}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className={`font-semibold ${m.revenue_this_month > 0 ? "text-green-700" : "text-gray-300"}`}>
                              {m.revenue_this_month > 0 ? rupiah(m.revenue_this_month) : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-gray-600">{m.total_orders}</td>
                          <td className="px-5 py-4 text-right">
                            <span className={`font-semibold ${m.total_revenue > 0 ? "text-gray-900" : "text-gray-300"}`}>
                              {m.total_revenue > 0 ? rupiah(m.total_revenue) : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Baris total */}
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={2} className="px-5 py-3.5 text-xs font-bold text-gray-700">
                        Total ({filtered.length} mitra)
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs font-bold text-gray-900">{totalOrdMonth}</td>
                      <td className="px-4 py-3.5 text-right text-xs font-bold text-green-700">{rupiah(totalRevMonth)}</td>
                      <td className="px-4 py-3.5 text-right text-xs font-bold text-gray-900">{totalOrdAll}</td>
                      <td className="px-5 py-3.5 text-right text-xs font-bold text-gray-900">{rupiah(totalRevAll)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
