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
  created_at: string;
  items: { product_name: string; quantity: number }[];
  customer: { user: { name: string } };
}

const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id");
}

export default function PendapatanPage() {
  const [balance, setBalance] = useState<Balance>({ pending: 0, available: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  const thisMonthRevenue = thisMonthDelivered.reduce((s, o) => s + Number(o.total), 0);
  const avgPerTx = thisMonthDelivered.length > 0 ? thisMonthRevenue / thisMonthDelivered.length : 0;

  // Monthly chart data for current year
  const barData = months.map((_, i) => {
    return deliveredOrders
      .filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === i && d.getFullYear() === thisYear;
      })
      .reduce((s, o) => s + Number(o.total), 0);
  });
  const maxBar = Math.max(...barData, 1);

  // Recent transactions (last 10 delivered/confirmed)
  const recentTx = [...orders]
    .filter(o => ["delivered", "confirmed", "processing", "shipped"].includes(o.status))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const stats = [
    {
      label: "Pendapatan Bulan Ini",
      value: loading ? "—" : formatRp(thisMonthRevenue),
    },
    {
      label: "Transaksi Selesai Bulan Ini",
      value: loading ? "—" : `${thisMonthDelivered.length} transaksi`,
    },
    {
      label: "Rata-rata per Transaksi",
      value: loading ? "—" : (avgPerTx > 0 ? formatRp(avgPerTx) : "—"),
    },
    {
      label: "Saldo Tersedia",
      value: loading ? "—" : formatRp(balance.available),
    },
    {
      label: "Saldo Menunggu",
      value: loading ? "—" : formatRp(balance.pending),
    },
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

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Tren Pendapatan {thisYear}</h2>
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
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400">
                <th className="text-left px-5 py-3 font-medium">ID</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Produk</th>
                <th className="text-left px-5 py-3 font-medium">Pelanggan</th>
                <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Tanggal</th>
                <th className="text-right px-5 py-3 font-medium">Total</th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map(t => (
                <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{t.order_code}</td>
                  <td className="px-5 py-3 text-gray-500 hidden md:table-cell max-w-36 truncate">
                    {t.items?.[0]?.product_name ?? "-"}
                  </td>
                  <td className="px-5 py-3 text-gray-700">{t.customer?.user?.name}</td>
                  <td className="px-5 py-3 text-gray-400 hidden lg:table-cell">
                    {new Date(t.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">
                    {formatRp(Number(t.total))}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${t.status === "delivered" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                      {t.status === "delivered" ? "Selesai" : "Diproses"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
