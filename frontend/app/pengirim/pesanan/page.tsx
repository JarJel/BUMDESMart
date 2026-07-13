"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default function PengirimPesananPage() {
  const toast = useToast();
  const [tab, setTab] = useState<"available" | "active">("available");
  const [available, setAvailable] = useState<any[]>([]);
  const [active, setActive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [avRes, acRes] = await Promise.all([
        api.get("/driver/orders/available"),
        api.get("/driver/orders/active"),
      ]);
      setAvailable(avRes.data.data ?? []);
      setActive(acRes.data.data ?? []);
    } catch {
      toast.error("Gagal memuat pesanan.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const accept = async (id: number) => {
    setAcceptingId(id);
    try {
      await api.post(`/driver/orders/${id}/accept`);
      toast.success("Pesanan berhasil diambil!");
      fetchOrders();
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
      toast.success(status === "shipped" ? "Ditandai: Sedang Dikirim" : "Pengiriman selesai!");
      fetchOrders();
    } catch {
      toast.error("Gagal update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const TABS = [
    { key: "available", label: "Tersedia", count: available.length },
    { key: "active",    label: "Aktif",    count: active.length },
  ] as const;

  const orders = tab === "available" ? available : active;

  return (
    <div className="p-5 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pesanan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pilih dan kelola pesanan pengirimanmu</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">
            {tab === "available" ? "Belum ada pesanan tersedia." : "Kamu tidak punya pengiriman aktif."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">{order.order_code}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold" style={{ color: "#EA580C" }}>{formatRp(Number(order.total))}</p>
                  <p className="text-xs text-gray-400">{(order.items ?? []).length} item</p>
                </div>
              </div>

              {/* Produk */}
              <div className="space-y-1">
                {(order.items ?? []).slice(0, 2).map((item: any) => (
                  <p key={item.id} className="text-xs text-gray-600">
                    • {item.product_name} ({item.quantity}×)
                  </p>
                ))}
                {(order.items ?? []).length > 2 && (
                  <p className="text-xs text-gray-400">+{order.items.length - 2} lainnya</p>
                )}
              </div>

              {/* Alamat */}
              {order.address && (
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-xs font-medium text-gray-700">
                    {order.address.recipient_name ?? order.address.name}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {order.address.address ?? order.address.address_line}, {order.address.city}
                  </p>
                </div>
              )}

              {/* Actions */}
              {tab === "available" && (
                <button onClick={() => accept(order.id)} disabled={acceptingId === order.id}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#EA580C" }}>
                  {acceptingId === order.id ? "Memproses..." : "Ambil Pesanan Ini"}
                </button>
              )}
              {tab === "active" && (
                <div className="flex gap-2">
                  {order.status !== "shipped" && (
                    <button onClick={() => updateStatus(order.id, "shipped")}
                      disabled={updatingId === order.id}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      style={{ background: "#EA580C" }}>
                      {updatingId === order.id ? "..." : "Tandai Dikirim"}
                    </button>
                  )}
                  {order.status === "shipped" && (
                    <button onClick={() => updateStatus(order.id, "delivered")}
                      disabled={updatingId === order.id}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      style={{ background: "var(--primary)" }}>
                      {updatingId === order.id ? "..." : "Selesai Diantar"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
