"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

const IMG_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace("/api/v1", "");

function formatRp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}Jt`;
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)}K`;
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  active:   { bg: "#ECFDF5", text: "#065F46", label: "Aktif" },
  pending:  { bg: "#FFF7ED", text: "#C2410C", label: "Menunggu" },
  rejected: { bg: "#FEF2F2", text: "#DC2626", label: "Ditolak" },
};

type SortKey = "revenue_this_month" | "total_orders" | "rating" | "orders_this_month";

export default function KinerjaPage() {
  const toast = useToast();
  const [mitra, setMitra]     = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort]       = useState<SortKey>("revenue_this_month");
  const [search, setSearch]   = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/reports/mitra");
      setMitra(res.data.data ?? []);
      setSummary(res.data.summary ?? null);
    } catch {
      toast.error("Gagal memuat data kinerja mitra.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = mitra
    .filter(m => m.shop_name.toLowerCase().includes(search.toLowerCase()) || m.owner_name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b[sort] ?? 0) - (a[sort] ?? 0));

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "revenue_this_month", label: "Revenue Bulan Ini" },
    { key: "orders_this_month",  label: "Pesanan Bulan Ini" },
    { key: "total_orders",       label: "Total Pesanan" },
    { key: "rating",             label: "Rating" },
  ];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kinerja Mitra</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {summary ? `${summary.bumdes_name} · ` : ""}Pantau performa seluruh UMKM di desamu
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Mitra",          value: summary.total_mitra,                            sub: `${summary.active_mitra} aktif` },
            { label: "Pesanan Bulan Ini",     value: summary.total_orders_month,                    sub: "semua mitra" },
            { label: "Revenue Bulan Ini",     value: formatRp(summary.total_revenue_month),          sub: "dari pesanan selesai" },
            { label: "Rata-rata Rating",      value: mitra.filter(m => m.rating > 0).length > 0
                ? (mitra.filter(m => m.rating > 0).reduce((s, m) => s + m.rating, 0) / mitra.filter(m => m.rating > 0).length).toFixed(1)
                : "—",                                                                               sub: "dari mitra berating" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama toko atau pemilik..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-white"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-green-400"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.key} value={o.key}>Urutkan: {o.label}</option>
          ))}
        </select>
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: "var(--accent, #2D6A4F)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-gray-700">Belum ada mitra terdaftar</p>
          <p className="text-xs text-gray-400 mt-1">Mitra yang sudah daftar akan muncul di sini.</p>
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="text-left px-5 py-3.5 font-medium">#</th>
                  <th className="text-left px-5 py-3.5 font-medium">Toko</th>
                  <th className="text-left px-5 py-3.5 font-medium">Status</th>
                  <th className="text-right px-5 py-3.5 font-medium">Produk Aktif</th>
                  <th className="text-right px-5 py-3.5 font-medium">Pesanan Bulan Ini</th>
                  <th className="text-right px-5 py-3.5 font-medium">Revenue Bulan Ini</th>
                  <th className="text-right px-5 py-3.5 font-medium">Rating</th>
                  <th className="text-right px-5 py-3.5 font-medium">Total Pesanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((m, i) => {
                  const badge = STATUS_BADGE[m.status] ?? STATUS_BADGE.pending;
                  const logoUrl = m.logo ? (m.logo.startsWith("http") ? m.logo : `${IMG_BASE}${m.logo}`) : null;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                            {logoUrl
                              ? <img src={logoUrl} alt={m.shop_name} className="w-full h-full object-cover" />
                              : <span className="text-xs font-bold text-gray-400">{m.shop_name[0]}</span>
                            }
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{m.shop_name}</p>
                            <p className="text-xs text-gray-400">{m.owner_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ background: badge.bg, color: badge.text }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-gray-700">{m.active_products}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`font-semibold ${m.orders_this_month > 0 ? "text-gray-900" : "text-gray-300"}`}>
                          {m.orders_this_month}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`font-semibold ${m.revenue_this_month > 0 ? "text-green-700" : "text-gray-300"}`}>
                          {m.revenue_this_month > 0 ? formatRp(m.revenue_this_month) : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {m.rating > 0
                          ? <span className="font-semibold text-gray-900">{m.rating.toFixed(1)} <span className="text-yellow-400">★</span></span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-right text-gray-500">{m.total_orders}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((m, i) => {
              const badge = STATUS_BADGE[m.status] ?? STATUS_BADGE.pending;
              const logoUrl = m.logo ? (m.logo.startsWith("http") ? m.logo : `${IMG_BASE}${m.logo}`) : null;
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-medium w-5">{i + 1}</span>
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                      {logoUrl
                        ? <img src={logoUrl} alt={m.shop_name} className="w-full h-full object-cover" />
                        : <span className="text-sm font-bold text-gray-400">{m.shop_name[0]}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{m.shop_name}</p>
                      <p className="text-xs text-gray-400">{m.owner_name}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                      style={{ background: badge.bg, color: badge.text }}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-900">{m.orders_this_month}</p>
                      <p className="text-xs text-gray-400">Pesanan</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-green-700">{m.revenue_this_month > 0 ? formatRp(m.revenue_this_month) : "—"}</p>
                      <p className="text-xs text-gray-400">Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-gray-900">{m.rating > 0 ? `${m.rating.toFixed(1)}★` : "—"}</p>
                      <p className="text-xs text-gray-400">Rating</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
