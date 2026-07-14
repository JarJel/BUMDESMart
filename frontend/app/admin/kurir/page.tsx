"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import {
  Search, CheckCircle, XCircle, ShieldOff, ShieldCheck,
  Bike, Car, Truck, Package, Eye, ChevronLeft, ChevronRight, X
} from "lucide-react";

const VEHICLE_ICON: Record<string, React.ReactNode> = {
  motor:      <Bike className="w-4 h-4" />,
  mobil:      <Car className="w-4 h-4" />,
  pickup_box: <Truck className="w-4 h-4" />,
  pickup_bak: <Package className="w-4 h-4" />,
};

const VEHICLE_LABEL: Record<string, string> = {
  motor: "Motor", mobil: "Mobil", pickup_box: "Pickup Box", pickup_bak: "Pickup Bak",
};

type Driver = {
  id: number;
  user_id: number;
  vehicle_type: string;
  vehicle_brand: string;
  vehicle_plate: string;
  vehicle_year: number;
  sim_type: string;
  id_number: string;
  photo_profile_url?: string;
  photo_ktp_url?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  is_available: boolean;
  is_verified: boolean;
  is_suspended: boolean;
  suspension_reason?: string;
  total_deliveries: number;
  rating: number;
  created_at: string;
  user: { id: number; name: string; email: string; phone?: string; created_at: string };
};

type Meta = { current_page: number; last_page: number; total: number };

function StatusBadge({ driver }: { driver: Driver }) {
  if (!!driver.is_suspended) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">Disuspend</span>;
  }
  if (!!driver.is_verified) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"><CheckCircle className="w-3 h-3" />Terverifikasi</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">Menunggu</span>;
}

function KtpPhoto({ url }: { url?: string }) {
  const [broken, setBroken] = useState(false);
  const placeholder = (
    <div className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">
      Tidak ada foto KTP
    </div>
  );
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Selfie + KTP (Verifikasi)</p>
      {url && !broken ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img
            src={url}
            alt="Foto KTP"
            onError={() => setBroken(true)}
            className="w-full rounded-xl border border-gray-200 object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
            style={{ maxHeight: 240 }}
          />
        </a>
      ) : placeholder}
    </div>
  );
}

export default function AdminKurirPage() {
  const toast = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [meta, setMeta] = useState<Meta>({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Driver | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterVehicle) params.vehicle_type = filterVehicle;

      const res = await api.get("/super-admin/drivers", { params });
      const payload = res.data.data;
      setDrivers(payload.data);
      setMeta({ current_page: payload.current_page, last_page: payload.last_page, total: payload.total });
    } catch {
      toast.error("Gagal memuat data kurir.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterStatus, filterVehicle]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const handleVerify = async (driver: Driver) => {
    setActionLoading(true);
    try {
      await api.patch(`/super-admin/drivers/${driver.id}/verify`);
      toast.success(`${driver.user.name} berhasil diverifikasi.`);
      fetchDrivers();
      if (selected?.id === driver.id) setSelected({ ...selected, is_verified: true, is_suspended: false });
    } catch {
      toast.error("Gagal memverifikasi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (driver: Driver) => {
    setActionLoading(true);
    try {
      await api.patch(`/super-admin/drivers/${driver.id}/reject`);
      toast.success(`Pendaftaran ${driver.user.name} ditolak.`);
      fetchDrivers();
      if (selected?.id === driver.id) setSelected({ ...selected, is_verified: false });
    } catch {
      toast.error("Gagal menolak pendaftaran.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selected || !suspendReason.trim()) return;
    setActionLoading(true);
    try {
      await api.patch(`/super-admin/drivers/${selected.id}/suspend`, { reason: suspendReason });
      toast.success(`${selected.user.name} berhasil disuspend.`);
      setSuspendReason("");
      setShowSuspendModal(false);
      fetchDrivers();
      setSelected({ ...selected, is_suspended: true, suspension_reason: suspendReason });
    } catch {
      toast.error("Gagal suspend kurir.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async (driver: Driver) => {
    setActionLoading(true);
    try {
      await api.patch(`/super-admin/drivers/${driver.id}/unsuspend`);
      toast.success(`Suspend ${driver.user.name} dicabut.`);
      fetchDrivers();
      if (selected?.id === driver.id) setSelected({ ...selected, is_suspended: false, suspension_reason: undefined });
    } catch {
      toast.error("Gagal mencabut suspend.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Kurir</h1>
          <p className="text-sm text-gray-500 mt-0.5">Verifikasi, pantau, dan kelola akun kurir terdaftar</p>
        </div>
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-full">
          {meta.total} kurir
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, email, atau plat..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">Semua Status</option>
          <option value="unverified">Menunggu Verifikasi</option>
          <option value="verified">Terverifikasi</option>
          <option value="suspended">Disuspend</option>
        </select>
        <select
          value={filterVehicle}
          onChange={e => { setFilterVehicle(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">Semua Kendaraan</option>
          <option value="motor">Motor</option>
          <option value="mobil">Mobil</option>
          <option value="pickup_box">Pickup Box</option>
          <option value="pickup_bak">Pickup Bak</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">Tidak ada data kurir.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-5 py-3 font-semibold text-gray-600">Kurir</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Kendaraan</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3 font-semibold text-gray-600 text-right">Antar</th>
                <th className="px-5 py-3 font-semibold text-gray-600 text-right">Rating</th>
                <th className="px-5 py-3 font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {drivers.map(driver => (
                <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {driver.photo_profile_url ? (
                        <img src={driver.photo_profile_url} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                          {driver.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{driver.user.name}</p>
                        <p className="text-xs text-gray-500">{driver.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      {VEHICLE_ICON[driver.vehicle_type]}
                      <span>{VEHICLE_LABEL[driver.vehicle_type]}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{driver.vehicle_plate}</p>
                  </td>
                  <td className="px-5 py-4"><StatusBadge driver={driver} /></td>
                  <td className="px-5 py-4 text-right text-gray-700">{driver.total_deliveries}</td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-amber-500 font-medium">{driver.rating > 0 ? driver.rating.toFixed(1) : "—"}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelected(driver)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Halaman {meta.current_page} dari {meta.last_page}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.current_page === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page === meta.last_page}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative ml-auto w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">Detail Kurir</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {/* Profile photo + name */}
              <div className="flex items-center gap-4">
                {selected.photo_profile_url ? (
                  <img src={selected.photo_profile_url} alt="" className="w-16 h-16 rounded-2xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                    {selected.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900 text-lg">{selected.user.name}</p>
                  <p className="text-sm text-gray-500">{selected.user.email}</p>
                  {selected.user.phone && <p className="text-sm text-gray-500">{selected.user.phone}</p>}
                  <div className="mt-1"><StatusBadge driver={selected} /></div>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Kendaraan", value: VEHICLE_LABEL[selected.vehicle_type] },
                  { label: "Plat Nomor", value: selected.vehicle_plate },
                  { label: "Merek", value: selected.vehicle_brand || "—" },
                  { label: "Tahun", value: selected.vehicle_year?.toString() || "—" },
                  { label: "SIM", value: selected.sim_type?.toUpperCase() || "—" },
                  { label: "No. KTP", value: selected.id_number || "—" },
                  { label: "Total Antar", value: selected.total_deliveries.toString() },
                  { label: "Rating", value: selected.rating > 0 ? `${selected.rating.toFixed(1)} ⭐` : "—" },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Rekening */}
              {selected.bank_name && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rekening Bank</p>
                  <p className="text-sm font-semibold text-gray-900">{selected.bank_name}</p>
                  <p className="text-sm text-gray-700">{selected.bank_account_number}</p>
                  <p className="text-xs text-gray-500 mt-0.5">a.n. {selected.bank_account_name}</p>
                </div>
              )}

              {/* Foto KTP */}
              <KtpPhoto url={selected.photo_ktp_url} />

              {/* Alasan suspend */}
              {!!selected.is_suspended && !!selected.suspension_reason && (
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Alasan Suspend</p>
                  <p className="text-sm text-red-700">{selected.suspension_reason}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="px-6 py-5 border-t border-gray-100 space-y-2 sticky bottom-0 bg-white">
              {!selected.is_verified && !selected.is_suspended && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerify(selected)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Verifikasi
                  </button>
                  <button
                    onClick={() => handleReject(selected)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Tolak
                  </button>
                </div>
              )}
              {!!selected.is_verified && !selected.is_suspended && (
                <button
                  onClick={() => setShowSuspendModal(true)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  <ShieldOff className="w-4 h-4" /> Suspend Kurir
                </button>
              )}
              {!!selected.is_suspended && (
                <button
                  onClick={() => handleUnsuspend(selected)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 disabled:opacity-50 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" /> Cabut Suspend
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSuspendModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">Suspend Kurir</h3>
            <p className="text-sm text-gray-500 mb-4">Masukkan alasan suspend untuk <strong>{selected?.user.name}</strong></p>
            <textarea
              rows={3}
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              placeholder="Alasan suspend..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowSuspendModal(false); setSuspendReason(""); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSuspend}
                disabled={!suspendReason.trim() || actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
