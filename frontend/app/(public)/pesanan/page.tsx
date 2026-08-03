"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { orderApi } from "@/lib/api/checkout";

function formatRupiah(n: number) { return "Rp " + Math.round(n).toLocaleString("id-ID"); }

const STATUS_TABS = [
  { label: "Semua",         value: "" },
  { label: "Menunggu Bayar", value: "pending" },
  { label: "Dikonfirmasi",  value: "confirmed" },
  { label: "Diproses",      value: "processing" },
  { label: "Dikirim",       value: "shipped" },
  { label: "Selesai",       value: "delivered" },
  { label: "Dibatalkan",    value: "cancelled" },
];

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  pending:    { bg: "#FEF3C7", text: "#92400E", label: "Menunggu Bayar" },
  confirmed:  { bg: "#DBEAFE", text: "#1E40AF", label: "Dikonfirmasi" },
  processing: { bg: "#EDE9FE", text: "#5B21B6", label: "Diproses" },
  picking_up: { bg: "#EDE9FE", text: "#5B21B6", label: "Driver Menuju Toko" },
  shipped:    { bg: "#CFFAFE", text: "#164E63", label: "Dikirim" },
  delivered:  { bg: "#D1FAE5", text: "#065F46", label: "Selesai" },
  cancelled:  { bg: "#FEE2E2", text: "#991B1B", label: "Dibatalkan" },
};

const IMG_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace("/api/v1", "");

function getImgUrl(product: any): string | null {
  const path = product?.primary_image?.file_path
    ?? product?.images?.[0]?.file_path
    ?? product?.images?.[0]?.image_path
    ?? product?.image_path
    ?? null;
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${IMG_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function PesananPage() {
  const router = useRouter();
  const [orders, setOrders]     = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading]   = useState(true);

  const fetchOrders = async (status?: string) => {
    setLoading(true);
    try {
      const res = await orderApi.list(status ? { status } : undefined);
      setOrders(res.data?.data?.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(activeTab || undefined); }, [activeTab]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

      {/* Header dengan tombol kembali */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white border border-gray-100 transition-colors shrink-0"
          aria-label="Kembali"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1">Pesanan Saya</h1>
        <Link href="/" className="text-xs text-gray-400 hover:text-green-700 transition-colors">
          Beranda
        </Link>
      </div>

      {/* Filter tabs — scroll horizontal di mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`shrink-0 text-xs font-medium px-4 py-2 rounded-full border transition-colors ${
              activeTab === tab.value
                ? "text-white border-transparent"
                : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
            }`}
            style={activeTab === tab.value ? { background: "var(--primary)" } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">Tidak ada pesanan</p>
          <p className="text-gray-400 text-xs mt-1 mb-5">
            {activeTab ? "Coba pilih status lain" : "Mulai belanja produk UMKM desa"}
          </p>
          <Link
            href="/produk"
            className="inline-block px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "var(--primary)" }}
          >
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const sc        = STATUS_COLOR[order.status] || { bg: "#F3F4F6", text: "#6B7280", label: order.status };
            const firstItem = order.items?.[0];
            const imgUrl    = getImgUrl(firstItem?.product);
            const moreItems = (order.items?.length || 0) - 1;

            return (
              <Link key={order.id} href={`/pesanan/${order.id}`} className="block group">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition-all">
                  {/* Order header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-600 truncate">#{order.order_code}</p>
                      {order.umkm_profile?.shop_name && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{order.umkm_profile.shop_name}</p>
                      )}
                    </div>
                    <span
                      className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {sc.label}
                    </span>
                  </div>

                  {/* Produk preview */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={firstItem?.product?.name ?? ""}
                          className="w-full h-full object-cover"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {firstItem?.product?.name ?? firstItem?.product_name ?? "Produk"}
                      </p>
                      {moreItems > 0 && (
                        <p className="text-xs text-gray-400">+{moreItems} produk lainnya</p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400">{order.items?.length || 0} produk</p>
                    <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                      {formatRupiah(Number(order.total))}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
