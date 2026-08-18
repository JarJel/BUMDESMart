"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

import { getFileUrl, getProductImgUrl } from "@/lib/storage";

const getStorageUrl = getFileUrl;

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

const STATUS_STEPS = [
  { key: "pending",    label: "Menunggu Bayar" },
  { key: "confirmed",  label: "Dikonfirmasi" },
  { key: "processing", label: "Diproses" },
  { key: "shipped",    label: "Dikirim" },
  { key: "delivered",  label: "Selesai" },
];

const STATUS_IDX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  picking_up: 2, // driver menjemput barang masuk kategori diproses
  shipped: 3,
  delivered: 4,
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending:    { bg: "#FFF7ED", text: "#C2410C", label: "Menunggu Pembayaran" },
  confirmed:  { bg: "#EFF6FF", text: "#1D4ED8", label: "Dikonfirmasi" },
  processing: { bg: "#FEF9C3", text: "#A16207", label: "Sedang Diproses" },
  picking_up: { bg: "#EDE9FE", text: "#5B21B6", label: "Driver Menuju Toko" },
  shipped:    { bg: "#ECFDF5", text: "#065F46", label: "Sedang Dikirim" },
  delivered:  { bg: "#F0FDF4", text: "#15803D", label: "Selesai" },
  cancelled:  { bg: "#FEF2F2", text: "#DC2626", label: "Dibatalkan" },
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-colors"
          style={{ color: (hover || value) >= star ? "#F59E0B" : "#E5E7EB" }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function DetailPesananPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  // Review state
  const [showReview, setShowReview] = useState(false);
  const [existingReviews, setExistingReviews] = useState<any[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Form ulasan transaksi terpadu
  const [shopRating, setShopRating] = useState(0);
  const [shopComment, setShopComment] = useState("");
  const [courierRating, setCourierRating] = useState(0);
  const [courierComment, setCourierComment] = useState("");

  // Driver review state
  const [driverReview, setDriverReview] = useState<{ rating: number; comment: string } | null>(null);
  const [driverReviewForm, setDriverReviewForm] = useState({ rating: 0, comment: "" });
  const [submittingDriverReview, setSubmittingDriverReview] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data ?? res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        router.push("/pesanan");
      } else {
        toast.error("Gagal memuat detail pesanan.");
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchExistingReviews = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${id}/reviews`);
      setExistingReviews(res.data.data ?? []);
    } catch {
      // silently ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDriverReview = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${id}/driver-review`);
      if (res.data.data) {
        setDriverReview(res.data.data);
        setDriverReviewForm({ rating: res.data.data.rating, comment: res.data.data.comment ?? "" });
      }
    } catch {
      // silently ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [fetchOrder, id]);

  useEffect(() => {
    if (order?.status === "delivered") {
      fetchExistingReviews();
      if (order.driver_id) fetchDriverReview();
    }
  }, [order, fetchExistingReviews, fetchDriverReview]);

  const openReviewModal = () => {
    const firstProductReview = existingReviews[0];
    setShopRating(firstProductReview?.rating ?? 0);
    setShopComment(firstProductReview?.comment ?? "");
    setCourierRating(order?.courier_rating ?? 0);
    setCourierComment(order?.courier_comment ?? "");
    setShowReview(true);
  };

  const handleConfirmDelivered = async () => {
    setConfirming(true);
    try {
      await api.patch(`/orders/${id}/delivered`);
      toast.success("Pesanan ditandai selesai. Terima kasih!");
      fetchOrder();
    } catch {
      toast.error("Gagal mengkonfirmasi. Coba lagi.");
    } finally {
      setConfirming(false);
    }
  };

  const handleSubmitReviews = async () => {
    if (shopRating === 0) {
      toast.error("Berikan rating ulasan toko terlebih dahulu.");
      return;
    }

    const isKurirLokal = order.delivery_type === "delivered" && order.shipping_method?.startsWith("kurir-lokal");
    if (isKurirLokal && courierRating === 0) {
      toast.error("Berikan rating ulasan kurir terlebih dahulu.");
      return;
    }

    // Sebarkan ulasan ke semua produk
    const reviews = (order?.items ?? []).map((item: any) => ({
      product_id: item.product_id,
      rating:     shopRating,
      comment:    shopComment || undefined,
    }));

    setSubmittingReview(true);
    try {
      const payload: any = { reviews };
      if (isKurirLokal) {
        payload.courier_rating = courierRating;
        payload.courier_comment = courierComment || undefined;
      }

      await api.post(`/orders/${id}/reviews`, payload);
      toast.success("Ulasan berhasil dikirim!");
      setShowReview(false);
      fetchExistingReviews();
      fetchOrder();
    } catch {
      toast.error("Gagal mengirim ulasan.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitDriverReview = async () => {
    if (driverReviewForm.rating === 0) {
      toast.error("Pilih rating untuk kurir.");
      return;
    }
    setSubmittingDriverReview(true);
    try {
      await api.post(`/orders/${id}/driver-review`, driverReviewForm);
      toast.success("Ulasan kurir berhasil dikirim!");
      setDriverReview({ rating: driverReviewForm.rating, comment: driverReviewForm.comment });
      setShowReview(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal mengirim ulasan kurir.");
    } finally {
      setSubmittingDriverReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#F4F7F5" }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!order) return null;

  const stepIdx    = STATUS_IDX[order.status] ?? 0;
  let badge        = STATUS_BADGE[order.status] ?? { bg: "#F3F4F6", text: "#6B7280", label: order.status };
  if (order.status === "pending" && order.payment?.status === "paid") {
    badge = { bg: "#ECFDF5", text: "#047857", label: "Pembayaran Berhasil" };
  }
  const isCancelled = order.status === "cancelled";
  const isReviewed = existingReviews.length > 0;

  const steps = [
    { key: "pending",    label: order.payment?.status === "paid" ? "Pembayaran Berhasil" : "Menunggu Bayar" },
    { key: "confirmed",  label: "Dikonfirmasi" },
    { key: "processing", label: "Diproses" },
    { key: "shipped",    label: "Dikirim" },
    { key: "delivered",  label: "Selesai" },
  ];

  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/pesanan" className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">Detail Pesanan</h1>
            <p className="text-xs text-gray-400">{order.order_code}</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
            style={{ background: badge.bg, color: badge.text }}>
            {badge.label}
          </span>
        </div>

        {/* Status Tracker */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <p className="text-sm font-semibold text-gray-800 mb-5">Status Pesanan</p>
            <div className="flex items-start">
              {steps.map((step, i) => (
                <div key={step.key} className="flex-1 flex flex-col items-center relative">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10"
                    style={i <= stepIdx
                      ? { background: "var(--primary)", color: "white" }
                      : { background: "#F3F4F6", color: "#9CA3AF" }}>
                    {i < stepIdx ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="absolute top-3.5 left-1/2 w-full h-0.5"
                      style={{ background: i < stepIdx ? "var(--primary)" : "#E5E7EB" }} />
                  )}
                  <span className={`text-[10px] sm:text-xs font-semibold mt-2.5 text-center px-1 leading-snug ${i <= stepIdx ? "text-gray-900 font-bold" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Kurir */}
        {(order.status === "picking_up" || order.status === "shipped" || order.status === "delivered") && order.driver && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              <p className="text-sm font-semibold text-gray-800">Kurir Pengiriman</p>
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                order.status === "picking_up" ? "bg-purple-50 text-purple-700" :
                order.status === "shipped"    ? "bg-green-50 text-green-700" :
                "bg-gray-100 text-gray-500"
              }`}>
                {order.status === "picking_up" ? "Menuju Toko" : order.status === "shipped" ? "Dalam Pengiriman" : "Selesai"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Foto profil kurir */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                {getStorageUrl(order.driver.driver_profile?.photo_profile) ? (
                  <img
                    src={getStorageUrl(order.driver.driver_profile?.photo_profile)!}
                    alt={order.driver.name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <span className="text-base font-bold text-gray-400">
                    {(order.driver.name ?? "K")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{order.driver.name}</p>
                {order.driver.driver_profile && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[
                      order.driver.driver_profile.vehicle_brand,
                      order.driver.driver_profile.vehicle_plate,
                    ].filter(Boolean).join(" · ")}
                    {Number(order.driver.driver_profile.rating) > 0
                      ? ` · ${Number(order.driver.driver_profile.rating).toFixed(1)}★`
                      : ""}
                  </p>
                )}
              </div>
              {/* Tombol hubungi via WA */}
              {order.driver.phone && (
                <a
                  href={`https://wa.me/${order.driver.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Hubungi
                </a>
              )}
            </div>
          </div>
        )}

        {/* Nomor Resi (Ekspedisi) */}
        {order.shipment && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-semibold text-gray-800">Info Pengiriman</p>
            </div>
            <div className="space-y-2">
              {order.shipment.courier_name && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Kurir</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {order.shipment.courier_name}
                    {order.shipment.service_name ? ` · ${order.shipment.service_name}` : ""}
                  </span>
                </div>
              )}
              {order.shipment.tracking_number && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-gray-500 shrink-0">No. Resi</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono font-semibold text-gray-900 truncate">
                      {order.shipment.tracking_number}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(order.shipment.tracking_number);
                        toast.success("Nomor resi disalin.");
                      }}
                      className="shrink-0 p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                      title="Salin nomor resi"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              {order.shipment.status && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <span className="text-xs font-semibold capitalize text-gray-700">{order.shipment.status}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alamat Pengiriman */}
        {order.address && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm font-semibold text-gray-800">Alamat Pengiriman</p>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {order.address.recipient_name ?? order.address.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{order.address.phone}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {order.address.address ?? order.address.address_line}, {order.address.city}
            </p>
          </div>
        )}

        {/* Produk */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <p className="text-sm font-semibold text-gray-800 mb-4">Produk Dipesan</p>
          <div className="space-y-3">
            {(order.items ?? []).map((item: any) => {
              const imgUrl = getProductImgUrl(item.product);
              const reviewed = existingReviews.find(r => r.product_id === item.product_id);
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                    {imgUrl ? (
                      <img src={imgUrl} alt={item.product_name} className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.style.display = "none"; }} />
                    ) : (
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.product_name}</p>
                    {item.variant_option?.value && (
                      <p className="text-xs text-gray-400">Varian: {item.variant_option.value}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {item.quantity}× {formatRp(Number(item.product_price ?? item.price))}
                    </p>
                    {reviewed && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className="text-xs" style={{ color: s <= reviewed.rating ? "#F59E0B" : "#E5E7EB" }}>★</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-bold shrink-0" style={{ color: "var(--primary)" }}>
                    {formatRp(Number(item.product_price ?? item.price) * item.quantity)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ringkasan Biaya */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <p className="text-sm font-semibold text-gray-800 mb-3">Ringkasan Biaya</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatRp(Number(order.sub_total ?? order.total))}</span>
            </div>
            {Number(order.shipping_cost) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Ongkir</span>
                <span>{formatRp(Number(order.shipping_cost))}</span>
              </div>
            )}
            {Number(order.service_fee) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Biaya Layanan</span>
                <span>{formatRp(Number(order.service_fee))}</span>
              </div>
            )}
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span className="flex items-center gap-1"><i className="ti ti-ticket" /> Diskon Voucher</span>
                <span>-{formatRp(Number(order.discount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2">
              <span>Total Bayar</span>
              <span style={{ color: "var(--primary)" }}>{formatRp(Number(order.total))}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {order.status === "shipped" && (
            <button
              onClick={handleConfirmDelivered}
              disabled={confirming}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--primary)" }}
            >
              {confirming ? "Memproses..." : "Konfirmasi Terima Barang"}
            </button>
          )}
          {order.status === "pending" && order.payment?.status !== "paid" && (
            <Link href={`/pembayaran?order_id=${order.id}`}
              className="block w-full text-center py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90"
              style={{ background: "var(--primary)" }}>
              Bayar Sekarang
            </Link>
          )}
          {order.status === "delivered" && (
            <button
              onClick={openReviewModal}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90"
              style={{ background: isReviewed ? "#6B7280" : "var(--primary)" }}
            >
              {isReviewed ? "Lihat / Edit Ulasan" : "Beri Ulasan"}
            </button>
          )}
          <Link href="/pesanan"
            className="w-full text-center py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
            Kembali ke Daftar Pesanan
          </Link>
        </div>

      </div>

      {/* Review Modal */}
      {showReview && (() => {
        const isKurirLokal = order.delivery_type === "delivered" && order.shipping_method?.startsWith("kurir-lokal");
        const shopName = order.umkm_profile?.shop_name || "Toko";
        const courierName = order.driver?.name || "Kurir Lokal";

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowReview(false); }}
          >
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                <p className="text-base font-bold text-gray-900">Beri Ulasan Pesanan</p>
                <button onClick={() => setShowReview(false)} className="text-gray-400 hover:text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* 1. Ulasan Toko */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-sm font-bold text-gray-800">Bagaimana kualitas pelayanan {shopName}?</p>
                  </div>
                  <StarRating
                    value={shopRating}
                    onChange={setShopRating}
                  />
                  <textarea
                    value={shopComment}
                    onChange={e => setShopComment(e.target.value)}
                    placeholder={`Bagikan ulasanmu untuk toko ${shopName}... (opsional)`}
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 resize-none"
                  />
                </div>

                {/* 2. Ulasan Kurir (Jika Kurir Lokal) */}
                {isKurirLokal && (
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                      <p className="text-sm font-bold text-gray-800">Bagaimana pengiriman kurir ({courierName})?</p>
                    </div>
                    <StarRating
                      value={courierRating}
                      onChange={setCourierRating}
                    />
                    <textarea
                      value={courierComment}
                      onChange={e => setCourierComment(e.target.value)}
                      placeholder={`Bagikan ulasanmu untuk performa pengiriman ${courierName}... (opsional)`}
                      rows={3}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 bg-gray-50 resize-none"
                    />
                  </div>
                )}
              </div>

            {/* Driver review section */}
            {order.driver_id && order.driver && (
              <div className="px-5 pb-5">
                <div className="border-t border-gray-100 pt-5">
                  <p className="text-sm font-bold text-gray-900 mb-3">Ulasan Kurir</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                      {getStorageUrl(order.driver.driver_profile?.photo_profile) ? (
                        <img src={getStorageUrl(order.driver.driver_profile?.photo_profile)!} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-gray-400">{(order.driver.name ?? "K")[0].toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{order.driver.name}</span>
                  </div>
                  <StarRating value={driverReviewForm.rating} onChange={r => setDriverReviewForm(f => ({ ...f, rating: r }))} />
                  <textarea
                    value={driverReviewForm.comment}
                    onChange={e => setDriverReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Bagaimana pelayanan kurir ini? (opsional)"
                    rows={2}
                    className="w-full mt-3 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 resize-none"
                  />
                  <button
                    onClick={handleSubmitDriverReview}
                    disabled={submittingDriverReview}
                    className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    style={{ background: driverReview ? "#6B7280" : "var(--primary)" }}
                  >
                    {submittingDriverReview ? "Mengirim..." : driverReview ? "Perbarui Ulasan Kurir" : "Kirim Ulasan Kurir"}
                  </button>
                </div>
              </div>
            )}

            <div className="p-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={() => setShowReview(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleSubmitReviews} disabled={submittingReview}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--primary)" }}>
                {submittingReview ? "Mengirim..." : "Kirim Ulasan Produk"}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
