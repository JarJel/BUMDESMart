"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { orderApi } from "@/lib/api/checkout";

function formatRupiah(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

const STATUS_TABS = [
  { label: "Semua", value: "" },
  { label: "Menunggu Bayar", value: "pending" },
  { label: "Dikonfirmasi", value: "confirmed" },
  { label: "Diproses", value: "processing" },
  { label: "Dikirim", value: "shipped" },
  { label: "Selesai", value: "delivered" },
  { label: "Dibatalkan", value: "cancelled" },
];

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  pending:    { bg: "#FEF3C7", text: "#92400E", label: "Menunggu Bayar" },
  confirmed:  { bg: "#DBEAFE", text: "#1E40AF", label: "Dikonfirmasi" },
  processing: { bg: "#EDE9FE", text: "#5B21B6", label: "Diproses" },
  shipped:    { bg: "#CFFAFE", text: "#164E63", label: "Dikirim" },
  delivered:  { bg: "#D1FAE5", text: "#065F46", label: "Selesai" },
  cancelled:  { bg: "#FEE2E2", text: "#991B1B", label: "Dibatalkan" },
};

const getAssetUrl = (path: string | undefined) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace("/api/v1", "");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function PesananPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pesanan Saya</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`shrink-0 text-xs font-medium px-4 py-2 rounded-full border transition-colors ${activeTab === tab.value ? "text-white border-transparent" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            style={activeTab === tab.value ? { background: "var(--primary)" } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">Tidak ada pesanan.</p>
          <Link href="/produk" className="mt-4 inline-block px-5 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: "var(--primary)" }}>
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const sc = STATUS_COLOR[order.status] || { bg: "#F3F4F6", text: "#6B7280", label: order.status };
            const firstItem = order.items?.[0];
            const imgUrl = getAssetUrl(firstItem?.product?.images?.[0]?.image_path);
            const moreItems = (order.items?.length || 0) - 1;

            return (
              <Link key={order.id} href={`/pesanan/${order.id}`} className="block">
                <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">#{order.order_code}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{order.umkm_profile?.shop_name}</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.text }}>
                      {sc.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    {firstItem && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {imgUrl ? (
                          <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{firstItem?.product?.name}</p>
                      {moreItems > 0 && <p className="text-xs text-gray-400">+{moreItems} produk lainnya</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-500">{order.items?.length || 0} produk</p>
                    <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>{formatRupiah(Number(order.total))}</p>
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
