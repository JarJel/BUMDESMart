"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import { BarChart3, MessageCircle, Navigation, Package, Power, RefreshCw, Star, Wallet } from "lucide-react";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function openWA(phone: string | undefined, msg: string) {
  if (!phone) return;
  const clean = phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, "_blank");
}

const STATUS_LABEL: Record<string, string> = {
  picking_up: "Menuju Toko",
  shipped:    "Sedang Diantar",
  delivered:  "Selesai",
};

export default function PengirimDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState<any>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notVerified, setNotVerified] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, activeRes, availRes] = await Promise.all([
        api.get("/driver/stats"),
        api.get("/driver/orders/active"),
        api.get("/driver/orders/available"),
      ]);
      setStats(statsRes.data.data);
      setActiveOrders(activeRes.data.data ?? []);
      setAvailableOrders(availRes.data.data ?? []);
      setNotVerified(false);
    } catch (err: any) {
      if (err?.response?.status === 403 && err?.response?.data?.is_verified === false) {
        setNotVerified(true);
      } else {
        toast.error("Gagal memuat data.");
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleAvailability = async () => {
    setTogglingAvail(true);
    try {
      const res = await api.patch("/driver/profile/availability");
      setStats((prev: any) => ({ ...prev, is_available: res.data.is_available }));
      toast.success(res.data.message);
    } catch {
      toast.error("Gagal mengubah status.");
    } finally {
      setTogglingAvail(false);
    }
  };

  const acceptOrder = async (id: number) => {
    setAcceptingId(id);
    try {
      await api.post(`/driver/orders/${id}/accept`);
      toast.success("Pesanan diambil! Segera menuju toko.");
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Gagal mengambil pesanan.");
    } finally {
      setAcceptingId(null);
    }
  };

  const updateStatus = async (id: number, status: "shipped" | "delivered") => {
    setUpdatingId(id);
    try {
      await api.patch(`/driver/orders/${id}/status`, { status });
      toast.success(status === "shipped" ? "Status: Sedang Diantar ke Pembeli" : "Pengiriman selesai!");
      fetchAll();
    } catch {
      toast.error("Gagal update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (notVerified) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#FFF7ED" }}>
          <svg fill="none" stroke="#F97316" strokeWidth={1.5} viewBox="0 0 24 24" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Akun Belum Diverifikasi</h2>
          <p className="text-sm text-gray-500 mt-1">
            Pendaftaran kamu sedang ditinjau oleh admin BUMDes.<br />
            Kamu akan bisa mulai menerima pesanan setelah akun diverifikasi.
          </p>
        </div>
        <p className="text-xs text-gray-400">Proses verifikasi biasanya memakan waktu 1–2 hari kerja.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-5 lg:p-6">
      <section className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-orange-600 to-orange-500 px-4 py-5 text-white sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold ring-2 ring-white/30">
                P
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold">Pengirim BUMDESMart</h1>
                <p className="mt-0.5 text-sm text-orange-50">
                  {stats?.is_available ? "Status kerja aktif" : "Status kerja tidak aktif"}
                </p>
              </div>
            </div>
            <button
              onClick={fetchAll}
              className="rounded-xl bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
              aria-label="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/12 px-3 py-2">
              <div className="flex items-center gap-2 text-orange-50">
                <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                <span className="text-xs">Rating</span>
              </div>
              <p className="mt-1 text-lg font-bold">{stats?.rating ? Number(stats.rating).toFixed(2) : "5.00"}</p>
            </div>
            <div className="rounded-xl bg-white/12 px-3 py-2">
              <div className="flex items-center gap-2 text-orange-50">
                <BarChart3 className="h-4 w-4 text-yellow-200" />
                <span className="text-xs">Selesai</span>
              </div>
              <p className="mt-1 text-lg font-bold">{stats?.total_deliveries ?? 0} pesanan</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-gray-100 text-center text-sm font-semibold">
          <div className="px-3 py-3 text-gray-500">Area Tersedia</div>
          <div className="border-b-2 border-orange-500 px-3 py-3 text-orange-600">Daftar Pesanan</div>
        </div>

        <div className="p-4 sm:p-5">
          <button
            onClick={toggleAvailability}
            disabled={togglingAvail}
            className={`flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all disabled:opacity-50 ${
              stats?.is_available ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/25">
              <Power className="h-4 w-4" />
            </span>
            {stats?.is_available ? "Berhenti Menerima Pesanan" : "Mulai Menerima Pesanan"}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Wallet className="h-4 w-4" />
              Saldo Pengirim
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatRp(stats?.balance?.available ?? 0)}
            </p>
            <p className="mt-1 text-xs text-gray-500">Saldo tersedia dari ongkir pesanan selesai.</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Tersedia
          </span>
        </div>
        <div className="grid grid-cols-2 border-t border-gray-100">
          <div className="px-4 py-3 sm:px-5">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="mt-1 text-sm font-bold text-gray-900">{formatRp(stats?.balance?.pending ?? 0)}</p>
          </div>
          <div className="border-l border-gray-100 px-4 py-3 sm:px-5">
            <p className="text-xs text-gray-500">Sudah Dicairkan</p>
            <p className="mt-1 text-sm font-bold text-gray-900">{formatRp(stats?.balance?.withdrawn ?? 0)}</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        {[
          { label: "Hari Ini", value: stats?.today_deliveries ?? 0 },
          { label: "Total Selesai", value: stats?.total_deliveries ?? 0 },
          { label: "Tersedia", value: stats?.available_orders ?? 0 },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Pesanan Aktif */}
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-700">Pesanan Aktif</h2>
          {activeOrders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-sm sm:p-5">
              {/* Header order */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="break-all text-xs font-bold text-gray-900">{order.order_code}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  order.status === "picking_up" ? "bg-orange-50 text-orange-600" :
                  order.status === "shipped"    ? "bg-purple-50 text-purple-600" : "bg-green-50 text-green-700"
                }`}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>

              {/* Earning */}
              <div className="bg-orange-50 rounded-xl px-4 py-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-orange-600 font-medium">Penghasilan kamu</span>
                <span className="text-base font-bold text-orange-600">{formatRp(order.earning ?? order.shipping_cost ?? 0)}</span>
              </div>

              {/* Route info */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Package className="w-3 h-3 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Ambil di</p>
                    <p className="text-sm font-semibold text-gray-900">{order.pickup_from?.name}</p>
                    <p className="break-words text-xs text-gray-500">{order.pickup_from?.address}</p>
                  </div>
                  {order.pickup_from?.phone && (
                    <button onClick={() => openWA(order.pickup_from.phone, `Halo, saya kurir BUMDESMart untuk pesanan #${order.order_code}. Saya sedang dalam perjalanan ke toko.`)}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                <div className="ml-3 border-l-2 border-dashed border-gray-200 h-4" />

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Navigation className="w-3 h-3 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500">Antar ke — {order.deliver_to?.recipient_name}</p>
                    <p className="break-words text-sm font-semibold text-gray-900">{order.deliver_to?.address}</p>
                    <p className="text-xs text-gray-500">{order.deliver_to?.city}</p>
                  </div>
                  {order.deliver_to?.phone && (
                    <button onClick={() => openWA(order.deliver_to.phone, `Halo ${order.deliver_to?.recipient_name ?? ""}, saya kurir BUMDESMart. Saya sedang mengantar pesanan Anda #${order.order_code}. Bisa konfirmasi alamat pengiriman?`)}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tombol aksi */}
              {order.status === "picking_up" && (
                <button
                  onClick={() => updateStatus(order.id, "shipped")}
                  disabled={updatingId === order.id}
                  className="w-full py-3 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {updatingId === order.id ? "Memproses..." : "Barang Sudah Diambil — Mulai Antar"}
                </button>
              )}
              {order.status === "shipped" && (
                <button
                  onClick={() => updateStatus(order.id, "delivered")}
                  disabled={updatingId === order.id}
                  className="w-full py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {updatingId === order.id ? "Memproses..." : "Pesanan Sudah Diterima Pembeli"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pesanan Tersedia */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700">Pesanan Tersedia</h2>
          <button onClick={fetchAll} className="text-xs text-orange-500 font-medium">Refresh</button>
        </div>

        {availableOrders.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center text-sm text-gray-400 shadow-sm">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <Package className="h-10 w-10" />
            </div>
            <p className="font-semibold text-gray-600">Belum ada pesanan tersedia</p>
            <p className="mt-1 text-xs text-gray-400">Aktifkan status kerja dan tunggu pesanan baru masuk.</p>
          </div>
        ) : (
          availableOrders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm sm:p-5">
              {/* Earning highlight */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="break-all text-xs text-gray-500">{order.order_code}</span>
                <span className="text-base font-bold text-orange-500">{formatRp(order.earning ?? 0)}</span>
              </div>

              {/* Info singkat */}
              <div className="grid grid-cols-1 gap-2 text-center min-[420px]:grid-cols-3">
                <div className="bg-gray-50 rounded-xl py-2">
                  <p className="text-xs font-bold text-gray-900">{order.total_weight_kg ?? 0} kg</p>
                  <p className="text-xs text-gray-500">Berat</p>
                </div>
                <div className="bg-gray-50 rounded-xl py-2">
                  <p className="text-xs font-bold text-gray-900">{order.distance_km != null ? `${order.distance_km} km` : "—"}</p>
                  <p className="text-xs text-gray-500">Jarak</p>
                </div>
                <div className="bg-gray-50 rounded-xl py-2">
                  <p className="text-xs font-bold text-gray-900">{(order.items?.length ?? 0)} produk</p>
                  <p className="text-xs text-gray-500">Item</p>
                </div>
              </div>

              {/* Route */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <p className="min-w-0 flex-1 break-words text-xs text-gray-700">
                    <span className="font-semibold">{order.pickup_from?.name}</span> · {order.pickup_from?.address}
                  </p>
                </div>
                <div className="ml-1 border-l border-dashed border-gray-300 h-3" />
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <p className="min-w-0 flex-1 break-words text-xs text-gray-700">
                    <span className="font-semibold">{order.deliver_to?.recipient_name}</span> · {order.deliver_to?.city}
                  </p>
                </div>
              </div>

              <button
                onClick={() => acceptOrder(order.id)}
                disabled={acceptingId === order.id || (activeOrders.length >= 1)}
                className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {acceptingId === order.id ? "Mengambil..." :
                 activeOrders.length >= 1 ? "Selesaikan pesanan aktif dulu" :
                 "Ambil Pesanan Ini"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
