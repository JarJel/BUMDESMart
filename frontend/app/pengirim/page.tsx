"use client"
import { useState } from "react"

const RADIUS_OPTIONS = [2, 5, 10, 15, 20]

const AVAILABLE_ORDERS = [
  { id: "ORD-001", from: "Toko Keripik Mang Asep", to: "Jl. Melati No.5, RT 03", distance: "1.2 km", weight: "500g", fee: 8000 },
  { id: "ORD-002", from: "Bakso Bu Eti", to: "Perum Griya Indah Blok B-2", distance: "3.1 km", weight: "1.2 kg", fee: 12000 },
]

const ACTIVE_SHIPMENTS = [
  { resi: "JNE-123456789", penerima: "Rina Kartika", tujuan: "Jl. Melati No.5, Desa Sukamaju", estimasi: "Hari ini", status: "in_transit" },
  { resi: "JNE-112233445", penerima: "Sari Dewi", tujuan: "RT 03 RW 01, Desa Sejahtera", estimasi: "2 hari lagi", status: "pending" },
]

const STATUS: Record<string, { label: string; color: string; dot: string }> = {
  pending:    { label: "Siap Diambil",     color: "text-yellow-700 bg-yellow-50", dot: "bg-yellow-400" },
  picked_up:  { label: "Sudah Diambil",    color: "text-blue-600 bg-blue-50",    dot: "bg-blue-500" },
  in_transit: { label: "Dalam Perjalanan", color: "text-gray-700 bg-gray-100",   dot: "bg-gray-500" },
  delivered:  { label: "Terkirim",         color: "text-green-700 bg-green-50",  dot: "bg-green-500" },
}

export default function PengirimDashboard() {
  const [autoMode, setAutoMode] = useState(false)
  const [radius, setRadius] = useState(5)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-2xl mx-auto">

      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Dashboard Pengirim</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {autoMode
              ? `Aktif · mencari order dalam ${radius} km`
              : "Mode manual · pilih order sendiri"}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          autoMode ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
        }`}>
          {autoMode ? "Online" : "Offline"}
        </span>
      </div>

      {/* Auto-mode card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Mode Otomatis</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {autoMode
                ? "Order dalam radius masuk otomatis"
                : "Pilih order secara manual"}
            </p>
          </div>
          <button
            onClick={() => setAutoMode(!autoMode)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
              autoMode ? "bg-green-600" : "bg-gray-200"
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
              autoMode ? "translate-x-5" : "translate-x-0"
            }`} />
          </button>
        </div>

        {autoMode && (
          <div className="border-t border-gray-100 px-4 py-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Jangkauan pengiriman</p>
            <div className="flex gap-2 flex-wrap">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    radius === r
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order tersedia */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-900">Order Tersedia</p>
          <span className="text-xs text-gray-400">{AVAILABLE_ORDERS.length} order</span>
        </div>
        {AVAILABLE_ORDERS.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-sm text-gray-400">Belum ada order di sekitar kamu</p>
          </div>
        ) : (
          <div className="space-y-2">
            {AVAILABLE_ORDERS.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{o.from}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{o.to}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{o.distance}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{o.weight}</span>
                    <span className="font-semibold text-gray-900">
                      Rp {o.fee.toLocaleString("id")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                      Tolak
                    </button>
                    <button
                      className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg"
                      style={{ background: "#ea580c" }}
                    >
                      Ambil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pengiriman aktif */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-900">Pengiriman Aktif</p>
          <span className="text-xs text-gray-400">{ACTIVE_SHIPMENTS.length} paket</span>
        </div>
        <div className="space-y-2">
          {ACTIVE_SHIPMENTS.map((s) => {
            const st = STATUS[s.status]
            const open = expanded === s.resi
            return (
              <div key={s.resi} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setExpanded(open ? null : s.resi)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${st?.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900">{s.resi}</p>
                    <p className="text-xs text-gray-400 truncate">{s.penerima}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${st?.color}`}>
                    {st?.label}
                  </span>
                </button>

                {open && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    <div className="pt-3 space-y-2 text-xs text-gray-500 mb-3">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400 shrink-0">Tujuan</span>
                        <span className="text-right">{s.tujuan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Estimasi</span>
                        <span>{s.estimasi}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {s.status === "pending" && (
                        <button className="flex-1 py-2 text-xs font-semibold text-white rounded-xl" style={{ background: "#ea580c" }}>
                          Ambil Paket
                        </button>
                      )}
                      {s.status === "picked_up" && (
                        <button className="flex-1 py-2 text-xs font-semibold text-white rounded-xl" style={{ background: "#ea580c" }}>
                          Mulai Antar
                        </button>
                      )}
                      {s.status === "in_transit" && (
                        <button className="flex-1 py-2 text-xs font-semibold text-white rounded-xl" style={{ background: "#ea580c" }}>
                          Konfirmasi Terkirim
                        </button>
                      )}
                      <button className="px-4 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                        Navigasi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Selesai Hari Ini", val: "5" },
          { label: "Total Km", val: "12.4" },
          { label: "Pendapatan", val: "60rb" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
            <p className="text-base font-bold text-gray-900">{s.val}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

    </div>
  )
}
