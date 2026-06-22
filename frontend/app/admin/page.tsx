export default function AdminDashboard() {
  const stats = [
    { label: "Total Pengguna", value: "1.248", change: "+34 bulan ini", up: true },
    { label: "UMKM Aktif", value: "87", change: "+5 pending verif.", up: null },
    { label: "Total Pesanan", value: "4.612", change: "+12% vs bulan lalu", up: true },
    { label: "Pendapatan Platform", value: "Rp 12,4 Jt", change: "+8% vs bulan lalu", up: true },
  ]

  const recentUsers = [
    { name: "Siti Rahayu", email: "siti@gmail.com", role: "customer", status: "active", join: "2 jam lalu" },
    { name: "Bakso Mang Udin", email: "mangudin@gmail.com", role: "umkm", status: "pending", join: "5 jam lalu" },
    { name: "Rina Kartika", email: "rina@gmail.com", role: "customer", status: "active", join: "1 hari lalu" },
    { name: "Keripik Bu Asih", email: "buasih@gmail.com", role: "umkm", status: "active", join: "2 hari lalu" },
  ]

  const roleBadge: Record<string, string> = {
    customer: "bg-blue-50 text-blue-600",
    umkm: "bg-green-50 text-green-700",
    admin_bumdes: "bg-purple-50 text-purple-600",
    pengirim: "bg-orange-50 text-orange-600",
  }

  const statusBadge: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    pending: "bg-yellow-50 text-yellow-700",
    suspended: "bg-red-50 text-red-600",
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard Super Admin</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pantau seluruh aktivitas platform BumdesMart</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-2">{s.label}</p>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className={`text-xs mt-1 font-medium ${s.up === true ? "text-green-600" : "text-gray-400"}`}>
              {s.change}
            </p>
          </div>
        ))}
      </div>

      {/* Recent users */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Pengguna Terbaru</h2>
          <a href="/admin/pengguna" className="text-xs font-medium text-indigo-600">Lihat semua</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium">Nama</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Email</th>
                <th className="text-center px-5 py-3 font-medium">Role</th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Bergabung</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.email} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[u.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-400">{u.join}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
