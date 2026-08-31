"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import {
  CheckCircle, XCircle, Package, MessageCircle,
  MapPin, Phone, Clock, Truck, Home, ChevronLeft,
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
  sub_total: number;
  discount: number;
  bumdes_fee: number;
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
    "ekspedisi-jnt-ez": "J&T EZ",
    "ekspedisi-tiki-reg": "TIKI REG",
    "ekspedisi-pos-biasa": "POS Biasa",
  };
  return map[method] ?? method.replace("ekspedisi-", "").toUpperCase();
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Perlu Dikonfirmasi",
  confirmed: "Diproses",
  ready_for_pickup: "Siap Diambil",
  picking_up: "Kurir Menuju Toko",
  shipped: "Sedang Dikirim",
  delivered: "Selesai",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-blue-50 text-blue-700 border border-blue-200",
  confirmed: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  ready_for_pickup: "bg-teal-50 text-teal-700 border border-teal-200",
  picking_up: "bg-orange-50 text-orange-600 border border-orange-200",
  shipped: "bg-purple-50 text-purple-600 border border-purple-200",
  delivered: "bg-green-50 text-green-700 border border-green-200",
  completed: "bg-green-50 text-green-700 border border-green-200",
  cancelled: "bg-red-50 text-red-600 border border-red-200",
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
  const text = encodeURIComponent(`Halo, saya penjual BUMDESMart. Terkait pesanan #${orderCode}, saya ingin mendiskusikan pesanan Anda.`);
  window.open(`https://wa.me/${clean}?text=${text}`, "_blank");
}

export default function SellerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [resi, setResi] = useState("");
  const [resiError, setResiError] = useState("");

  useEffect(() => {
    api.get(`/seller/orders/${id}`)
      .then(r => setOrder(r.data.data))
      .catch(() => toast.error("Pesanan tidak ditemukan."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async (status: string, trackingNumber?: string) => {
    if (!order) return;
    setActioning(true);
    try {
      const body: Record<string, string> = { status };
      if (trackingNumber) body.tracking_number = trackingNumber;
      const res = await api.patch(`/seller/orders/${order.id}/status`, body);
      setOrder(res.data.data ?? { ...order, status });
      toast.success("Status pesanan diperbarui.");
    } catch {
      toast.error("Gagal memperbarui status.");
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">Pesanan tidak ditemukan.</p>
        <button onClick={() => router.back()} className="text-sm text-green-700 font-semibold hover:underline">Kembali</button>
      </div>
    );
  }

  const mode = deliveryMode(order);
  const buyerPhone = order.address?.phone || order.customer?.user?.phone;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Pesanan
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Kode Pesanan</p>
            <p className="text-base font-bold text-gray-900">{order.order_code}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLOR[order.status] ?? ""}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 flex items-center gap-1 mt-3">
          <Clock className="w-3 h-3" /> {formatDate(order.created_at)}
        </p>
      </div>

      {/* Pembeli */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pembeli</p>
        <p className="text-sm font-semibold text-gray-900">{order.customer?.user?.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{order.customer?.user?.email}</p>
        {buyerPhone && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <Phone className="w-3 h-3" /> {buyerPhone}
          </div>
        )}
        {buyerPhone && (
          <button
            onClick={() => openWhatsApp(buyerPhone, order.order_code)}
            className="mt-3 flex items-center gap-1.5 text-xs text-[#25D366] font-semibold"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Hubungi via WhatsApp
          </button>
        )}
      </div>

      {/* Alamat / Pickup */}
      {mode !== "pickup" && order.address && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Alamat Pengiriman</p>
          <p className="text-sm font-semibold text-gray-900">{order.address.recipient_name}</p>
          <p className="text-xs text-gray-600 mt-0.5">{order.address.address}</p>
          <p className="text-xs text-gray-500">{order.address.city}, {order.address.province} {order.address.postal_code}</p>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <Phone className="w-3 h-3" /> {order.address.phone}
          </div>
        </div>
      )}
      {mode === "pickup" && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5">
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">Ambil Sendiri</p>
          <p className="text-xs text-teal-600">Pembeli akan datang langsung ke toko untuk mengambil pesanan.</p>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Produk Dipesan</p>
        <div className="space-y-2">
          {(order.items || []).map(item => (
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
        <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
          {Number(order.discount ?? 0) > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>Diskon</span>
              <span>−{formatRp(Number(order.discount))}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Ongkir</span>
            <span>{order.shipping_cost > 0 ? formatRp(order.shipping_cost) : "Gratis"}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900">
            <span>Total</span>
            <span>{formatRp(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Status blocks */}
      {mode === "kurir_lokal" && order.status === "confirmed" && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5 text-center">
          <div className="animate-spin w-7 h-7 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm font-semibold text-yellow-700">Sedang Mencari Kurir</p>
          <p className="text-xs text-yellow-600 mt-1">Menunggu kurir tersedia mengambil pesanan.</p>
        </div>
      )}
      {mode === "kurir_lokal" && order.status === "picking_up" && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
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
                <button onClick={() => openWhatsApp(order.driver?.phone, order.order_code)} className="mt-2 flex items-center gap-1.5 text-xs text-[#25D366] font-semibold">
                  <MessageCircle className="w-3.5 h-3.5" /> Chat Kurir via WhatsApp
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {mode === "kurir_lokal" && order.status === "shipped" && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-purple-700">Sedang Dalam Pengiriman</p>
          {order.driver?.phone && (
            <button onClick={() => openWhatsApp(order.driver?.phone, order.order_code)} className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#25D366] font-semibold w-full">
              <MessageCircle className="w-3.5 h-3.5" /> Chat Kurir via WhatsApp
            </button>
          )}
        </div>
      )}
      {mode === "ekspedisi" && order.status === "confirmed" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-purple-700 mb-1">Input Nomor Resi</p>
          <p className="text-xs text-purple-600 mb-3">
            Kirimkan ke counter <strong>{ekspedisiLabel(order.shipping_method)}</strong>, lalu masukkan nomor resi.
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
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
          <p className="text-sm font-semibold text-purple-700 mb-2">Pesanan Telah Dikirim</p>
          <div className="bg-white rounded-xl p-3">
            <p className="text-xs text-gray-500">Nomor Resi ({ekspedisiLabel(order.shipping_method)})</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5 tracking-wide">{order.shipment?.tracking_number ?? "—"}</p>
          </div>
        </div>
      )}
      {(order.status === "delivered" || order.status === "completed") && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-green-700">Pesanan Selesai</p>
        </div>
      )}
      {order.status === "cancelled" && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-700">Pesanan Dibatalkan</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2 pb-6">
        {order.status === "pending" && (
          <>
            <button
              onClick={() => updateStatus("confirmed")}
              disabled={actioning}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {actioning ? "Memproses..." : "Konfirmasi & Terima Pesanan"}
            </button>
            <button
              onClick={() => openWhatsApp(buyerPhone, order.order_code)}
              disabled={!buyerPhone}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
            >
              <MessageCircle className="w-4 h-4" /> Diskusi via WhatsApp Pembeli
            </button>
            <button
              onClick={() => updateStatus("cancelled")}
              disabled={actioning}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Batalkan Pesanan
            </button>
          </>
        )}
        {mode === "pickup" && order.status === "confirmed" && (
          <button onClick={() => updateStatus("ready_for_pickup")} disabled={actioning}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50">
            <Package className="w-4 h-4" /> {actioning ? "Memproses..." : "Tandai Siap Diambil"}
          </button>
        )}
        {mode === "pickup" && order.status === "ready_for_pickup" && (
          <button onClick={() => updateStatus("completed")} disabled={actioning}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
            <CheckCircle className="w-4 h-4" /> {actioning ? "Memproses..." : "Konfirmasi Sudah Diambil"}
          </button>
        )}
        {mode === "ekspedisi" && order.status === "confirmed" && (
          <button
            onClick={() => {
              if (!resi.trim()) { setResiError("Nomor resi wajib diisi"); return; }
              setResiError("");
              updateStatus("shipped", resi.trim());
            }}
            disabled={actioning}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            <Truck className="w-4 h-4" /> {actioning ? "Memproses..." : `Tandai Sudah Dikirim via ${ekspedisiLabel(order.shipping_method)}`}
          </button>
        )}
      </div>
    </div>
  );
}
