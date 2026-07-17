"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import {
  Search, X, CheckCircle, XCircle, AlertTriangle,
  Phone, Clock, Car, CreditCard, MapPin
} from "lucide-react";

interface Driver {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  vehicle_brand: string | null;
  vehicle_plate: string;
  vehicle_year: number | null;
  sim_type: string | null;
  id_number: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  is_verified: number | boolean;
  is_suspended: number | boolean;
  is_available: number | boolean;
  suspension_reason: string | null;
  total_deliveries: number;
  rating: number;
  photo_profile_url: string | null;
  photo_ktp_url: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  unverified: number;
  verified: number;
  suspended: number;
}

const VEHICLE_LABEL: Record<string, string> = {
  motor: "Motor", mobil: "Mobil", pickup_box: "Pickup Box", pickup_bak: "Pickup Bak",
};

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ driver }: { driver: Driver }) {
  if (!!driver.is_suspended)
    return <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-red-50 text-red-600 border border-red-200">Disuspend</span>;
  if (!!driver.is_verified)
    return <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-50 text-green-700 border border-green-200">Terverifikasi</span>;
  return <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">Menunggu Verifikasi</span>;
}

function KtpPhoto({ url }: { url: string | null }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return (
      <div className="w-full h-40 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
        <p className="text-xs text-gray-400">Tidak ada foto KTP</p>
      </div>
    );
  }
  return (
    <img
      src={url} alt="KTP"
      className="w-full h-40 object-cover rounded-xl border border-gray-200"
      onError={() => setBroken(true)}
    />
  );
}

function SuspendModal({
  driver,
  onClose,
  onConfirm,
  loading,
}: {
  driver: Driver;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Suspend Kurir</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <p className="text-sm text-gray-600">Kurir <strong>{driver.name}</strong> tidak akan bisa menerima pesanan selama disuspend.</p>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Alasan Penangguhan <span className="text-red-500">*</span></label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Contoh: Laporan dari pembeli, pelanggaran SOP pengiriman..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none"
          />
          {!reason.trim() && reason.length > 0 && (
            <p className="text-xs text-red-500 mt-1">Alasan penangguhan wajib diisi.</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Batal</button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Konfirmasi Suspend"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DriverDrawer({
  driver,
  onClose,
  onVerify,
  onReject,
  onSuspend,
  onUnsuspend,
  actioning,
}: {
  driver: Driver;
  onClose: () => void;
  onVerify: (id: number) => void;
  onReject: (id: number) => void;
  onSuspend: (driver: Driver) => void;
  onUnsuspend: (id: number) => void;
  actioning: number | null;
}) {
  const loading = actioning === driver.id;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900">Detail Kurir</h2>
            <p className="text-xs text-gray-500 mt-0.5">Terdaftar {formatDate(driver.created_at)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-5 flex-1">
          {/* Photo + Status */}
          <div className="flex items-center gap-4">
            {driver.photo_profile_url ? (
              <img src={driver.photo_profile_url} alt="" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-400">
                {driver.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900 text-base">{driver.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{driver.email}</p>
              <div className="mt-1"><StatusBadge driver={driver} /></div>
            </div>
          </div>

          {/* Suspend reason */}
          {!!driver.is_suspended && driver.suspension_reason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700">Alasan Penangguhan</p>
                <p className="text-xs text-red-600 mt-0.5">{driver.suspension_reason}</p>
              </div>
            </div>
          )}

          {/* Info grid */}
          <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400">No. Telepon</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">{driver.phone || "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400">Jenis Kendaraan</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Car className="w-3 h-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">{VEHICLE_LABEL[driver.vehicle_type] ?? driver.vehicle_type}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400">Merek / Tahun</p>
              <p className="text-sm font-medium text-gray-900">{driver.vehicle_brand || "—"} {driver.vehicle_year ? `(${driver.vehicle_year})` : ""}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Plat Nomor</p>
              <p className="text-sm font-bold text-gray-900 font-mono">{driver.vehicle_plate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tipe SIM</p>
              <p className="text-sm font-medium text-gray-900">{driver.sim_type || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">NIK</p>
              <p className="text-sm font-medium text-gray-900">{driver.id_number || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Pengiriman</p>
              <p className="text-sm font-bold text-gray-900">{driver.total_deliveries}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Rating</p>
              <p className="text-sm font-bold text-gray-900">{driver.rating > 0 ? driver.rating.toFixed(1) : "—"}</p>
            </div>
          </div>

          {/* Bank */}
          {(driver.bank_name || driver.bank_account_number) && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rekening Bank</p>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{driver.bank_name}</p>
                  <p className="text-xs text-gray-500">{driver.bank_account_number} · {driver.bank_account_name}</p>
                </div>
              </div>
            </div>
          )}

          {/* KTP Photo */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Foto KTP</p>
            <KtpPhoto url={driver.photo_ktp_url} />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 border-t border-gray-100 space-y-2 sticky bottom-0 bg-white">
          {!!((!driver.is_verified) && (!driver.is_suspended)) && (
            <>
              <button
                onClick={() => onVerify(driver.id)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? "Memproses..." : "Verifikasi Kurir"}
              </button>
              <button
                onClick={() => onReject(driver.id)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Tolak Pendaftaran
              </button>
            </>
          )}
          {!!driver.is_verified && !driver.is_suspended && (
            <button
              onClick={() => onSuspend(driver)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Suspend Kurir
            </button>
          )}
          {!!driver.is_suspended && (
            <button
              onClick={() => onUnsuspend(driver.id)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? "Memproses..." : "Cabut Suspend"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function BumdesKurirPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [selected, setSelected] = useState<Driver | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Driver | null>(null);
  const [actioning, setActioning] = useState<number | null>(null);
  const toast = useToast();

  const fetchData = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (vehicleFilter) params.vehicle_type = vehicleFilter;

    Promise.all([
      api.get("/admin/drivers", { params }),
      api.get("/admin/drivers/stats"),
    ])
      .then(([driversRes, statsRes]) => {
        setDrivers(driversRes.data.data ?? []);
        setStats(statsRes.data.data ?? null);
      })
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }, [search, statusFilter, vehicleFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doAction = async (
    id: number,
    endpoint: string,
    body?: Record<string, string>,
    successMsg?: string,
  ) => {
    setActioning(id);
    try {
      await api.patch(endpoint, body);
      toast.success(successMsg ?? "Berhasil.");
      fetchData();
      setSelected(null);
      setSuspendTarget(null);
    } catch {
      toast.error("Gagal memperbarui data kurir. Coba lagi.");
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kelola Kurir</h1>
        <p className="text-sm text-gray-500 mt-0.5">Verifikasi dan pantau kurir yang terdaftar di BUMDes Anda</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Kurir", value: stats.total, color: "text-gray-900" },
            { label: "Menunggu Verifikasi", value: stats.unverified, color: "text-yellow-600" },
            { label: "Terverifikasi", value: stats.verified, color: "text-green-700" },
            { label: "Disuspend", value: stats.suspended, color: "text-red-600" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau plat..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
        >
          <option value="">Semua Status</option>
          <option value="unverified">Menunggu Verifikasi</option>
          <option value="verified">Terverifikasi</option>
          <option value="suspended">Disuspend</option>
        </select>
        <select
          value={vehicleFilter}
          onChange={e => setVehicleFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
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
          <div className="text-center py-16 text-sm text-gray-400">Memuat data kurir...</div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">
            Belum ada kurir yang terdaftar di BUMDes ini.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {drivers.map(d => (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className="w-full text-left px-5 py-4 hover:bg-gray-50/80 transition-colors flex items-center gap-4"
              >
                {d.photo_profile_url ? (
                  <img src={d.photo_profile_url} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-400 flex-shrink-0">
                    {d.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{d.name}</span>
                    <StatusBadge driver={d} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {VEHICLE_LABEL[d.vehicle_type]} · {d.vehicle_plate}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" /> {formatDate(d.created_at)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{d.total_deliveries} pengiriman</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <DriverDrawer
          driver={selected}
          onClose={() => setSelected(null)}
          onVerify={id => doAction(id, `/admin/drivers/${id}/verify`, undefined, "Kurir berhasil diverifikasi.")}
          onReject={id => doAction(id, `/admin/drivers/${id}/reject`, undefined, "Pendaftaran kurir ditolak.")}
          onSuspend={d => { setSuspendTarget(d); }}
          onUnsuspend={id => doAction(id, `/admin/drivers/${id}/unsuspend`, undefined, "Suspend kurir berhasil dicabut.")}
          actioning={actioning}
        />
      )}

      {suspendTarget && (
        <SuspendModal
          driver={suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onConfirm={reason =>
            doAction(suspendTarget.id, `/admin/drivers/${suspendTarget.id}/suspend`, { reason }, "Kurir berhasil disuspend.")
          }
          loading={actioning === suspendTarget.id}
        />
      )}
    </div>
  );
}
