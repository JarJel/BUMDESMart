"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import { ChevronRight, ClipboardList, MessageCircle, Navigation, Package, RefreshCw } from "lucide-react";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function openWA(phone: string | undefined, msg: string) {
  if (!phone) return;
  const clean = phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, "_blank");
}

export default function PengirimPesananPage() {
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<"available" | "active">("available");
  const [available, setAvailable] = useState<any[]>([]);
  const [active, setActive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notVerified, setNotVerified] = useState(false);
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
      setNotVerified(false);
    } catch (err: any) {
      if (err?.response?.status === 403 && err?.response?.data?.is_verified === false) {
        setNotVerified(true);
      } else {
        toast.error("Gagal memuat pesanan.");
      }
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
      toast.success("Pesanan diambil! Segera menuju toko.");
      fetchOrders();
      setTab("active");
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
      fetchOrders();
    } catch {
      toast.error("Gagal update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (notVerified) {
    return (
      <div className="flex flex-col items-center justify-center h-64 px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
          <svg fill="none" stroke="#F97316" strokeWidth={1.5} viewBox="0 0 24 24" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Akun Belum Diverifikasi</h2>
          <p className="text-sm text-gray-500 mt-1">Tunggu verifikasi dari admin BUMDes terlebih dahulu.</p>
        </div>
      </div>
    );
  }

  const TABS = [
    { key: "available", label: "Tersedia", count: available.length },
    { key: "active",    label: "Aktif",    count: active.length },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-5 lg:p-6">
      <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-orange-600 to-orange-500 px-4 py-5 text-white sm:px-5">
          <div className="min-w-0">
            <h1 className="text-xl font-bold">Daftar Pesanan</h1>
            <p className="mt-0.5 text-sm text-orange-50">Pilih dan kelola pengirimanmu</p>
          </div>
          <button onClick={fetchOrders} className="rounded-xl bg-white/15 p-2 text-white transition-colors hover:bg-white/25">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div className="px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{available.length}</p>
            <p className="text-xs text-gray-500">Tersedia</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{active.length}</p>
            <p className="text-xs text-gray-500">Aktif</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-100">
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
      ) : tab === "available" ? (
        /* ── AVAILABLE ORDERS ── */
        <div className="space-y-3">
          {available.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center text-sm text-gray-400 shadow-sm">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <ClipboardList className="h-10 w-10" />
              </div>
              <p className="font-semibold text-gray-600">Belum ada pesanan tersedia</p>
              <p className="mt-1 text-xs text-gray-400">Pesanan baru akan muncul otomatis saat tersedia.</p>
            </div>
          ) : (
            available.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Bagian kartu atas dapat diklik untuk detail */}
                <button
                  onClick={() => router.push(`/pengirim/pesanan/${order.id}`)}
                  className="w-full p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors animate-fade-in"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <span className="block text-xs font-mono text-gray-400">{order.order_code}</span>
                      <span className="text-base font-bold text-orange-500">{formatRp(order.earning ?? 0)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-orange-500">
                      Lihat Detail
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center min-[420px]:grid-cols-3 mb-3">
                    <div className="bg-gray-50 rounded-xl py-2">
                      <p className="text-xs font-bold text-gray-900">{order.total_weight_kg ?? 0} kg</p>
                      <p className="text-xs text-gray-500">Berat</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl py-2">
                      <p className="text-xs font-bold text-gray-900">{order.distance_km != null ? `${order.distance_km} km` : "—"}</p>
                      <p className="text-xs text-gray-500">Jarak</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl py-2">
                      <p className="text-xs font-bold text-gray-900">{order.items?.length ?? 0}</p>
                      <p className="text-xs text-gray-500">Item</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <p className="min-w-0 flex-1 break-words text-xs text-gray-700">
                        <span className="font-semibold">{order.pickup_from?.name}</span>
                        {order.pickup_from?.address ? ` · ${order.pickup_from.address}` : ""}
                      </p>
                    </div>
                    <div className="ml-1 border-l border-dashed border-gray-300 h-3" />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      <p className="min-w-0 flex-1 break-words text-xs text-gray-700">
                        <span className="font-semibold">{order.deliver_to?.recipient_name}</span>
                        {order.deliver_to?.city ? ` · ${order.deliver_to.city}` : ""}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Tombol Ambil di bagian bawah */}
                <div className="border-t border-gray-100 p-3 sm:px-5">
                  <button
                    onClick={() => accept(order.id)}
                    disabled={acceptingId === order.id || active.length >= 1}
                    className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {acceptingId === order.id ? "Mengambil..." :
                     active.length >= 1 ? "Selesaikan pesanan aktif dulu" :
                     "Ambil Pesanan Ini"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── ACTIVE ORDERS ── */
        <div className="space-y-3">
          {active.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center text-sm text-gray-400 shadow-sm">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-600">
                <Navigation className="h-10 w-10" />
              </div>
              <p className="font-semibold text-gray-600">Tidak ada pengiriman aktif</p>
              <p className="mt-1 text-xs text-gray-400">Ambil pesanan tersedia untuk mulai mengantar.</p>
            </div>
          ) : (
            active.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header kartu dapat diklik untuk detail */}
                <button
                  onClick={() => router.push(`/pengirim/pesanan/${order.id}`)}
                  className="w-full p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <span className="block text-xs font-mono text-gray-400">{order.order_code}</span>
                      <span className={`mt-1 inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        order.status === "picking_up" ? "bg-orange-50 text-orange-600" :
                        order.status === "shipped"    ? "bg-purple-50 text-purple-600" : "bg-green-50 text-green-700"
                      }`} style={order.status === "picking_up" ? { color: "#ea580c", backgroundColor: "#fff7ed" } : {}}>
                        {order.status === "picking_up" ? "Menuju Toko" :
                         order.status === "shipped"    ? "Sedang Diantar" : "Selesai"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-base font-bold text-orange-500">{formatRp(order.earning ?? order.shipping_cost ?? 0)}</span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-orange-500 mt-1">
                        Lihat Detail
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Route dengan info pickup & deliver */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Package className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Ambil di toko</p>
                        <p className="break-words text-sm font-semibold text-gray-900">{order.pickup_from?.name}</p>
                        <p className="break-words text-xs text-gray-500">{order.pickup_from?.address}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Mencegah terpicunya navigasi detail
                          openWA(order.pickup_from?.phone, `Halo, saya kurir BUMDESMart untuk pesanan #${order.order_code}. Saya sedang dalam perjalanan ke toko.`);
                        }}
                        disabled={!order.pickup_from?.phone}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center disabled:opacity-30"
                      >
                        <MessageCircle className="w-4 h-4 text-white" />
                      </button>
                    </div>

                    <div className="ml-3.5 border-l-2 border-dashed border-gray-200 h-4" />

                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Antar ke — <span className="font-semibold text-gray-700">{order.deliver_to?.recipient_name}</span></p>
                        <p className="break-words text-sm font-semibold text-gray-900">{order.deliver_to?.address}</p>
                        <p className="text-xs text-gray-500">{order.deliver_to?.city}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Mencegah terpicunya navigasi detail
                          openWA(order.deliver_to?.phone, `Halo ${order.deliver_to?.recipient_name ?? ""}, saya kurir BUMDESMart. Sedang mengantarkan pesanan #${order.order_code}. Bisa konfirmasi alamat? Terima kasih.`);
                        }}
                        disabled={!order.deliver_to?.phone}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center disabled:opacity-30"
                      >
                        <MessageCircle className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </button>

                {/* Action button */}
                <div className="border-t border-gray-100 p-3 sm:px-5">
                  {order.status === "picking_up" && (
                    <button
                      onClick={() => updateStatus(order.id, "shipped")}
                      disabled={updatingId === order.id}
                      className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      {updatingId === order.id ? "Memproses..." : "Barang Sudah Diambil — Mulai Antar"}
                    </button>
                  )}
                  {order.status === "shipped" && (
                    <button
                      onClick={() => updateStatus(order.id, "delivered")}
                      disabled={updatingId === order.id}
                      className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {updatingId === order.id ? "Memproses..." : "Pesanan Sudah Diterima Pembeli"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
