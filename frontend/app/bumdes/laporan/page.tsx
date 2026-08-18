"use client";

import { useState, useEffect, useCallback } from "react";
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

interface FinancialSummary {
  gmv: number;
  bumdes_fee: number;
  service_fee: number;
  orders_count: number;
  avg_order: number;
  driver_earnings_estimate: number;
}

interface TrendItem {
  period: string;
  gmv: number;
  bumdes_fee: number;
  order_count: number;
}

interface TopMitra {
  shop_name: string;
  revenue: number;
  order_count: number;
}

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} Rb`;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

function formatRpFull(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function BarChart({ data }: { data: TrendItem[] }) {
  if (!data.length) return <p className="text-xs text-gray-400 text-center py-4">Tidak ada data.</p>;
  const maxGmv = Math.max(...data.map((d) => d.gmv), 1);
  return (
    <div className="flex items-end gap-1.5 h-28 overflow-x-auto pb-1">
      {data.map((d) => (
        <div key={d.period} className="flex flex-col items-center gap-1 flex-1 min-w-[32px]">
          <div className="w-full flex flex-col items-center justify-end" style={{ height: "80px" }}>
            <div
              className="w-full rounded-t-md bg-green-400 transition-all duration-300"
              style={{ height: `${(d.gmv / maxGmv) * 100}%`, minHeight: d.gmv > 0 ? "4px" : "0" }}
              title={`GMV: ${formatRp(d.gmv)}\nFee: ${formatRp(d.bumdes_fee)}\nPesanan: ${d.order_count}`}
            />
          </div>
          <span className="text-[9px] text-gray-400 text-center leading-tight whitespace-nowrap">{d.period.slice(-5)}</span>
        </div>
      ))}
    </div>
  );
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:   { label: "Aktif",    cls: "bg-green-50 text-green-700"   },
  pending:  { label: "Pending",  cls: "bg-yellow-50 text-yellow-700" },
  rejected: { label: "Ditolak", cls: "bg-red-50 text-red-600"       },
  inactive: { label: "Nonaktif",cls: "bg-gray-100 text-gray-500"    },
};

export default function BumdesLaporanPage() {
  const [tab, setTab] = useState<"keuangan" | "mitra">("keuangan");

  // Financial tab
  const [financial, setFinancial] = useState<{
    period: { from: string; to: string };
    summary: FinancialSummary;
    trend: TrendItem[];
    top_mitra: TopMitra[];
  } | null>(null);
  const [finLoading, setFinLoading] = useState(false);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState<"month" | "week" | "day">("day");

  // Mitra tab
  const [mitra, setMitra]     = useState<MitraData[]>([]);
  const [mitraLoading, setMitraLoading] = useState(false);
  const [search, setSearch]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sort, setSort] = useState<"revenue_this_month" | "revenue_total" | "orders_this_month" | "orders_total">("revenue_this_month");

  const fetchFinancial = useCallback(() => {
    setFinLoading(true);
    api.get("/admin/reports/financial", { params: { from, to, period } })
      .then((r) => setFinancial(r.data.data ?? null))
      .catch(() => {})
      .finally(() => setFinLoading(false));
  }, [from, to, period]);

  const fetchMitra = useCallback(() => {
    setMitraLoading(true);
    api.get("/admin/reports/mitra")
      .then((r) => setMitra(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setMitraLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "keuangan") fetchFinancial();
    else fetchMitra();
  }, [tab, fetchFinancial, fetchMitra]);

  const filtered = mitra
    .filter((m) => {
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

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Laporan Keuangan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Rekap pendapatan & transaksi BUMDes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["keuangan", "mitra"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
              tab === t ? "border-green-600 text-green-700" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "keuangan" ? "Keuangan BUMDes" : "Performa Mitra"}
          </button>
        ))}
      </div>

      {tab === "keuangan" && (
        <>
          {/* Date filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">Dari</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">Sampai</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400" />
            </div>
            <select value={period} onChange={(e) => setPeriod(e.target.value as "month" | "week" | "day")}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400">
              <option value="day">Harian</option>
              <option value="week">Mingguan</option>
              <option value="month">Bulanan</option>
            </select>
            <button onClick={fetchFinancial} disabled={finLoading}
              className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50">
              {finLoading ? "Memuat..." : "Terapkan"}
            </button>
          </div>

          {finLoading ? (
            <div className="p-16 text-center text-sm text-gray-400">Memuat laporan keuangan...</div>
          ) : !financial ? (
            <div className="p-10 text-center text-sm text-gray-400">Gagal memuat data. Coba lagi.</div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-2xl border border-green-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">Total GMV</p>
                  <p className="text-lg font-bold text-green-700">{formatRp(financial.summary.gmv)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{financial.period.from} – {financial.period.to}</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">Pendapatan BUMDes</p>
                  <p className="text-lg font-bold text-emerald-700">{formatRp(financial.summary.bumdes_fee)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">bumdes_fee dari transaksi</p>
                </div>
                <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">Jumlah Pesanan</p>
                  <p className="text-lg font-bold text-blue-700">{financial.summary.orders_count}</p>
                  <p className="text-xs text-gray-400 mt-0.5">transaksi selesai</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">Rata-rata Nilai Pesanan</p>
                  <p className="text-lg font-bold text-gray-900">{formatRp(financial.summary.avg_order)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">per transaksi</p>
                </div>
                <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">Estimasi Ongkir Kurir</p>
                  <p className="text-lg font-bold text-orange-700">{formatRp(financial.summary.driver_earnings_estimate)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">dari shipping_cost</p>
                </div>
                <div className="bg-purple-50 rounded-2xl border border-purple-100 p-4">
                  <p className="text-xs text-gray-500 mb-1">Biaya Layanan</p>
                  <p className="text-lg font-bold text-purple-700">{formatRp(financial.summary.service_fee)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">platform fee</p>
                </div>
              </div>

              {/* Trend chart */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-sm font-semibold text-gray-800 mb-4">Tren GMV</p>
                <BarChart data={financial.trend} />
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-1.5 text-gray-400 font-medium">Periode</th>
                        <th className="text-right py-1.5 text-gray-400 font-medium">GMV</th>
                        <th className="text-right py-1.5 text-gray-400 font-medium">Fee BUMDes</th>
                        <th className="text-right py-1.5 text-gray-400 font-medium">Pesanan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {financial.trend.map((t) => (
                        <tr key={t.period}>
                          <td className="py-1.5 text-gray-600 font-medium">{t.period}</td>
                          <td className="py-1.5 text-right text-gray-900 font-semibold">{formatRp(t.gmv)}</td>
                          <td className="py-1.5 text-right text-green-700">{formatRp(t.bumdes_fee)}</td>
                          <td className="py-1.5 text-right text-gray-600">{t.order_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top mitra */}
              {financial.top_mitra.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-sm font-semibold text-gray-800 mb-4">Top 5 Mitra (GMV)</p>
                  <div className="space-y-3">
                    {financial.top_mitra.map((m, i) => {
                      const maxRev = financial.top_mitra[0].revenue;
                      const pct = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
                      return (
                        <div key={m.shop_name} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-400 w-5 text-center shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-xs font-semibold text-gray-900 truncate">{m.shop_name}</p>
                              <p className="text-xs font-bold text-green-700 shrink-0 ml-2">{formatRp(m.revenue)}</p>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">{m.order_count} pesanan</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === "mitra" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama toko atau pemilik..."
              className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-white"
            />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white">
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="pending">Pending</option>
              <option value="rejected">Ditolak</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
              className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white">
              <option value="revenue_this_month">Pendapatan Bulan Ini</option>
              <option value="revenue_total">Total Pendapatan</option>
              <option value="orders_this_month">Pesanan Bulan Ini</option>
              <option value="orders_total">Total Pesanan</option>
            </select>
          </div>

          {mitraLoading ? (
            <div className="p-12 text-center text-sm text-gray-400">Memuat data mitra...</div>
          ) : filtered.length === 0 ? (
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
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500">Pesanan Bln</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500">Pendapatan Bln</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500">Total Pesanan</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500">Total Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((m) => {
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
                          <td className="px-4 py-4 text-right font-semibold text-gray-900">{m.orders_this_month}</td>
                          <td className="px-4 py-4 text-right">
                            <span className={`font-semibold ${m.revenue_this_month > 0 ? "text-green-700" : "text-gray-300"}`}>
                              {m.revenue_this_month > 0 ? formatRp(m.revenue_this_month) : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-gray-600">{m.total_orders}</td>
                          <td className="px-5 py-4 text-right">
                            <span className={`font-semibold ${m.total_revenue > 0 ? "text-gray-900" : "text-gray-300"}`}>
                              {m.total_revenue > 0 ? formatRp(m.total_revenue) : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={2} className="px-5 py-3.5 text-xs font-bold text-gray-700">
                        Total ({filtered.length} mitra)
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs font-bold text-gray-900">
                        {filtered.reduce((s, m) => s + m.orders_this_month, 0)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs font-bold text-green-700">
                        {formatRp(filtered.reduce((s, m) => s + m.revenue_this_month, 0))}
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs font-bold text-gray-900">
                        {filtered.reduce((s, m) => s + m.total_orders, 0)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs font-bold text-gray-900">
                        {formatRp(filtered.reduce((s, m) => s + m.total_revenue, 0))}
                      </td>
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
