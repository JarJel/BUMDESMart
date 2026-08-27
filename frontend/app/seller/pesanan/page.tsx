"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import {
  Search, X, CheckCircle, XCircle, Package, MessageCircle,
  MapPin, Phone, Clock, ChevronRight, Truck, Home, ExternalLink,
} from "lucide-react";

interface OrderItem {
  id: number;
  product: { id: number; name: string; slug: string };
  product_name: string;
  quantity: number;
  product_price: number;
  variant_option?: { value: string };
}

interface Order {
  id: number;
  order_code: string;
  status: string;
  delivery_type: "pickup" | "delivered";
  shipping_method: string | null;
  total: number;
  shipping_cost: number;
  created_at: string;
  customer: { user: { name: string; phone?: string; email: string } };
  address: {
    label: string;
    address: string;
    city: string;
    province: string;
    postal_code: string;
    recipient_name: string;
    phone: string;
  } | null;
  items: OrderItem[];
  driver?: { id: number; name: string; phone?: string } | null;
  shipment?: { tracking_number: string | null; status: string | null } | null;
}

function deliveryMode(order: Order): "pickup" | "ekspedisi" | "kurir_lokal" {
  if (order.delivery_type === "pickup") return "pickup";
  if (order.shipping_method && !order.shipping_method.startsWith("kurir-lokal")) return "ekspedisi";
  return "kurir_lokal";
}

function ekspedisiLabel(method: string | null): string {
  if (!method) return "Ekspedisi";
  const map: Record<string, string> = {
    "ekspedisi-jne-reg": "JNE REG",
    "ekspedisi-jne-yes": "JNE YES",
    "ekspedisi-jnt-ez":  "J&T EZ",
    "ekspedisi-tiki-reg": "TIKI REG",
    "ekspedisi-pos-biasa": "POS Biasa",
  };
  return map[method] ?? method.replace("ekspedisi-", "").toUpperCase();
}

const STATUS_LABEL: Record<string, string> = {
  pending:           "Perlu Dikonfirmasi",
  confirmed:         "Diproses",
  ready_for_pickup:  "Siap Diambil",
  picking_up:        "Kurir Menuju Toko",
  shipped:           "Sedang Dikirim",
  delivered:         "Selesai",
  completed:         "Selesai",
  cancelled:         "Dibatalkan",
};

const STATUS_COLOR: Record<string, string> = {
  pending:          "bg-blue-50 text-blue-700 border border-blue-200",
  confirmed:        "bg-yellow-50 text-yellow-700 border border-yellow-200",
  ready_for_pickup: "bg-teal-50 text-teal-700 border border-teal-200",
  picking_up:       "bg-orange-50 text-orange-600 border border-orange-200",
  shipped:          "bg-purple-50 text-purple-600 border border-purple-200",
  delivered:        "bg-green-50 text-green-700 border border-green-200",
  completed:        "bg-green-50 text-green-700 border border-green-200",
  cancelled:        "bg-red-50 text-red-600 border border-red-200",
};

const TAB_STATUSES: Record<string, string[]> = {
  Semua:             [],
  "Perlu Konfirmasi": ["pending"],
  "Diproses":        ["confirmed"],
  "Siap Diambil":    ["ready_for_pickup"],
  "Dikirim":         ["picking_up", "shipped"],
  "Selesai":         ["delivered", "completed"],
  "Dibatalkan":      ["cancelled"],
};

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatRp(n: number) {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function openWhatsApp(phone: string | undefined, orderCode: string) {
  if (!phone) return;
  const clean = phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
  const text = encodeURIComponent(`Halo, saya penjual BumDesMartNukita. Terkait pesanan #${orderCode}, saya ingin mendiskusikan pesanan Anda.`);
  window.open(`https://wa.me/${clean}?text=${text}`, "_blank");
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function OrderDrawer({
  order,
  onClose,
  onUpdateStatus,
  actioning,
}: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (id: number, status: string, trackingNumber?: string) => Promise<void>;
  actioning: number | null;
}) {
  const [resi, setResi] = useState("");
  const [resiError, setResiError] = useState("");
  const buyerPhone = order.address?.phone || order.customer?.user?.phone;
  const loading = actioning === order.id;
  const mode = deliveryMode(order);

  const handleShipped = async () => {
    if (!resi.trim()) { setResiError("Nomor resi wajib diisi"); return; }
    setResiError("");
    await onUpdateStatus(order.id, "shipped", resi.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900">Detail Pesanan</h2>
            <p className="text-xs text-gray-500 mt-0.5">{order.order_code}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Badge jenis pengiriman */}
            {mode === "pickup" && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                <Home className="w-3 h-3" /> Ambil Sendiri
              </span>
            )}
            {mode === "ekspedisi" && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                <Truck className="w-3 h-3" /> {ekspedisiLabel(order.shipping_method)}
              </span>
            )}
            {mode === "kurir_lokal" && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                <Truck className="w-3 h-3" /> Kurir Desa
              </span>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 flex-1">
          {/* Status + waktu */}
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLOR[order.status] ?? ""}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDate(order.created_at)}
            </span>
          </div>

          {/* Pembeli */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pembeli</p>
            <p className="text-sm font-semibold text-gray-900">{order.customer?.user?.name}</p>
            <p className="text-xs text-gray-500">{order.customer?.user?.email}</p>
            {buyerPhone && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <Phone className="w-3 h-3" /> {buyerPhone}
              </div>
            )}
          </div>

          {/* Alamat — hanya tampil kalau bukan pickup */}
          {mode !== "pickup" && order.address && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Alamat Pengiriman</p>
              <p className="text-sm font-semibold text-gray-900">{order.address.recipient_name}</p>
              <p className="text-xs text-gray-600 mt-0.5">{order.address.address}</p>
              <p className="text-xs text-gray-500">{order.address.city}, {order.address.province} {order.address.postal_code}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <Phone className="w-3 h-3" /> {order.address.phone}
              </div>
            </div>
          )}

          {/* Pickup info */}
          {mode === "pickup" && (
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">Ambil Sendiri</p>
              <p className="text-xs text-teal-600">Pembeli akan datang langsung ke toko untuk mengambil pesanan.</p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Produk Dipesan</p>
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.product_name || item.product?.name}
                      {item.variant_option && (
                        <span className="text-gray-500 font-normal"> — {item.variant_option.value}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatRp(item.product_price)} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatRp(item.product_price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Ongkir</span>
              <span>{order.shipping_cost > 0 ? formatRp(order.shipping_cost) : "Gratis"}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatRp(order.total)}</span>
            </div>
          </div>

          {/* ── Status blocks per mode ─────────────────────────────── */}

          {/* KURIR LOKAL */}
          {mode === "kurir_lokal" && order.status === "confirmed" && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-center">
              <div className="animate-spin w-7 h-7 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm font-semibold text-yellow-700">Sedang Mencari Kurir</p>
              <p className="text-xs text-yellow-600 mt-1">Pesanan dikonfirmasi. Menunggu kurir tersedia mengambil pesanan.</p>
            </div>
          )}
          {mode === "kurir_lokal" && order.status === "picking_up" && (
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-orange-700">Kurir Sedang Menuju Toko</p>
                  <p className="text-xs text-orange-500">Siapkan pesanan untuk diserahkan ke kurir</p>
                </div>
              </div>
              {order.driver && (
                <div className="bg-white rounded-xl p-3 space-y-1">
                  <p className="text-xs text-gray-500">Kurir</p>
                  <p className="text-sm font-semibold text-gray-900">{order.driver.name}</p>
                  {order.driver.phone && (
                    <button
                      onClick={() => openWhatsApp(order.driver?.phone, order.order_code)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-[#25D366] font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Chat Kurir via WhatsApp
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {mode === "kurir_lokal" && order.status === "shipped" && (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
              <p className="text-sm font-semibold text-purple-700 text-center">Sedang Dalam Pengiriman</p>
              <p className="text-xs text-purple-500 text-center mt-1">Kurir sedang mengantarkan pesanan ke pembeli.</p>
              {order.driver?.phone && (
                <button
                  onClick={() => openWhatsApp(order.driver?.phone, order.order_code)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-[#25D366] font-semibold"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Chat Kurir via WhatsApp
                </button>
              )}
            </div>
          )}

          {/* PICKUP */}
          {mode === "pickup" && order.status === "confirmed" && (
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-center">
              <Package className="w-8 h-8 text-teal-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-teal-700">Sedang Dikemas</p>
              <p className="text-xs text-teal-600 mt-1">Setelah barang siap, klik tombol di bawah agar pembeli tahu bisa diambil.</p>
            </div>
          )}
          {mode === "pickup" && order.status === "ready_for_pickup" && (
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-teal-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-teal-700">Menunggu Pembeli Datang</p>
              <p className="text-xs text-teal-600 mt-1">Pembeli sudah mendapat notifikasi. Klik selesai setelah barang diambil.</p>
            </div>
          )}

          {/* EKSPEDISI */}
          {mode === "ekspedisi" && order.status === "confirmed" && (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
              <p className="text-sm font-semibold text-purple-700 mb-1">Input Nomor Resi</p>
              <p className="text-xs text-purple-600 mb-3">
                Kirimkan paket ke counter <strong>{ekspedisiLabel(order.shipping_method)}</strong>, lalu masukkan nomor resi yang diberikan.
              </p>
              <input
                type="text"
                value={resi}
                onChange={e => { setResi(e.target.value); setResiError(""); }}
                placeholder="Contoh: JT1234567890"
                className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 ${resiError ? "border-red-400" : "border-gray-200"}`}
              />
              {resiError && <p className="text-xs text-red-500 mt-1">{resiError}</p>}
            </div>
          )}
          {mode === "ekspedisi" && order.status === "shipped" && (
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
              <p className="text-sm font-semibold text-purple-700 mb-2">Pesanan Telah Dikirim</p>
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-gray-500">Nomor Resi ({ekspedisiLabel(order.shipping_method)})</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5 tracking-wide">
                  {order.shipment?.tracking_number ?? "-"}
                </p>
              </div>
              <p className="text-xs text-purple-500 mt-2">Menunggu konfirmasi terima dari pembeli.</p>
            </div>
          )}

          {/* Selesai / Batal */}
          {(order.status === "delivered" || order.status === "completed") && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-green-700">Pesanan Selesai</p>
            </div>
          )}
          {order.status === "cancelled" && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-red-700">Pesanan Dibatalkan</p>
            </div>
          )}
        </div>

        {/* ── Action buttons sticky bottom ───────────────────────────── */}
        <div className="px-6 py-5 border-t border-gray-100 space-y-2 sticky bottom-0 bg-white">
          {/* PENDING — semua mode */}
          {order.status === "pending" && (
            <>
              <p className="text-xs text-gray-500 text-center mb-3">
                Diskusikan dulu dengan pembeli jika ada pertanyaan soal ketersediaan atau perubahan pesanan.
              </p>
              <button
                onClick={() => onUpdateStatus(order.id, "confirmed")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {loading ? "Memproses..." : "Konfirmasi & Terima Pesanan"}
              </button>
              <button
                onClick={() => openWhatsApp(buyerPhone, order.order_code)}
                disabled={!buyerPhone}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                <MessageCircle className="w-4 h-4" /> Diskusi via WhatsApp Pembeli
              </button>
              <button
                onClick={() => onUpdateStatus(order.id, "cancelled")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Batalkan Pesanan
              </button>
            </>
          )}

          {/* PICKUP — confirmed → ready_for_pickup */}
          {mode === "pickup" && order.status === "confirmed" && (
            <button
              onClick={() => onUpdateStatus(order.id, "ready_for_pickup")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              <Package className="w-4 h-4" />
              {loading ? "Memproses..." : "Tandai Siap Diambil"}
            </button>
          )}

          {/* PICKUP — ready_for_pickup → completed */}
          {mode === "pickup" && order.status === "ready_for_pickup" && (
            <button
              onClick={() => onUpdateStatus(order.id, "completed")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? "Memproses..." : "Konfirmasi Sudah Diambil"}
            </button>
          )}

          {/* EKSPEDISI — confirmed → shipped (dengan input resi) */}
          {mode === "ekspedisi" && order.status === "confirmed" && (
            <button
              onClick={handleShipped}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Truck className="w-4 h-4" />
              {loading ? "Memproses..." : `Tandai Sudah Dikirim via ${ekspedisiLabel(order.shipping_method)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PesananPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Semua");
  const [search, setSearch] = useState("");
  const [actioning, setActioning] = useState<number | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const toast = useToast();

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api.get("/seller/orders")
      .then(res => setOrders(res.data.data?.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdateStatus = async (id: number, status: string, trackingNumber?: string) => {
    setActioning(id);
    try {
      await api.patch(`/seller/orders/${id}/status`, {
        status,
        ...(trackingNumber ? { tracking_number: trackingNumber } : {}),
      });
      const messages: Record<string, string> = {
        confirmed:        "Pesanan dikonfirmasi!",
        cancelled:        "Pesanan berhasil dibatalkan.",
        ready_for_pickup: "Pembeli diberitahu pesanan siap diambil!",
        completed:        "Pesanan selesai.",
        shipped:          "Pesanan ditandai sudah dikirim. Nomor resi tersimpan.",
      };
      toast.success(messages[status] ?? "Status diperbarui.");
      fetchOrders();
      setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
    } catch {
      toast.error("Gagal mengubah status pesanan.");
    } finally {
      setActioning(null);
    }
  };

  const filtered = orders.filter(o => {
    const statuses = TAB_STATUSES[activeTab];
    const matchTab = statuses.length === 0 || statuses.includes(o.status);
    const matchSearch =
      o.order_code.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer?.user?.name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const countTab = (tab: string) => {
    const statuses = TAB_STATUSES[tab];
    if (statuses.length === 0) return orders.length;
    return orders.filter(o => statuses.includes(o.status)).length;
  };

  const pendingCount = orders.filter(o => o.status === "pending").length;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daftar Pesanan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola semua pesanan masuk toko Anda</p>
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
            {pendingCount} pesanan baru
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 overflow-x-auto pb-px">
        {Object.keys(TAB_STATUSES).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {tab}
            <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {countTab(tab)}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari ID atau nama pembeli..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-400" />
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Memuat pesanan...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">
            {orders.length === 0 ? "Belum ada pesanan masuk." : "Tidak ada pesanan yang sesuai filter."}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(o => {
              const produkLabel = o.items.map(i => {
                const varText = i.variant_option ? ` (${i.variant_option.value})` : "";
                return `${i.product_name || i.product?.name}${varText} ×${i.quantity}`;
              }).join(", ");
              const mode = deliveryMode(o);
              return (
                <div key={o.id} className="px-5 py-4 hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0">
                  <div onClick={() => setSelected(o)} className="cursor-pointer flex items-center gap-4">
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      o.status === "pending"          ? "bg-blue-500 animate-pulse" :
                      o.status === "confirmed"        ? "bg-yellow-400" :
                      o.status === "ready_for_pickup" ? "bg-teal-500" :
                      o.status === "picking_up"       ? "bg-orange-400" :
                      o.status === "shipped"          ? "bg-purple-400" :
                      (o.status === "delivered" || o.status === "completed") ? "bg-green-500" : "bg-gray-300"
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-900">{o.order_code}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_COLOR[o.status] ?? ""}`}>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                        {/* Badge mode pengiriman */}
                        {mode === "pickup" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200 font-medium">
                            Ambil Sendiri
                          </span>
                        )}
                        {mode === "ekspedisi" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 font-medium">
                            {ekspedisiLabel(o.shipping_method)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{o.customer?.user?.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{produkLabel}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatRp(o.total)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(o.created_at).split(",")[0]}</p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Link
                        href={`/seller/pesanan/${o.id}`}
                        onClick={e => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Buka halaman detail"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>

                  {/* Aksi cepat — hanya pending */}
                  {o.status === "pending" && (
                    <div className="mt-3 pt-3 border-t border-gray-100/80 flex items-center justify-between gap-3 bg-blue-50/50 p-3 rounded-xl">
                      <p className="text-xs font-medium text-blue-700 flex items-center gap-1"><i className="ti ti-bolt" /> Pesanan baru masuk! Segera konfirmasi.</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); handleUpdateStatus(o.id, "cancelled"); }}
                          disabled={actioning === o.id}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleUpdateStatus(o.id, "confirmed"); }}
                          disabled={actioning === o.id}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {actioning === o.id ? "Memproses..." : "Konfirmasi"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="flex flex-wrap gap-4 px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            <span>Total: <strong className="text-gray-900">{orders.length}</strong></span>
            <span>Baru: <strong className="text-blue-600">{orders.filter(o => o.status === "pending").length}</strong></span>
            <span>Siap Diambil: <strong className="text-teal-600">{orders.filter(o => o.status === "ready_for_pickup").length}</strong></span>
            <span>Dikirim: <strong className="text-purple-600">{orders.filter(o => o.status === "shipped").length}</strong></span>
            <span>Selesai: <strong className="text-green-700">{orders.filter(o => o.status === "delivered" || o.status === "completed").length}</strong></span>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <OrderDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={handleUpdateStatus}
          actioning={actioning}
        />
      )}
    </div>
  );
}
