import Link from "next/link";
import { dummyOrders, statusColor } from "@/lib/data/orders";

function formatRupiah(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

export default function PesananPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pesanan Saya</h1>
        <span className="text-sm text-gray-500">{dummyOrders.length} pesanan</span>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {["Semua", "Menunggu Bayar", "Diproses", "Dikirim", "Selesai"].map((tab) => (
          <button
            key={tab}
            className={`shrink-0 text-xs font-medium px-4 py-2 rounded-full border transition-colors ${tab === "Semua" ? "text-white border-transparent" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            style={tab === "Semua" ? { background: "var(--primary)" } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {dummyOrders.map((order) => {
          const sc = statusColor[order.status] || { bg: "#F3F4F6", text: "#6B7280" };
          return (
            <Link key={order.id} href={`/pesanan/${order.id}`} className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500">{order.id}</p>
                  <p className="text-sm font-semibold text-gray-900">{order.toko}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: sc.bg, color: sc.text }}>
                  {order.statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ background: "var(--surface)" }}>
                  🛍️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-1">{order.produk}</p>
                  <p className="text-xs text-gray-400">{order.qty} item · {new Date(order.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <p className="text-sm font-bold shrink-0" style={{ color: "var(--primary)" }}>{formatRupiah(order.total)}</p>
              </div>
              {order.noResi && (
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-500">
                  <span>📦 No. Resi: <strong className="text-gray-700">{order.noResi}</strong></span>
                  <span className="text-gray-300">·</span>
                  <span>{order.ekspedisi}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
