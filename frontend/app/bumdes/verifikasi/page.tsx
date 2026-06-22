"use client"
import { useState } from "react"

const ALL_UMKM = [
  { id: 1, name: "Keripik Mang Asep", owner: "Asep Sulaiman", phone: "081234567890", email: "asep@gmail.com", since: "3 hari lalu", status: "pending" },
  { id: 2, name: "Bakso Bu Eti", owner: "Eti Kusuma", phone: "089876543210", email: "eti@gmail.com", since: "1 hari lalu", status: "pending" },
  { id: 3, name: "Sambel Pak Budi", owner: "Budi Santoso", phone: "082345678901", email: "budi@gmail.com", since: "5 jam lalu", status: "pending" },
  { id: 4, name: "Tahu Goreng Mbak Sri", owner: "Sri Wahyuni", phone: "085678901234", email: "sri@gmail.com", since: "2 minggu lalu", status: "active" },
  { id: 5, name: "Wedang Uwuh Pak Darmo", owner: "Darmo Susanto", phone: "087890123456", email: "darmo@gmail.com", since: "1 bulan lalu", status: "rejected" },
]

const STATUS_COLOR: Record<string, string> = {
  pending:  "bg-yellow-50 text-yellow-700",
  active:   "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
}

export default function VerifikasiPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "rejected">("all")

  const filtered = ALL_UMKM.filter((u) => filter === "all" || u.status === filter)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Verifikasi UMKM</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tinjau dan verifikasi pendaftaran UMKM baru</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "pending", "active", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filter === f
                ? "text-white bg-green-700"
                : "text-gray-500 bg-white border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "Semua" : f === "pending" ? "Menunggu" : f === "active" ? "Aktif" : "Ditolak"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((u) => (
          <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: "#2D6A4F" }}>
                  {u.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[u.status]}`}>
                      {u.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{u.owner}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{u.phone} · {u.email}</p>
                  <p className="text-xs text-gray-400">Mendaftar {u.since}</p>
                </div>
              </div>

              {u.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <button className="px-4 py-2 text-xs font-semibold text-white rounded-xl bg-green-600 hover:bg-green-700">
                    Setujui
                  </button>
                  <button className="px-4 py-2 text-xs font-semibold text-red-500 border border-red-200 rounded-xl hover:bg-red-50">
                    Tolak
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
