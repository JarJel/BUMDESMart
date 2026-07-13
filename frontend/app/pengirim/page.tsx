"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default function PengirimDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState<any>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch {
      toast.error("Gagal memuat data.");
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
      toast.success("Pesanan berhasil diambil!");
      fetchAll();
    } catch {
      toast.error("Gagal mengambil pesanan.");
    } finally {
      setAcceptingId(null);
    }
  };

  const updateStatus = async (id: number, status: "shipped" | "delivered") => {
    setUpdatingId(id);
    try {
      await api.patch(`/driver/orders/${id}/status`, { status });
      toast.success(status === "shipped" ? "Status: Sedang Dikirim" : "Pengiriman selesai!");
      fetchAll();
    } catch {
      toast.error("Gagal update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const STAT_CARDS = [
    { label: "Hari Ini", value: stats?.today_deliveries ?? 0, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Total Selesai", value: stats?.total_deliveries ?? 0, icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
    { label: "Tersedia", value: stats?.available_orders ?? 0, icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
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
        {STAT_CARDS.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center" style={{ background: "#FFF7ED" }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: "#EA580C", width: "18px", height: "18px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={c.icon} />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Pengiriman Aktif ({activeOrders.length})
          </h2>
          <div className="space-y-3">
            {activeOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{order.order_code}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.address?.city ?? "-"} · {(order.items ?? []).length} item
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                    style={order.status === "shipped"
                      ? { background: "#ECFDF5", color: "#065F46" }
                      : { background: "#EFF6FF", color: "#1D4ED8" }}>
                    {order.status === "shipped" ? "Dikirim" : "Siap Ambil"}
                  </span>
                </div>
                {order.address && (
                  <p className="text-xs text-gray-600 mb-3 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                    {order.address.recipient_name ?? order.address.name} ·{" "}
                    {order.address.address ?? order.address.address_line}, {order.address.city}
                  </p>
                )}
                <div className="flex gap-2">
                  {order.status !== "shipped" && (
                    <button onClick={() => updateStatus(order.id, "shipped")}
                      disabled={updatingId === order.id}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      style={{ background: "#EA580C" }}>
                      {updatingId === order.id ? "..." : "Tandai Dikirim"}
                    </button>
                  )}
                  {order.status === "shipped" && (
                    <button onClick={() => updateStatus(order.id, "delivered")}
                      disabled={updatingId === order.id}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      style={{ background: "var(--primary)" }}>
                      {updatingId === order.id ? "..." : "Selesai Diantar"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Orders preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Pesanan Tersedia ({availableOrders.length})
          </h2>
          <Link href="/pengirim/pesanan" className="text-xs font-semibold" style={{ color: "#EA580C" }}>
            Lihat Semua
          </Link>
        </div>
        {availableOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-500">Belum ada pesanan tersedia saat ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableOrders.slice(0, 5).map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{order.order_code}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.address?.city ?? "-"} · {(order.items ?? []).length} item · {formatRp(Number(order.total))}
                    </p>
                  </div>
                  <button
                    onClick={() => acceptOrder(order.id)}
                    disabled={acceptingId === order.id}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 shrink-0 disabled:opacity-50"
                    style={{ background: "#EA580C" }}>
                    {acceptingId === order.id ? "..." : "Ambil"}
                  </button>
                </div>
                {order.address && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 truncate">
                    {order.address.address ?? order.address.address_line}, {order.address.city}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
