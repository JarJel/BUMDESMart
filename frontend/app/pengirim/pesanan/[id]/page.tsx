"use client";

/**
 * /pengirim/pesanan/[id]/page.tsx
 *
 * Halaman detail pesanan untuk kurir.
 * Menampilkan:
 *  - Peta rute interaktif (lokasi driver, toko UMKM, alamat customer)
 *  - Info pickup (toko UMKM)
 *  - Info delivery (alamat & penerima)
 *  - Daftar item pesanan
 *  - Ringkasan biaya
 *  - Tombol ambil pesanan / update status
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Package,
  Navigation,
  Phone,
  MapPin,
  Weight,
  Clock,
  CheckCircle,
  Truck,
  MessageCircle,
  Store,
  User,
  Receipt,
} from "lucide-react";

import { driverApi, type DriverOrder } from "@/lib/api/driver";
import { useToast } from "@/components/ui/Toast";
import type { MapPoint } from "@/components/pengirim/OrderRouteMap";

// Lazy load peta agar tidak crash di SSR
const OrderRouteMap = dynamic(
  () => import("@/components/pengirim/OrderRouteMap").then((m) => m.OrderRouteMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRp(n: number | string) {
  return "Rp " + Math.round(Number(n)).toLocaleString("id-ID");
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function openWhatsApp(phone: string | null | undefined, message: string) {
  if (!phone) return;
  const clean = phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, "_blank");
}

function openMaps(lat: string | null | undefined, lng: string | null | undefined, label: string) {
  if (!lat || !lng) return;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(label)}`, "_blank");
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:  { label: "Menunggu Kurir",  color: "#D97706", bg: "#FEF3C7" },
  picking_up: { label: "Menuju Toko",     color: "#7C3AED", bg: "#EDE9FE" },
  shipped:    { label: "Sedang Diantar",  color: "#2563EB", bg: "#DBEAFE" },
  delivered:  { label: "Selesai",         color: "#16A34A", bg: "#DCFCE7" },
  cancelled:  { label: "Dibatalkan",      color: "#DC2626", bg: "#FEE2E2" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MapSkeleton() {
  return (
    <div className="h-[320px] w-full animate-pulse rounded-2xl bg-gray-100 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Memuat peta…</p>
      </div>
    </div>
  );
}

function MapLegend() {
  const items = [
    { color: "#3B82F6", label: "Lokasi Kamu (Driver)" },
    { color: "#22C55E", label: "Toko UMKM (Pickup)" },
    { color: "#EF4444", label: "Alamat Customer (Delivery)" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 px-1">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-0.5 w-6 shrink-0 border-t-2 border-dashed border-orange-400" />
        <span className="text-xs text-gray-500">Rute Perjalanan</span>
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}
function InfoRow({ icon, label, value, mono }: InfoRowProps) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-gray-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`mt-0.5 text-sm font-medium text-gray-900 break-words ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

interface ContactCardProps {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  name: string | null | undefined;
  phone: string | null | undefined;
  address: string | null | undefined;
  city?: string | null | undefined;
  lat?: string | null | undefined;
  lng?: string | null | undefined;
  waMessage?: string;
}
function ContactCard({ title, icon, accentColor, name, phone, address, city, lat, lng, waMessage }: ContactCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50" style={{ backgroundColor: `${accentColor}0D` }}>
        <span style={{ color: accentColor }}>{icon}</span>
        <span className="text-sm font-bold" style={{ color: accentColor }}>{title}</span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {name && <InfoRow icon={<User className="h-4 w-4" />} label="Nama" value={name} />}
        {address && <InfoRow icon={<MapPin className="h-4 w-4" />} label="Alamat" value={[address, city].filter(Boolean).join(", ")} />}

        {/* Tombol aksi */}
        <div className="flex gap-2 pt-1">
          {phone && (
            <button
              onClick={() => openWhatsApp(phone, waMessage ?? `Halo ${name ?? ""}, saya kurir BUMDESMart.`)}
              className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </button>
          )}
          {lat && lng && (
            <button
              onClick={() => openMaps(lat, lng, name ?? "")}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" />
              Buka Maps
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<DriverOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Upload Photo State
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [targetStatus, setTargetStatus] = useState<"shipped" | "delivered" | null>(null);

  // Ambil detail order dari API
  const fetchOrder = useCallback(async () => {
    try {
      const res = await driverApi.showOrder(orderId);
      setOrder(res.data.data);
    } catch {
      toast.error("Gagal memuat detail pesanan.");
      router.back();
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Ambil lokasi GPS driver
  const getDriverLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {/* izin ditolak — lanjut tanpa lokasi driver */},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    fetchOrder();
    getDriverLocation();
  }, [fetchOrder, getDriverLocation]);

  // Bangun array titik peta setelah order & lokasi driver tersedia
  useEffect(() => {
    if (!order) return;
    const pts: MapPoint[] = [];

    if (driverLocation) {
      pts.push({
        lat: driverLocation.lat,
        lng: driverLocation.lng,
        label: "Lokasi Kamu",
        color: "blue",
        info: "Posisi driver saat ini",
      });
    }

    const pickupLat = Number(order.pickup_from.lat);
    const pickupLng = Number(order.pickup_from.lng);
    if (!isNaN(pickupLat) && !isNaN(pickupLng) && pickupLat !== 0) {
      pts.push({
        lat: pickupLat,
        lng: pickupLng,
        label: order.pickup_from.name ?? "Toko",
        color: "green",
        info: order.pickup_from.address ?? undefined,
      });
    }

    const deliverLat = Number(order.deliver_to.lat);
    const deliverLng = Number(order.deliver_to.lng);
    if (!isNaN(deliverLat) && !isNaN(deliverLng) && deliverLat !== 0) {
      pts.push({
        lat: deliverLat,
        lng: deliverLng,
        label: order.deliver_to.recipient_name ?? "Customer",
        color: "red",
        info: order.deliver_to.address ?? undefined,
      });
    }

    setMapPoints(pts);
  }, [order, driverLocation]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleAcceptOrder = async () => {
    setActionLoading(true);
    try {
      await driverApi.acceptOrder(orderId);
      toast.success("Pesanan berhasil diambil! Segera menuju toko.");
      fetchOrder();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Gagal mengambil pesanan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPhotoModal = (status: "shipped" | "delivered") => {
    setTargetStatus(status);
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowPhotoModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!targetStatus || !photoFile) {
      toast.error("Silakan pilih/ambil foto terlebih dahulu.");
      return;
    }

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append("status", targetStatus);

      if (targetStatus === "shipped") {
        formData.append("pickup_photo", photoFile);
      } else {
        formData.append("delivered_photo", photoFile);
      }

      await driverApi.updateStatus(orderId, formData);
      const msg =
        targetStatus === "shipped"
          ? "Status diperbarui: Sedang Diantar ke Pembeli"
          : "Pengiriman selesai! Terima kasih.";
      
      toast.success(msg);
      setShowPhotoModal(false);
      fetchOrder();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Gagal memperbarui status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal adalah 5MB.");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ─── Render states ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-orange-500" />
      </div>
    );
  }

  if (!order) return null;

  const statusInfo = STATUS_LABEL[order.status] ?? { label: order.status, color: "#6B7280", bg: "#F3F4F6" };
  const isAvailable = order.status === "confirmed";
  const isPickingUp = order.status === "picking_up";
  const isShipped   = order.status === "shipped";

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-4 sm:p-5 pb-64 lg:pb-10">
      {/* Back button + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-sm shrink-0"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold text-gray-900 truncate">Detail Pesanan</h1>
          <p className="text-xs font-mono text-gray-500">{order.order_code}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* ── Peta Rute ──────────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Navigation className="h-4 w-4 text-orange-500" />
            Peta Rute
          </h2>
        </div>

        <div className="p-3">
          {mapPoints.length > 0 ? (
            <>
              <OrderRouteMap points={mapPoints} height="320px" />
              <MapLegend />
              {!driverLocation && (
                <p className="mt-2 text-center text-[11px] text-amber-600">
                  ⚠ Izinkan akses lokasi untuk menampilkan posisi kamu di peta.
                </p>
              )}
            </>
          ) : (
            <div className="flex h-44 items-center justify-center text-center">
              <div>
                <MapPin className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">Koordinat toko atau alamat belum tersedia</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Ringkasan Pesanan ──────────────────────────────────────────────── */}
      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-50 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-orange-500" />
            Ringkasan Pesanan
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-4">
          {[
            { label: "Penghasilan", value: formatRp(order.earning), highlight: true },
            { label: "Total Berat", value: `${order.total_weight_kg} kg` },
            { label: "Jarak Antar", value: order.distance_km != null ? `${order.distance_km} km` : "—" },
            { label: "Jumlah Item", value: `${order.items.length} produk` },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="bg-white px-4 py-3 text-center">
              <p className={`text-base font-bold ${highlight ? "text-orange-500" : "text-gray-900"}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Titik Jemput (Pickup) ──────────────────────────────────────────── */}
      <ContactCard
        title="Titik Jemput — Toko UMKM"
        icon={<Store className="h-4 w-4" />}
        accentColor="#22C55E"
        name={order.pickup_from.name}
        phone={order.pickup_from.phone}
        address={order.pickup_from.address}
        lat={order.pickup_from.lat}
        lng={order.pickup_from.lng}
        waMessage={`Halo, saya kurir BUMDESMart untuk pesanan #${order.order_code}. Saya sedang dalam perjalanan ke toko.`}
      />

      {/* ── Titik Antar (Delivery) ─────────────────────────────────────────── */}
      <ContactCard
        title="Titik Antar — Alamat Customer"
        icon={<Navigation className="h-4 w-4" />}
        accentColor="#3B82F6"
        name={order.deliver_to.recipient_name}
        phone={order.deliver_to.phone}
        address={order.deliver_to.address}
        city={order.deliver_to.city}
        lat={order.deliver_to.lat}
        lng={order.deliver_to.lng}
        waMessage={`Halo ${order.deliver_to.recipient_name ?? ""}, saya kurir BUMDESMart. Saya sedang mengantar pesanan Anda #${order.order_code}. Apakah ada di lokasi?`}
      />

      {/* ── Daftar Item ──────────────────────────────────────────────────────── */}
      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-50 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-500" />
            Item Pesanan ({order.items.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                <Package className="h-5 w-5 text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</p>
                <p className="text-xs text-gray-400">
                  {formatRp(item.product_price)} × {item.quantity}
                  {item.product?.weight ? ` · ${item.product.weight}g` : ""}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold text-gray-900">{formatRp(item.sub_total)}</p>
            </div>
          ))}
        </div>

        {/* Biaya */}
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          <div className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-600">
            <span>Subtotal Produk</span>
            <span>{formatRp(order.sub_total)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-600">
            <span>Ongkos Kirim</span>
            <span>{formatRp(order.shipping_cost)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 font-bold">
            <span className="text-sm text-gray-900">Total Pembayaran</span>
            <span className="text-base text-orange-500">{formatRp(order.total)}</span>
          </div>
        </div>
      </section>

      {/* ── Info Tambahan ─────────────────────────────────────────────────────── */}
      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-50 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            Info Pesanan
          </h2>
        </div>
        <div className="divide-y divide-gray-50 px-4">
          <InfoRow icon={<Receipt className="h-4 w-4" />} label="Kode Pesanan" value={order.order_code} mono />
          <div className="py-3">
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Dibuat Pada" value={formatDate(order.created_at)} />
          </div>
          {order.notes && (
            <div className="py-3">
              <InfoRow icon={<Package className="h-4 w-4" />} label="Catatan dari Customer" value={order.notes} />
            </div>
          )}
        </div>
      </section>

      {/* Spacer ekstra agar konten paling bawah tidak tertutup tombol fixed CTA */}
      <div className="h-28 lg:h-8" />

      {/* ── CTA Tombol Aksi (fixed bottom) ───────────────────────────────────── */}
      {(isAvailable || isPickingUp || isShipped) && (
        <div className="fixed bottom-[60px] lg:bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="mx-auto max-w-2xl">
            {isAvailable && (
              <button
                onClick={handleAcceptOrder}
                disabled={actionLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                <Truck className="h-4 w-4" />
                {actionLoading ? "Memproses…" : "Ambil Pesanan Ini"}
              </button>
            )}
            {isPickingUp && (
              <button
                onClick={() => handleOpenPhotoModal("shipped")}
                disabled={actionLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-purple-700 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                <Package className="h-4 w-4" />
                {actionLoading ? "Memproses…" : "Barang Sudah Diambil — Mulai Antar"}
              </button>
            )}
            {isShipped && (
              <button
                onClick={() => handleOpenPhotoModal("delivered")}
                disabled={actionLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-green-700 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                <CheckCircle className="h-4 w-4" />
                {actionLoading ? "Memproses…" : "Pesanan Sudah Diterima Pembeli"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Unggah Bukti Foto ── */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md scale-in rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <circle cx="12" cy="13" r="4" strokeWidth={2}/>
              </svg>
              {targetStatus === "shipped" ? "Bukti Pengambilan Barang" : "Bukti Pengiriman Barang"}
            </h3>

            <p className="mt-2.5 text-xs text-gray-500 leading-relaxed">
              {targetStatus === "shipped" 
                ? "Silakan ambil atau pilih foto barang pesanan di toko UMKM sebagai bukti pengambilan sebelum melakukan perjalanan."
                : "Silakan ambil atau pilih foto pesanan bersama customer/di lokasi alamat sebagai bukti bahwa barang telah diterima."}
            </p>

            {/* Area Unggah Foto */}
            <div className="mt-4">
              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-video bg-gray-50 flex items-center justify-center">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 cursor-pointer hover:border-orange-400 hover:bg-orange-50/20 transition-all">
                  <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span className="text-xs font-bold text-gray-700">Ambil atau Pilih Foto</span>
                  <span className="text-[10px] text-gray-400 mt-1">Format PNG, JPG maks 5MB</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoChange}
                    className="hidden" 
                  />
                </label>
              )}
            </div>

            {/* Aksi Modal */}
            <div className="flex gap-3 mt-6 border-t border-gray-50 pt-4">
              <button
                onClick={() => setShowPhotoModal(false)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={actionLoading || !photoFile}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10"
              >
                {actionLoading ? "Memproses..." : "Konfirmasi & Kirim"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
