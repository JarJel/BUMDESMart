"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api/axios";

type KinerjaTab = "platform" | "umkm" | "kurir";

interface DriverRow {
  id: number;
  vehicle_type: string;
  vehicle_plate: string;
  is_verified: boolean;
  is_suspended: boolean;
  total_deliveries: number;
  rating: number;
  user: { name: string; email: string };
}

interface UmkmRow {
  id: number;
  shop_name: string;
  status: string;
  total_orders: number;
  total_revenue: number;
  avg_rating: number;
  user?: { name: string; email: string };
}

interface PlatformStats {
  total_visits: number;
  visit_today: number;
  total_orders: number;
  total_revenue: number;
  total_users: number;
  total_umkm: number;
  monthly: { label: string; orders: number; revenue: number }[];
}

type DSort = "total_deliveries" | "rating";
type USort = "total_revenue" | "total_orders" | "avg_rating";

const VEHICLE: Record<string, string> = {
  motor: "Motor", mobil: "Mobil", pickup_box: "Pickup Box", pickup_bak: "Pickup Bak",
};

function formatRp(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${Math.round(n).toLocaleString("id")}`;
}

export default function KinerjaPage() {
  const [tab, setTab] = useState<KinerjaTab>("platform");

  const [drivers, setDrivers]     = useState<DriverRow[]>([]);
  const [drLoading, setDrLoading] = useState(true);
  const [dSort, setDSort]         = useState<DSort>("total_deliveries");

  const [umkms, setUmkms]         = useState<UmkmRow[]>([]);
  const [umLoading, setUmLoading] = useState(true);
  const [uSort, setUSort]         = useState<USort>("total_revenue");

  const [platform, setPlatform]   = useState<PlatformStats | null>(null);
  const [plLoading, setPlLoading] = useState(true);

  useEffect(() => {
    api.get("/super-admin/drivers", { params: { per_page: 100 } })
      .then(r => setDrivers(r.data.data?.data ?? []))
      .catch(() => {})
      .finally(() => setDrLoading(false));

    api.get("/super-admin/stats/umkm-performance")
      .then(r => setUmkms(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setUmLoading(false));

    api.get("/super-admin/stats/platform")
      .then(r => setPlatform(r.data.data))
      .catch(() => {})
      .finally(() => setPlLoading(false));
  }, []);

  const sortedDr = [...drivers].sort((a, b) => b[dSort] - a[dSort]);
  const sortedUm = [...umkms].sort((a, b) => b[uSort] - a[uSort]);

  const verifiedDrivers = drivers.filter(d => d.is_verified && !d.is_suspended).length;
  const totalDeliveries = drivers.reduce((s, d) => s + d.total_deliveries, 0);
  const avgRating       = drivers.length > 0
    ? (drivers.reduce((s, d) => s + Number(d.rating), 0) / drivers.length).toFixed(1)
    : "—";

  const tabs: { key: KinerjaTab; label: string }[] = [
    { key: "platform", label: "Platform" },
    { key: "umkm",     label: "UMKM" },
    { key: "kurir",    label: "Kurir" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kinerja</h1>
        <p className="text-sm text-gray-500 mt-0.5">Statistik performa platform, UMKM, dan kurir</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t.key ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Platform ── */}
      {tab === "platform" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Pengunjung",  value: plLoading ? "—" : (platform?.total_visits ?? 0).toLocaleString("id") },
              { label: "Pengunjung Hari Ini", value: plLoading ? "—" : (platform?.visit_today ?? 0).toLocaleString("id") },
              { label: "Transaksi Selesai", value: plLoading ? "—" : (platform?.total_orders ?? 0).toLocaleString("id") },
              { label: "Fee Platform (YTD)", value: plLoading ? "—" : formatRp(platform?.total_revenue ?? 0) },
              { label: "Total Pengguna",    value: plLoading ? "—" : (platform?.total_users ?? 0).toLocaleString("id") },
              { label: "UMKM Aktif",        value: plLoading ? "—" : (platform?.total_umkm ?? 0).toLocaleString("id") },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                <p className="text-xl font-bold text-gray-900">{c.value}</p>
                <p className="text-xs text-gray-500 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Pesanan & Fee per Bulan ({new Date().getFullYear()})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-50">
                    <th className="text-left px-5 py-3 font-medium">Bulan</th>
                    <th className="text-right px-5 py-3 font-medium">Pesanan</th>
                    <th className="text-right px-5 py-3 font-medium">Fee Platform</th>
                  </tr>
                </thead>
                <tbody>
                  {plLoading ? (
                    <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">Memuat data...</td></tr>
                  ) : (platform?.monthly ?? []).map(m => (
                    <tr key={m.label} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-900">{m.label}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{m.orders.toLocaleString("id")}</td>
                      <td className="px-5 py-3 text-right text-indigo-700 font-semibold">{formatRp(m.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── UMKM ── */}
      {tab === "umkm" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total UMKM",      value: umkms.length },
              { label: "UMKM Aktif",      value: umkms.filter(u => u.status === "active").length },
              { label: "Total Pesanan",   value: umkms.reduce((s, u) => s + u.total_orders, 0) },
              { label: "Total Pendapatan", value: formatRp(umkms.reduce((s, u) => s + u.total_revenue, 0)) },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                <p className="text-xl font-bold text-gray-900">{umLoading ? "—" : c.value}</p>
                <p className="text-xs text-gray-500 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Ranking UMKM</h2>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl self-start sm:self-auto">
                {([["total_revenue","Pendapatan"],["total_orders","Pesanan"],["avg_rating","Rating"]] as [USort,string][]).map(([k,lbl]) => (
                  <button key={k} onClick={() => setUSort(k)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${uSort === k ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-50">
                    <th className="text-left px-5 py-3 font-medium w-10">#</th>
                    <th className="text-left px-5 py-3 font-medium">Toko</th>
                    <th className="text-center px-5 py-3 font-medium">Status</th>
                    <th className="text-right px-5 py-3 font-medium">Pesanan</th>
                    <th className="text-right px-5 py-3 font-medium">Pendapatan</th>
                    <th className="text-right px-5 py-3 font-medium">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {umLoading ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Memuat data...</td></tr>
                  ) : sortedUm.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Belum ada data UMKM.</td></tr>
                  ) : sortedUm.map((u, i) => (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-gray-400 font-semibold">{i + 1}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{u.shop_name}</p>
                        {u.user && <p className="text-gray-400 mt-0.5">{u.user.name}</p>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${u.status === "active" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                          {u.status === "active" ? "Aktif" : "Pending"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-indigo-700">{u.total_orders}</td>
                      <td className="px-5 py-3 text-right font-semibold text-green-700">{formatRp(u.total_revenue)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-semibold text-amber-500">
                          {Number(u.avg_rating) > 0 ? `${Number(u.avg_rating).toFixed(1)}★` : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Kurir ── */}
      {tab === "kurir" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Kurir",      value: drivers.length   },
              { label: "Kurir Aktif",      value: verifiedDrivers  },
              { label: "Total Pengiriman", value: totalDeliveries  },
              { label: "Avg. Rating",      value: avgRating        },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                <p className="text-xl font-bold text-gray-900">{drLoading ? "—" : c.value}</p>
                <p className="text-xs text-gray-500 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Ranking Kurir</h2>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl self-start sm:self-auto">
                {([["total_deliveries","Pengiriman"],["rating","Rating"]] as [DSort,string][]).map(([k,lbl]) => (
                  <button key={k} onClick={() => setDSort(k)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${dSort === k ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-50">
                    <th className="text-left px-5 py-3 font-medium w-10">#</th>
                    <th className="text-left px-5 py-3 font-medium">Kurir</th>
                    <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Kendaraan</th>
                    <th className="text-center px-5 py-3 font-medium">Status</th>
                    <th className="text-right px-5 py-3 font-medium">Pengiriman</th>
                    <th className="text-right px-5 py-3 font-medium">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {drLoading ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Memuat data...</td></tr>
                  ) : sortedDr.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Belum ada data kurir.</td></tr>
                  ) : sortedDr.map((d, i) => (
                    <tr key={d.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-gray-400 font-semibold">{i + 1}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{d.user.name}</p>
                        <p className="text-gray-400 mt-0.5">{d.user.email}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">
                        {VEHICLE[d.vehicle_type] ?? d.vehicle_type}
                        <span className="text-gray-400 ml-1">· {d.vehicle_plate}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {d.is_suspended
                          ? <span className="px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">Suspend</span>
                          : d.is_verified
                            ? <span className="px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">Aktif</span>
                            : <span className="px-2 py-0.5 rounded-full font-medium bg-yellow-50 text-yellow-700">Menunggu</span>
                        }
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-indigo-700">{d.total_deliveries}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-semibold text-amber-500">
                          {Number(d.rating) > 0 ? `${Number(d.rating).toFixed(1)}★` : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
