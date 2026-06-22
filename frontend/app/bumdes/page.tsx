export default function BumdesDashboard() {
  const stats = [
    { label: "UMKM Aktif", value: "87", change: "5 menunggu verifikasi" },
    { label: "Pesanan Hari Ini", value: "142", change: "+18% vs kemarin" },
    { label: "Pendapatan Bulan Ini", value: "Rp 28,4 Jt", change: "+11% vs bulan lalu" },
    { label: "Kategori Produk", value: "12", change: "2 kategori baru" },
  ]

  const pendingUmkm = [
    { name: "Keripik Mang Asep", owner: "Asep Sulaiman", phone: "081234567890", since: "3 hari lalu" },
    { name: "Bakso Bu Eti", owner: "Eti Kusuma", phone: "089876543210", since: "1 hari lalu" },
    { name: "Sambel Pak Budi", owner: "Budi Santoso", phone: "082345678901", since: "5 jam lalu" },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard BUMDes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola dan pantau ekosistem UMKM desa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-2">{s.label}</p>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs mt-1 text-gray-400">{s.change}</p>
          </div>
        ))}
      </div>

      {/* Pending verifikasi */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">UMKM Menunggu Verifikasi</h2>
            <span className="px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-semibold">3</span>
          </div>
          <a href="/bumdes/verifikasi" className="text-xs font-medium text-green-700">Lihat semua</a>
        </div>
        <div className="divide-y divide-gray-50">
          {pendingUmkm.map((u) => (
            <div key={u.name} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-500">{u.owner} · {u.phone}</p>
                <p className="text-xs text-gray-400 mt-0.5">Mendaftar {u.since}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg bg-green-600 hover:bg-green-700">
                  Setujui
                </button>
                <button className="px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                  Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
