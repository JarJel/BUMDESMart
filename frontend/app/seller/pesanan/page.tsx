"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

interface OrderItem {
  id: number;
  product: { id: number; name: string };
  product_name: string;
  quantity: number;
  product_price: number;
}

interface Order {
  id: number;
  order_code: string;
  status: string;
  total: number;
  created_at: string;
  customer: { user: { name: string } };
  address: { city: string; address: string } | null;
  items: OrderItem[];
}

const STATUS_LABEL: Record<string, string> = {
  pending:    "Baru",
  confirmed:  "Dikonfirmasi",
  processing: "Siap Dikirim",
  shipped:    "Dikirim",
  delivered:  "Selesai",
  cancelled:  "Dibatalkan",
};

const STATUS_COLOR: Record<string, string> = {
  pending:    "bg-blue-50 text-blue-600",
  confirmed:  "bg-yellow-50 text-yellow-700",
  processing: "bg-orange-50 text-orange-600",
  shipped:    "bg-purple-50 text-purple-600",
  delivered:  "bg-green-50 text-green-700",
  cancelled:  "bg-red-50 text-red-600",
};

const TAB_STATUSES: Record<string, string[]> = {
  Semua: [],
  Baru: ["pending"],
  Dikonfirmasi: ["confirmed"],
  "Siap Dikirim": ["processing"],
  Dikirim: ["shipped"],
  Selesai: ["delivered"],
  Dibatalkan: ["cancelled"],
};

const tabs = Object.keys(TAB_STATUSES);

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function PesananPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Semua");
  const [search, setSearch] = useState("");
  const [actioning, setActioning] = useState<number | null>(null);
  const toast = useToast();

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api.get<{ data: { data: Order[] } }>("/seller/orders")
      .then(res => setOrders(res.data.data?.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (id: number, status: "confirmed" | "processing" | "cancelled") => {
    setActioning(id);
    const messages: Record<string, string> = {
      confirmed:  "Pesanan dikonfirmasi.",
      processing: "Pesanan ditandai siap dikirim. Kurir akan segera mengambil.",
      cancelled:  "Pesanan dibatalkan.",
    };
    try {
      await api.patch(`/seller/orders/${id}/status`, { status });
      toast.success(messages[status]);
      fetchOrders();
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

  const summary = {
    total:       orders.length,
    baru:        orders.filter(o => o.status === "pending").length,
    siapDikirim: orders.filter(o => o.status === "processing").length,
    dikirim:     orders.filter(o => o.status === "shipped").length,
    selesai:     orders.filter(o => o.status === "delivered").length,
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Daftar Pesanan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola semua pesanan masuk toko Anda</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 overflow-x-auto">
        {tabs.map(tab => (
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
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari ID atau nama pelanggan..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Memuat pesanan...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">
            {orders.length === 0 ? "Belum ada pesanan masuk." : "Tidak ada pesanan yang sesuai filter."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
                <th className="text-left px-5 py-3 font-medium">ID Pesanan</th>
                <th className="text-left px-5 py-3 font-medium">Pelanggan</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Produk</th>
                <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Tanggal</th>
                <th className="text-right px-5 py-3 font-medium">Total</th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
                <th className="text-center px-5 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const produkLabel = o.items
                  .map(i => `${i.product_name || i.product?.name} x${i.quantity}`)
                  .join(", ");
                const label = STATUS_LABEL[o.status] ?? o.status;
                const color = STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-500";
                return (
                  <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-900 text-xs">{o.order_code}</td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-medium text-gray-900">{o.customer?.user?.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-32">{o.address?.city}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 hidden md:table-cell max-w-36 truncate">{produkLabel}</td>
                    <td className="px-5 py-3 text-xs text-gray-400 hidden lg:table-cell">{formatDate(o.created_at)}</td>
                    <td className="px-5 py-3 text-right text-xs font-bold text-gray-900">
                      Rp {Number(o.total).toLocaleString("id")}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {o.status === "pending" && (
                          <button
                            onClick={() => handleStatusChange(o.id, "confirmed")}
                            disabled={actioning === o.id}
                            className="px-2.5 py-1 text-xs font-semibold text-white rounded-lg disabled:opacity-50"
                            style={{ background: "var(--primary)" }}>
                            {actioning === o.id ? "..." : "Konfirmasi"}
                          </button>
                        )}
                        {o.status === "confirmed" && (
                          <button
                            onClick={() => handleStatusChange(o.id, "processing")}
                            disabled={actioning === o.id}
                            className="px-2.5 py-1 text-xs font-semibold text-white rounded-lg disabled:opacity-50 bg-orange-500">
                            {actioning === o.id ? "..." : "Siap Dikirim"}
                          </button>
                        )}
                        {o.status === "processing" && (
                          <span className="text-xs text-orange-500 font-medium">Menunggu kurir</span>
                        )}
                        <button className="px-2.5 py-1 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && (
          <div className="flex flex-wrap gap-4 px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            <span>Total: <strong className="text-gray-900">{summary.total}</strong></span>
            <span>Baru: <strong className="text-blue-600">{summary.baru}</strong></span>
            <span>Siap Dikirim: <strong className="text-orange-500">{summary.siapDikirim}</strong></span>
            <span>Dalam Pengiriman: <strong className="text-purple-600">{summary.dikirim}</strong></span>
            <span>Selesai: <strong className="text-green-700">{summary.selesai}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
