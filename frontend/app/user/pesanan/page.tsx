"use client"
import { useState } from "react"

const ORDERS = [
  { code: "BMD-20240601-001", toko: "Keripik Mang Asep", produk: "Keripik Singkong Original x2", total: 24000, status: "delivered", tanggal: "1 Jun 2024" },
  { code: "BMD-20240602-002", toko: "Bakso Bu Eti", produk: "Bakso Urat Sapi x1", total: 18000, status: "shipped", tanggal: "2 Jun 2024" },
  { code: "BMD-20240603-003", toko: "Sambel Pak Budi", produk: "Sambal Ijo Istimewa x3", total: 45000, status: "processing", tanggal: "3 Jun 2024" },
  { code: "BMD-20240604-004", toko: "Keripik Mang Asep", produk: "Keripik Pisang Cokelat x2", total: 30000, status: "pending", tanggal: "4 Jun 2024" },
]

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:    { label: "Menunggu Pembayaran", cls: "bg-yellow-50 text-yellow-700" },
  processing: { label: "Diproses",            cls: "bg-blue-50 text-blue-600" },
  shipped:    { label: "Dikirim",             cls: "bg-purple-50 text-purple-600" },
  delivered:  { label: "Selesai",             cls: "bg-green-50 text-green-700" },
  cancelled:  { label: "Dibatalkan",          cls: "bg-red-50 text-red-600" },
}

const TABS = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "processing", label: "Diproses" },
  { key: "shipped", label: "Dikirim" },
  { key: "delivered", label: "Selesai" },
]

export default function UserPesananPage() {
  const [tab, setTab] = useState("all")

  const filtered = ORDERS.filter((o) => tab === "all" || o.status === tab)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pesanan Saya</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pantau status pesanan Anda</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              tab === t.key ? "text-white" : "text-gray-500 bg-white border border-gray-200 hover:bg-gray-50"
            }`}
            style={tab === t.key ? { background: "#2563eb" } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {filtered.map((o) => (
          <div key={o.code} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-semibold text-gray-900">{o.code}</p>
                <p className="text-xs text-gray-400">{o.toko} · {o.tanggal}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS[o.status]?.cls}`}>
                {STATUS[o.status]?.label}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <p className="text-xs text-gray-600">{o.produk}</p>
              <p className="text-sm font-bold text-gray-900">Rp {o.total.toLocaleString("id")}</p>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 py-1.5 text-xs font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                Detail
              </button>
              {o.status === "delivered" && (
                <button className="flex-1 py-1.5 text-xs font-semibold text-white rounded-xl" style={{ background: "#2563eb" }}>
                  Beli Lagi
                </button>
              )}
              {o.status === "pending" && (
                <button className="flex-1 py-1.5 text-xs font-semibold text-white rounded-xl" style={{ background: "#2563eb" }}>
                  Bayar Sekarang
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">Tidak ada pesanan ditemukan</div>
        )}
      </div>
    </div>
  )
}
