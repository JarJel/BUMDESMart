"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/axios";

interface MitraData {
  id: number;
  shop_name: string;
  slug: string;
  logo: string | null;
  owner_name: string;
  status: string;
  rating: number;
  is_open: boolean;
  active_products: number;
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
  return `Rp ${n.toFixed(0)}`;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:  { label: "Aktif",    cls: "bg-green-50 text-green-700"  },
  pending: { label: "Pending",  cls: "bg-yellow-50 text-yellow-700" },
  rejected:{ label: "Ditolak", cls: "bg-red-50 text-red-600"      },
  inactive:{ label: "Nonaktif",cls: "bg-gray-100 text-gray-500"   },
};

export default function BumdesLaporanPage() {
  const [mitra, setMitra] = useState<MitraData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sort, setSort] = useState<"revenue" | "orders" | "products" | "rating">("revenue");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/admin/reports/mitra");
        setMitra(res.data.data ?? []);
        setSummary(res.data.summary ?? null);
      } catch {
        setError("Gagal memuat data laporan.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = mitra
    .filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.shop_name.toLowerCase().includes(q) || m.owner_name.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || m.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sort === "revenue") return b.revenue_this_month - a.revenue_this_month;
      if (sort === "orders") return b.orders_this_month - a.orders_this_month;
      if (sort === "products") return b.active_products - a.active_products;
      return b.rating - a.rating;
    });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Laporan Kinerja Mitra</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Pantau performa seluruh UMKM yang terdaftar di BUMDes ini.
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
              <SummaryCard label="Total Mitra" value={String(summary.total_mitra)} sub="terdaftar" color="text-gray-900" />
              <SummaryCard label="Mitra Aktif" value={String(summary.active_mitra)} sub="berjalan" color="text-green-700" />
              <SummaryCard label="Pesanan Bulan Ini" value={String(summary.total_orders_month)} sub="order" color="text-blue-700" />
              <SummaryCard label="Pendapatan Bulan Ini" value={rupiah(summary.total_revenue_month)} sub="gabungan mitra" color="text-yellow-700" />
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
              <option value="revenue">Urutkan: Pendapatan</option>
              <option value="orders">Urutkan: Pesanan</option>
              <option value="products">Urutkan: Produk Aktif</option>
              <option value="rating">Urutkan: Rating</option>
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
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500">Produk Aktif</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500">Pesanan Bulan Ini</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500">Pendapatan Bulan Ini</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500">Total Pesanan</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(m => {
                      const st = STATUS_LABEL[m.status] ?? { label: m.status, cls: "bg-gray-100 text-gray-500" };
                      return (
                        <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900 leading-tight">{m.shop_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{m.owner_name} · Bergabung {m.joined_at}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium w-fit ${st.cls}`}>
                                {st.label}
                              </span>
                              {m.is_open && (
                                <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium w-fit bg-blue-50 text-blue-600">
                                  Buka
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="font-semibold text-gray-900">{m.active_products}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="font-semibold text-gray-900">{m.orders_this_month}</span>
                            <p className="text-xs text-gray-400 mt-0.5">{m.total_orders} total</p>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="font-semibold text-gray-900">{rupiah(m.revenue_this_month)}</span>
                            <p className="text-xs text-gray-400 mt-0.5">{rupiah(m.total_revenue)} total</p>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-gray-700">{m.total_orders}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className={`font-semibold ${m.rating >= 4 ? "text-green-700" : m.rating >= 3 ? "text-yellow-600" : "text-gray-500"}`}>
                              {m.rating > 0 ? m.rating.toFixed(1) : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
                Menampilkan {filtered.length} dari {mitra.length} mitra
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
