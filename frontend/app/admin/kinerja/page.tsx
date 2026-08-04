"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api/axios";

interface BumdesRow {
  id: number;
  name: string;
  city: string;
  province: string;
  status: string;
  total_umkm: number;
  active_umkm: number;
}

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

type Tab      = "bumdes" | "kurir";
type BSort    = "active_umkm" | "total_umkm";
type DSort    = "total_deliveries" | "rating";

const VEHICLE: Record<string, string> = {
  motor: "Motor", mobil: "Mobil", pickup_box: "Pickup Box", pickup_bak: "Pickup Bak",
};

export default function KinerjaPage() {
  const [tab, setTab]         = useState<Tab>("bumdes");

  // BUMDes state
  const [bumdes, setBumdes]   = useState<BumdesRow[]>([]);
  const [bdLoading, setBdLoading] = useState(true);
  const [sortKey, setSortKey] = useState<BSort>("active_umkm");

  // Kurir state
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [drLoading, setDrLoading] = useState(true);
  const [dSort, setDSort]     = useState<DSort>("total_deliveries");

  useEffect(() => {
    api.get("/super-admin/reports/bumdes")
      .then(r => setBumdes(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setBdLoading(false));

    api.get("/super-admin/drivers", { params: { per_page: 100 } })
      .then(r => setDrivers(r.data.data?.data ?? []))
      .catch(() => {})
      .finally(() => setDrLoading(false));
  }, []);

  // BUMDes stats
  const sortedBd     = [...bumdes].sort((a, b) => b[sortKey] - a[sortKey]);
  const activeBumdes = bumdes.filter(b => b.status === "active").length;
  const totalUmkm    = bumdes.reduce((s, b) => s + b.total_umkm, 0);
  const activeUmkm   = bumdes.reduce((s, b) => s + b.active_umkm, 0);
  const avgRatio     = totalUmkm > 0 ? Math.round((activeUmkm / totalUmkm) * 100) : 0;

  // Driver stats
  const sortedDr      = [...drivers].sort((a, b) => b[dSort] - a[dSort]);
  const verifiedDrivers = drivers.filter(d => d.is_verified && !d.is_suspended).length;
  const totalDeliveries = drivers.reduce((s, d) => s + d.total_deliveries, 0);
  const avgRating       = drivers.length > 0
    ? (drivers.reduce((s, d) => s + Number(d.rating), 0) / drivers.length).toFixed(1)
    : "—";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kinerja Platform</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ranking BUMDes & kurir terbaik di platform</p>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {([["bumdes", "BUMDes"], ["kurir", "Kurir"]] as [Tab, string][]).map(([k, lbl]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === k ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* ── BUMDes Tab ── */}
      {tab === "bumdes" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "BUMDes Terdaftar", value: bumdes.length },
              { label: "BUMDes Aktif",     value: activeBumdes  },
              { label: "UMKM Aktif",       value: activeUmkm    },
              { label: "Rata-rata Rasio",  value: `${avgRatio}%` },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                <p className="text-xl font-bold text-gray-900">{bdLoading ? "—" : c.value}</p>
                <p className="text-xs text-gray-500 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Ranking BUMDes</h2>
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl self-start sm:self-auto">
                {([["active_umkm", "UMKM Aktif"], ["total_umkm", "Total UMKM"]] as [BSort, string][]).map(([k, lbl]) => (
                  <button key={k} onClick={() => setSortKey(k)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${sortKey === k ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
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
                    <th className="text-left px-5 py-3 font-medium">BUMDes</th>
                    <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Lokasi</th>
                    <th className="text-center px-5 py-3 font-medium">Status</th>
                    <th className="text-right px-5 py-3 font-medium">Total UMKM</th>
                    <th className="text-right px-5 py-3 font-medium">UMKM Aktif</th>
                    <th className="text-right px-5 py-3 font-medium">Rasio</th>
                  </tr>
                </thead>
                <tbody>
                  {bdLoading ? (
                    <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">Memuat data...</td></tr>
                  ) : sortedBd.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">Belum ada data BUMDes.</td></tr>
                  ) : (
                    sortedBd.map((b, i) => {
                      const ratio = b.total_umkm > 0 ? Math.round((b.active_umkm / b.total_umkm) * 100) : 0;
                      const ratioColor = ratio >= 70 ? "text-green-600" : ratio >= 40 ? "text-yellow-600" : "text-red-500";
                      return (
                        <tr key={b.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="px-5 py-3 text-gray-400 font-semibold">{i + 1}</td>
                          <td className="px-5 py-3 font-medium text-gray-900">{b.name}</td>
                          <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{b.city}{b.province ? `, ${b.province}` : ""}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${b.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {b.status === "active" ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-gray-700">{b.total_umkm}</td>
                          <td className="px-5 py-3 text-right font-semibold text-green-700">{b.active_umkm}</td>
                          <td className="px-5 py-3 text-right"><span className={`font-semibold ${ratioColor}`}>{ratio}%</span></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Kurir Tab ── */}
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
                {([["total_deliveries", "Pengiriman"], ["rating", "Rating"]] as [DSort, string][]).map(([k, lbl]) => (
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
                  ) : (
                    sortedDr.map((d, i) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
