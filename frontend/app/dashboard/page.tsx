export default function DashboardPage() {
  const orders = [
    { id: "ORD-001", pelanggan: "Rina Kartika", produk: "Keripik Singkong Original x2", total: 24000, status: "Baru", waktu: "10 menit lalu" },
    { id: "ORD-002", pelanggan: "Budi Santoso", produk: "Keripik Pisang Cokelat x1", total: 15000, status: "Diproses", waktu: "1 jam lalu" },
    { id: "ORD-003", pelanggan: "Sari Dewi", produk: "Keripik Singkong Pedas x3", total: 36000, status: "Dikirim", waktu: "2 jam lalu" },
    { id: "ORD-004", pelanggan: "Ahmad Yusuf", produk: "Keripik Singkong Original x1", total: 12000, status: "Selesai", waktu: "1 hari lalu" },
  ];

  const statusColor: Record<string, string> = {
    Baru: "bg-blue-50 text-blue-600",
    Diproses: "bg-yellow-50 text-yellow-600",
    Dikirim: "bg-purple-50 text-purple-600",
    Selesai: "bg-green-50 text-green-700",
    Dibatalkan: "bg-red-50 text-red-600",
  };

  const barData = [42, 58, 35, 72, 90, 65, 80, 55, 68, 95, 78, 62, 88, 45, 71, 83, 60, 77, 92, 50, 66, 85, 73, 48, 69, 87, 56, 94, 70, 82];

  return (
    <div className="p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Selamat pagi, Bapak Asep!</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan aktivitas toko Anda hari ini</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Pendapatan", value: "Rp 4.280.000", change: "+12%", up: true, icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )},
          { label: "Pesanan Masuk", value: "28", change: "+5", up: true, icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          )},
          { label: "Produk Aktif", value: "8", change: "stabil", up: null, icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          )},
          { label: "Rating Toko", value: "4.8", change: "+0.1", up: true, icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          )},
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{card.label}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--primary-muted)", color: "var(--primary)" }}>
                {card.icon}
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
            <p className={`text-xs mt-1 font-medium ${card.up === true ? "text-green-600" : card.up === false ? "text-red-500" : "text-gray-400"}`}>
              {card.change} vs minggu lalu
            </p>
          </div>
        ))}
      </div>

      {/* Chart + Orders row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Bar Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Grafik Penjualan 30 Hari</h2>
              <p className="text-xs text-gray-400 mt-0.5">Total: Rp 4.280.000</p>
            </div>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white">
              <option>30 Hari</option>
              <option>7 Hari</option>
            </select>
          </div>
          <div className="flex items-end gap-0.5 h-32">
            {barData.map((h, i) => (
              <div key={i} className="flex-1 rounded-sm transition-all hover:opacity-80" style={{ height: `${h}%`, background: "var(--primary)", opacity: 0.7 + (h / 100) * 0.3 }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>1 Jun</span><span>15 Jun</span><span>30 Jun</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Ringkasan Cepat</h2>
          {[
            { label: "Pesanan Baru", val: "7", color: "bg-blue-500" },
            { label: "Perlu Dikonfirmasi", val: "3", color: "bg-yellow-400" },
            { label: "Dalam Pengiriman", val: "12", color: "bg-purple-500" },
            { label: "Stok Hampir Habis", val: "2", color: "bg-red-400" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                <span className="text-xs text-gray-600">{s.label}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Pesanan Terbaru</h2>
          <a href="/dashboard/pesanan" className="text-xs font-medium" style={{ color: "var(--primary)" }}>Lihat semua</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium">ID Pesanan</th>
                <th className="text-left px-5 py-3 font-medium">Pelanggan</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Produk</th>
                <th className="text-right px-5 py-3 font-medium">Total</th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
                <th className="text-center px-5 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{o.id}</td>
                  <td className="px-5 py-3 text-gray-600">{o.pelanggan}</td>
                  <td className="px-5 py-3 text-gray-500 hidden md:table-cell max-w-32 truncate">{o.produk}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">Rp {o.total.toLocaleString("id")}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[o.status]}`}>{o.status}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {o.status === "Baru" ? (
                      <button className="px-3 py-1 text-xs font-medium text-white rounded-lg" style={{ background: "var(--primary)" }}>Konfirmasi</button>
                    ) : (
                      <button className="px-3 py-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">Detail</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}