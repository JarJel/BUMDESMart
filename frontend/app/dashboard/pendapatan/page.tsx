"use client";

const barData = [120, 180, 95, 240, 310, 220, 290, 180, 260, 380, 280, 220];
const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

const transactions = [
  { id: "TRX-001", produk: "Keripik Singkong Original x2", pelanggan: "Rina Kartika", tanggal: "17 Jun 2026", jumlah: 24000, status: "Sukses" },
  { id: "TRX-002", produk: "Keripik Pisang Cokelat x1", pelanggan: "Budi Santoso", tanggal: "16 Jun 2026", jumlah: 15000, status: "Sukses" },
  { id: "TRX-003", produk: "Keripik Singkong Pedas x3", pelanggan: "Sari Dewi", tanggal: "15 Jun 2026", jumlah: 36000, status: "Sukses" },
  { id: "TRX-004", produk: "Keripik Singkong Original x1", pelanggan: "Ahmad Yusuf", tanggal: "14 Jun 2026", jumlah: 12000, status: "Refund" },
];

export default function PendapatanPage() {
  const maxBar = Math.max(...barData);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pendapatan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ringkasan keuangan toko Anda</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Download PDF
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Pendapatan Bulan Ini", value: "Rp 4.280.000", change: "+12% vs bulan lalu", up: true },
          { label: "Transaksi Berhasil", value: "28 transaksi", change: "+5 vs bulan lalu", up: true },
          { label: "Rata-rata per Transaksi", value: "Rp 152.857", change: "+3% vs bulan lalu", up: true },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-2">{c.label}</p>
            <p className="text-xl font-bold text-gray-900 mb-1">{c.value}</p>
            <p className="text-xs text-green-600 font-medium">{c.change}</p>
          </div>
        ))}
      </div>

      {/* Chart + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Tren Pendapatan</h2>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white">
              <option>2026</option><option>2025</option>
            </select>
          </div>
          <div className="flex items-end gap-1.5 h-36">
            {barData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-sm" style={{ height: `${(v / maxBar) * 100}%`, background: "var(--primary)", opacity: 0.75 + (v / maxBar) * 0.25 }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            {months.map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900">Insights</h2>
          <div>
            <p className="text-xs text-gray-400 mb-3 font-medium">Produk Terlaris</p>
            <div className="space-y-2.5">
              {[
                { nama: "Keripik Singkong Original", pct: 42 },
                { nama: "Keripik Pisang Cokelat", pct: 28 },
                { nama: "Keripik Singkong Pedas", pct: 18 },
              ].map((p) => (
                <div key={p.nama}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 truncate max-w-28">{p.nama}</span>
                    <span className="text-gray-400">{p.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: "var(--primary)" }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2 font-medium">Aktivitas</p>
            <div className="space-y-2">
              {["28 pesanan selesai", "2 pesanan refund", "4.8 rating rata-rata"].map((a) => (
                <div key={a} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--primary-light)" }} />
                  {a}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Riwayat Transaksi</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-400">
              <th className="text-left px-5 py-3 font-medium">ID</th>
              <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Produk</th>
              <th className="text-left px-5 py-3 font-medium">Pelanggan</th>
              <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Tanggal</th>
              <th className="text-right px-5 py-3 font-medium">Jumlah</th>
              <th className="text-center px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-gray-900">{t.id}</td>
                <td className="px-5 py-3 text-gray-500 hidden md:table-cell max-w-36 truncate">{t.produk}</td>
                <td className="px-5 py-3 text-gray-700">{t.pelanggan}</td>
                <td className="px-5 py-3 text-gray-400 hidden lg:table-cell">{t.tanggal}</td>
                <td className="px-5 py-3 text-right font-bold text-gray-900">Rp {t.jumlah.toLocaleString("id")}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${t.status === "Sukses" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}