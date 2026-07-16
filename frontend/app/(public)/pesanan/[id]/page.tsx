"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

const IMG_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace("/api/v1", "");

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
  const [reviewForms, setReviewForms] = useState<Record<number, { rating: number; comment: string }>>({});
  const [submittingReview, setSubmittingReview] = useState(false);

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

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [fetchOrder, id]);

  useEffect(() => {
    if (order?.status === "delivered") {
      fetchExistingReviews();
    }
  }, [order, fetchExistingReviews]);

  const openReviewModal = () => {
    const initial: Record<number, { rating: number; comment: string }> = {};
    (order?.items ?? []).forEach((item: any) => {
      const existing = existingReviews.find(r => r.product_id === item.product_id);
      initial[item.product_id] = {
        rating:  existing?.rating ?? 0,
        comment: existing?.comment ?? "",
      };
    });
    setReviewForms(initial);
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
    const reviews = Object.entries(reviewForms)
      .filter(([, v]) => v.rating > 0)
      .map(([productId, v]) => ({
        product_id: Number(productId),
        rating:     v.rating,
        comment:    v.comment || undefined,
      }));

    if (reviews.length === 0) {
      toast.error("Pilih rating untuk minimal satu produk.");
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post(`/orders/${id}/reviews`, { reviews });
      toast.success("Ulasan berhasil dikirim!");
      setShowReview(false);
      fetchExistingReviews();
    } catch {
      toast.error("Gagal mengirim ulasan.");
    } finally {
      setSubmittingReview(false);
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
  const badge      = STATUS_BADGE[order.status] ?? { bg: "#F3F4F6", text: "#6B7280", label: order.status };
  const isCancelled = order.status === "cancelled";
  const isReviewed = existingReviews.length > 0;

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
              {STATUS_STEPS.map((step, i) => (
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
                  {i < STATUS_STEPS.length - 1 && (
                    <div className="absolute top-3.5 left-1/2 w-full h-0.5"
                      style={{ background: i < stepIdx ? "var(--primary)" : "#F3F4F6" }} />
                  )}
                  <p className="text-center text-[10px] mt-2 leading-tight px-0.5"
                    style={i === stepIdx
                      ? { color: "var(--primary)", fontWeight: 600 }
                      : { color: "#9CA3AF" }}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Kurir */}
        {(order.status === "shipped" || order.status === "delivered") && order.driver && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              <p className="text-sm font-semibold text-gray-800">Kurir Pengiriman</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-gray-500">
                  {(order.driver.name ?? "K")[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{order.driver.name}</p>
                {order.driver.phone && (
                  <p className="text-xs text-gray-500">{order.driver.phone}</p>
                )}
                {order.driver.driver_profile && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.driver.driver_profile.vehicle_brand
                      ? `${order.driver.driver_profile.vehicle_brand} · `
                      : ""}
                    {order.driver.driver_profile.vehicle_plate}
                    {order.driver.driver_profile.rating > 0
                      ? ` · ${order.driver.driver_profile.rating.toFixed(1)}★`
                      : ""}
                  </p>
                )}
              </div>
              {order.status === "shipped" && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700 shrink-0">
                  Dalam Pengiriman
                </span>
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
              const imgPath = item.product?.primary_image?.file_path ?? item.product?.images?.[0]?.file_path;
              const imgUrl  = imgPath
                ? (imgPath.startsWith("http") ? imgPath : `${IMG_BASE}${imgPath}`)
                : null;
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
                    {item.variant_option?.name && (
                      <p className="text-xs text-gray-400">{item.variant_option.name}</p>
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
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Diskon</span>
                <span>-{formatRp(Number(order.discount_amount))}</span>
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
          {order.status === "pending" && (
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
      {showReview && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowReview(false); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <p className="text-base font-bold text-gray-900">Beri Ulasan</p>
              <button onClick={() => setShowReview(false)} className="text-gray-400 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {(order?.items ?? []).map((item: any) => {
                const productId = item.product_id;
                const form      = reviewForms[productId] ?? { rating: 0, comment: "" };
                const imgPath   = item.product?.primary_image?.file_path ?? item.product?.images?.[0]?.file_path;
                const imgUrl    = imgPath ? (imgPath.startsWith("http") ? imgPath : `${IMG_BASE}${imgPath}`) : null;
                return (
                  <div key={item.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-gray-50">
                        {imgUrl
                          ? <img src={imgUrl} alt={item.product_name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                        }
                      </div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.product_name}</p>
                    </div>
                    <StarRating
                      value={form.rating}
                      onChange={r => setReviewForms(prev => ({ ...prev, [productId]: { ...form, rating: r } }))}
                    />
                    <textarea
                      value={form.comment}
                      onChange={e => setReviewForms(prev => ({ ...prev, [productId]: { ...form, comment: e.target.value } }))}
                      placeholder="Ceritakan pengalamanmu dengan produk ini... (opsional)"
                      rows={2}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 resize-none"
                    />
                    {item !== (order?.items ?? []).at(-1) && (
                      <div className="border-b border-gray-100" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={() => setShowReview(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleSubmitReviews} disabled={submittingReview}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--primary)" }}>
                {submittingReview ? "Mengirim..." : "Kirim Ulasan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
