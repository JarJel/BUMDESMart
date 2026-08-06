"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api/axios";

interface Balance {
  pending: number;
  available: number;
}

interface Order {
  id: number;
  order_code: string;
  status: string;
  total: number;
  sub_total: number;
  discount: number;
  bumdes_fee: number;
  shipping_cost: number;
  service_fee: number;
  created_at: string;
  items: { product_name: string; quantity: number }[];
  customer: { user: { name: string } };
}

const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id");
}

function sellerEarnings(o: Order): number {
  return Math.max(0, Number(o.sub_total) - Number(o.discount ?? 0) - Number(o.bumdes_fee ?? 0));
}

export default function PendapatanPage() {
  const [balance, setBalance] = useState<Balance>({ pending: 0, available: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Balance }>("/seller/balance"),
      api.get<{ data: { data: Order[] } }>("/seller/orders"),
    ]).then(([balRes, ordRes]) => {
      setBalance(balRes.data.data ?? { pending: 0, available: 0 });
      setOrders(ordRes.data.data?.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const thisMonthDelivered = deliveredOrders.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const thisMonthRevenue = thisMonthDelivered.reduce((s, o) => s + sellerEarnings(o), 0);
  const avgPerTx = thisMonthDelivered.length > 0 ? thisMonthRevenue / thisMonthDelivered.length : 0;

  const barData = months.map((_, i) => {
    return deliveredOrders
      .filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === i && d.getFullYear() === thisYear;
      })
      .reduce((s, o) => s + sellerEarnings(o), 0);
  });
  const maxBar = Math.max(...barData, 1);

  const recentTx = [...orders]
    .filter(o => ["delivered", "confirmed", "processing", "shipped"].includes(o.status))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const stats = [
    { label: "Hak Seller Bulan Ini", value: loading ? "—" : formatRp(thisMonthRevenue) },
    { label: "Transaksi Selesai Bulan Ini", value: loading ? "—" : `${thisMonthDelivered.length} transaksi` },
    { label: "Rata-rata per Transaksi", value: loading ? "—" : (avgPerTx > 0 ? formatRp(avgPerTx) : "—") },
    { label: "Saldo Tersedia", value: loading ? "—" : formatRp(balance.available) },
    { label: "Saldo Menunggu", value: loading ? "—" : formatRp(balance.pending) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pendapatan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan keuangan toko Anda</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-2">{c.label}</p>
            <p className="text-xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 flex items-start gap-3">
        <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Hak Seller</strong> = Subtotal produk − Diskon voucher − Fee BUMDes. Ongkir dan biaya layanan tidak masuk ke pendapatan seller.
        </p>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Tren Hak Seller {thisYear}</h2>
        </div>
        <div className="flex items-end gap-1.5 h-36">
          {barData.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm"
                style={{ height: `${(v / maxBar) * 100}%`, background: "var(--primary)", opacity: v > 0 ? 0.75 + (v / maxBar) * 0.25 : 0.15, minHeight: v > 0 ? 4 : 2 }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          {months.map(m => <span key={m}>{m}</span>)}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Riwayat Transaksi</h2>
        </div>
        {loading ? (
          <div className="text-center py-10 text-sm text-gray-400">Memuat data...</div>
        ) : recentTx.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-400">Belum ada transaksi.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTx.map(t => {
              const earned = sellerEarnings(t);
              const bumdesFee = Number(t.bumdes_fee ?? 0);
              const discount = Number(t.discount ?? 0);
              const subTotal = Number(t.sub_total ?? 0);
              const hasDeductions = bumdesFee > 0 || discount > 0;
              const isExpanded = expandedId === t.id;

              return (
                <div key={t.id}>
                  <div
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => hasDeductions && setExpandedId(isExpanded ? null : t.id)}
                  >
                    {/* Kode & produk */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-gray-900">{t.order_code}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${t.status === "delivered" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                          {t.status === "delivered" ? "Selesai" : "Diproses"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {t.customer?.user?.name} · {new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate hidden md:block">{t.items?.[0]?.product_name ?? "-"}</p>
                    </div>

                    {/* Nominal */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatRp(earned)}</p>
                      {hasDeductions && (
                        <p className="text-[10px] text-gray-400 line-through">{formatRp(subTotal)}</p>
                      )}
                    </div>

                    {/* Chevron kalau ada potongan */}
                    {hasDeductions && (
                      <svg className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>

                  {/* Breakdown detail */}
                  {isExpanded && (
                    <div className="px-5 pb-3 pt-0">
                      <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal produk</span>
                          <span className="font-medium">{formatRp(subTotal)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-red-500">
                            <span>Diskon voucher</span>
                            <span>−{formatRp(discount)}</span>
                          </div>
                        )}
                        {bumdesFee > 0 && (
                          <div className="flex justify-between text-orange-500">
                            <span>Fee BUMDes</span>
                            <span>−{formatRp(bumdesFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5 mt-1">
                          <span>Hak Seller</span>
                          <span style={{ color: "var(--primary)" }}>{formatRp(earned)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
