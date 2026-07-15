"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import { MessageCircle, MapPin, Package, Navigation } from "lucide-react";

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
    <div className="p-5 space-y-5">
      {/* Header + Online toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pengiriman hari ini</p>
        </div>
        <button
          onClick={toggleAvailability}
          disabled={togglingAvail}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={stats?.is_available
            ? { background: "#ECFDF5", color: "#065F46", border: "1.5px solid #6EE7B7" }
            : { background: "#F3F4F6", color: "#6B7280", border: "1.5px solid #E5E7EB" }}>
          <div className={`w-2.5 h-2.5 rounded-full ${stats?.is_available ? "bg-green-500" : "bg-gray-400"}`} />
          {stats?.is_available ? "Online" : "Offline"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Hari Ini", value: stats?.today_deliveries ?? 0 },
          { label: "Total Selesai", value: stats?.total_deliveries ?? 0 },
          { label: "Tersedia", value: stats?.available_orders ?? 0 },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
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
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
              {/* Header order */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">{order.order_code}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  order.status === "picking_up" ? "bg-orange-50 text-orange-600" :
                  order.status === "shipped"    ? "bg-purple-50 text-purple-600" : "bg-green-50 text-green-700"
                }`}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>

              {/* Earning */}
              <div className="bg-orange-50 rounded-xl px-4 py-2 flex items-center justify-between">
                <span className="text-xs text-orange-600 font-medium">Penghasilan kamu</span>
                <span className="text-base font-bold text-orange-600">{formatRp(order.earning ?? order.shipping_cost ?? 0)}</span>
              </div>

              {/* Route info */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Package className="w-3 h-3 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Ambil di</p>
                    <p className="text-sm font-semibold text-gray-900">{order.pickup_from?.name}</p>
                    <p className="text-xs text-gray-500">{order.pickup_from?.address}</p>
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
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Antar ke — {order.deliver_to?.recipient_name}</p>
                    <p className="text-sm font-semibold text-gray-900">{order.deliver_to?.address}</p>
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
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Belum ada pesanan tersedia saat ini.
          </div>
        ) : (
          availableOrders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              {/* Earning highlight */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{order.order_code}</span>
                <span className="text-base font-bold text-orange-500">{formatRp(order.earning ?? 0)}</span>
              </div>

              {/* Info singkat */}
              <div className="grid grid-cols-3 gap-2 text-center">
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
                  <p className="text-xs text-gray-700 flex-1 truncate">
                    <span className="font-semibold">{order.pickup_from?.name}</span> · {order.pickup_from?.address}
                  </p>
                </div>
                <div className="ml-1 border-l border-dashed border-gray-300 h-3" />
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <p className="text-xs text-gray-700 flex-1 truncate">
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
