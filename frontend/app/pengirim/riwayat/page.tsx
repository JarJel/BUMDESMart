"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default function PengirimRiwayatPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [histRes, statsRes] = await Promise.all([
        api.get("/driver/history"),
        api.get("/driver/stats"),
      ]);
      setOrders(histRes.data.data?.data ?? histRes.data.data ?? []);
      setStats(statsRes.data.data);
    } catch {
      toast.error("Gagal memuat riwayat.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-5 lg:p-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-gray-900">Riwayat Pengiriman</h1>
        <p className="text-sm text-gray-500 mt-0.5">Semua pengiriman yang telah kamu selesaikan</p>
      </div>

      {/* Stats mini */}
      {stats && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Total Selesai</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_deliveries}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Hari Ini</p>
            <p className="text-2xl font-bold text-gray-900">{stats.today_deliveries}</p>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Belum ada riwayat pengiriman.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-all text-sm font-semibold text-gray-900">{order.order_code}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold" style={{ color: "#EA580C" }}>{formatRp(Number(order.total))}</p>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                    Selesai
                  </span>
                </div>
              </div>
              {order.address && (
                <p className="break-words text-xs text-gray-500">
                  {order.address.recipient_name ?? order.address.name} · {order.address.city}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
