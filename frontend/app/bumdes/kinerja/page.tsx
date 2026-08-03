"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

const IMG_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace("/api/v1", "");

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  active:   { bg: "#ECFDF5", text: "#065F46", label: "Aktif" },
  pending:  { bg: "#FFF7ED", text: "#C2410C", label: "Menunggu" },
  rejected: { bg: "#FEF2F2", text: "#DC2626", label: "Ditolak" },
};

type SortKey = "rating" | "active_products" | "total_orders" | "orders_this_month";

export default function KinerjaPage() {
  const toast = useToast();
  const [mitra, setMitra]     = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort]       = useState<SortKey>("rating");
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

  const openCount    = mitra.filter(m => m.is_open).length;
  const ratedMitra   = mitra.filter(m => m.rating > 0);
  const avgRating    = ratedMitra.length > 0
    ? (ratedMitra.reduce((s, m) => s + m.rating, 0) / ratedMitra.length).toFixed(1)
    : "—";

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "rating",            label: "Rating"           },
    { key: "active_products",   label: "Produk Aktif"     },
    { key: "orders_this_month", label: "Pesanan Bulan Ini" },
    { key: "total_orders",      label: "Total Pesanan"    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kinerja Mitra</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitoring operasional — aktivitas & kualitas layanan UMKM</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Mitra",       value: summary.total_mitra,   sub: "terdaftar"          },
            { label: "Mitra Aktif",       value: summary.active_mitra,  sub: "sudah diverifikasi" },
            { label: "Sedang Buka",       value: openCount,             sub: "buka sekarang"       },
            { label: "Rata-rata Rating",  value: avgRating,             sub: "dari mitra berating" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-xl font-bold text-gray-900">{loading ? "—" : value}</p>
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

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-700" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-gray-700">Belum ada mitra terdaftar</p>
          <p className="text-xs text-gray-400 mt-1">Mitra yang sudah aktif akan muncul di sini.</p>
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="text-left px-5 py-3.5 font-medium w-8">#</th>
                  <th className="text-left px-5 py-3.5 font-medium">Toko</th>
                  <th className="text-center px-4 py-3.5 font-medium">Status</th>
                  <th className="text-center px-4 py-3.5 font-medium">Buka</th>
                  <th className="text-right px-4 py-3.5 font-medium">Produk Aktif</th>
                  <th className="text-right px-4 py-3.5 font-medium">Pesanan Bln Ini</th>
                  <th className="text-right px-4 py-3.5 font-medium">Total Pesanan</th>
                  <th className="text-right px-5 py-3.5 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((m, i) => {
                  const badge  = STATUS_BADGE[m.status] ?? STATUS_BADGE.pending;
                  const logoUrl = m.logo ? (m.logo.startsWith("http") ? m.logo : `${IMG_BASE}${m.logo}`) : null;
                  const rating = Number(m.rating);
                  const ratingColor = rating >= 4 ? "text-green-700" : rating >= 3 ? "text-yellow-600" : rating > 0 ? "text-red-500" : "text-gray-300";
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-gray-400 text-xs font-medium">{i + 1}</td>
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
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ background: badge.bg, color: badge.text }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${m.is_open ? "bg-green-500" : "bg-gray-300"}`} title={m.is_open ? "Buka" : "Tutup"} />
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-800">{m.active_products}</td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-800">{m.orders_this_month}</td>
                      <td className="px-4 py-4 text-right text-gray-500">{m.total_orders}</td>
                      <td className="px-5 py-4 text-right">
                        {rating > 0
                          ? <span className={`font-bold ${ratingColor}`}>{rating.toFixed(1)} <span className="text-yellow-400">★</span></span>
                          : <span className="text-gray-300 text-xs">Belum ada</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
              {filtered.length} mitra ditampilkan
            </div>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((m, i) => {
              const badge  = STATUS_BADGE[m.status] ?? STATUS_BADGE.pending;
              const logoUrl = m.logo ? (m.logo.startsWith("http") ? m.logo : `${IMG_BASE}${m.logo}`) : null;
              const rating  = Number(m.rating);
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-medium w-5 shrink-0">{i + 1}</span>
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                      {logoUrl
                        ? <img src={logoUrl} alt={m.shop_name} className="w-full h-full object-cover" />
                        : <span className="text-sm font-bold text-gray-400">{m.shop_name[0]}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900 truncate">{m.shop_name}</p>
                        {m.is_open && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400">{m.owner_name}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                      style={{ background: badge.bg, color: badge.text }}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50 text-center">
                    <div>
                      <p className="text-base font-bold text-gray-900">{m.active_products}</p>
                      <p className="text-xs text-gray-400">Produk</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">{m.orders_this_month}</p>
                      <p className="text-xs text-gray-400">Pesanan</p>
                    </div>
                    <div>
                      <p className={`text-base font-bold ${rating >= 4 ? "text-green-700" : rating >= 3 ? "text-yellow-600" : rating > 0 ? "text-red-500" : "text-gray-300"}`}>
                        {rating > 0 ? `${rating.toFixed(1)}★` : "—"}
                      </p>
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
