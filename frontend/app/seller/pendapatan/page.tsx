"use client";
import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api/axios";

interface Order {
  id: number;
  order_code: string;
  status: string;
  total: number;
  sub_total: number;
  discount: number;
  bumdes_fee: number;
  shipping_cost: number;
  service_fee: number;
  created_at: string;
  items: { product_name: string; quantity: number }[];
  customer: { user: { name: string } };
}

const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const monthNamesFull = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id");
}

function sellerEarnings(o: Order): number {
  return Math.max(0, Number(o.sub_total) - Number(o.discount ?? 0) - Number(o.bumdes_fee ?? 0));
}

function CustomFilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) ?? options[0];

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-xs font-medium text-gray-500 shrink-0">{label}:</span>
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full text-left py-2 px-3 text-xs bg-white border border-gray-200 rounded-xl font-semibold text-gray-800 hover:border-green-400 focus:outline-none transition-colors shadow-2xs"
        >
          {selectedOption?.label}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <div className="absolute right-0 left-0 mt-1.5 z-30 max-h-56 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-xl py-1 space-y-0.5">
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                    value === opt.value
                      ? "bg-green-50 text-green-700 font-bold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PendapatanPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Table filters & pagination state
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>(String(thisYear));
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    api.get<{ data: { data: Order[] } }>("/seller/orders")
      .then((ordRes) => {
        setOrders(ordRes.data.data?.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, searchQuery]);

  const currentMonthName = monthNamesFull[thisMonth];

  // Pesanan selesai (status 'delivered' atau 'completed')
  const completedOrders = useMemo(() => orders.filter(o => ["delivered", "completed"].includes(o.status)), [orders]);
  const thisMonthCompleted = useMemo(() => completedOrders.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }), [completedOrders, thisMonth, thisYear]);

  const activeCompletedList = thisMonthCompleted.length > 0 ? thisMonthCompleted : completedOrders;
  const activeRevenue = activeCompletedList.reduce((s, o) => s + sellerEarnings(o), 0);
  const avgPerTx = activeCompletedList.length > 0 ? activeRevenue / activeCompletedList.length : 0;

  const barData = months.map((_, i) => {
    return completedOrders
      .filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === i && d.getFullYear() === thisYear;
      })
      .reduce((s, o) => s + sellerEarnings(o), 0);
  });
  const maxBar = Math.max(...barData, 1);

  // Filtered transactions for table
  const filteredTx = useMemo(() => {
    return orders
      .filter(o => {
        const isValidStatus = ["delivered", "completed", "confirmed", "processing", "shipped"].includes(o.status);
        if (!isValidStatus) return false;

        const d = new Date(o.created_at);
        if (selectedMonth !== "all" && d.getMonth() !== Number(selectedMonth)) return false;
        if (selectedYear !== "all" && d.getFullYear() !== Number(selectedYear)) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const codeMatch = o.order_code.toLowerCase().includes(q);
          const nameMatch = (o.customer?.user?.name ?? "").toLowerCase().includes(q);
          const productMatch = (o.items ?? []).some(i => i.product_name?.toLowerCase().includes(q));
          if (!codeMatch && !nameMatch && !productMatch) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, selectedMonth, selectedYear, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTx.length / itemsPerPage));
  const paginatedTx = useMemo(() => {
    return filteredTx.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredTx, currentPage, itemsPerPage]);

  const stats = [
    { label: "Transaksi Bulan Ini", value: loading ? "—" : `${thisMonthCompleted.length} transaksi` },
    { label: "Rata-rata Transaksi", value: loading ? "—" : formatRp(avgPerTx) },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pendapatan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan keuangan toko Anda</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs">
            <p className="text-xs text-gray-400 mb-2">{c.label}</p>
            <p className="text-xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-gray-900">Grafik Pendapatan {currentMonthName} {thisYear}</h2>
          <span className="text-xs text-gray-400 font-medium">Tahun {thisYear}</span>
        </div>
        
        <div className="relative flex items-end gap-2 h-44 pt-6 pb-2">
          {barData.map((v, i) => {
            const isCurrent = i === thisMonth;
            const barHeightPct = maxBar > 0 ? (v / maxBar) * 100 : 0;
            return (
              <div 
                key={i} 
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Tooltip */}
                {hoveredBar === i && (
                  <div className="absolute -top-9 z-10 bg-gray-900 text-white text-[10px] font-semibold py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap">
                    {months[i]}: {formatRp(v)}
                  </div>
                )}
                
                {/* Nilai singkat di atas bar jika ada nilai */}
                {v > 0 && hoveredBar !== i && (
                  <span className="text-[9px] font-semibold text-gray-500 mb-1">
                    {v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : `${Math.round(v / 1000)}k`}
                  </span>
                )}

                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isCurrent ? "bg-green-600" : "bg-green-500/70 hover:bg-green-500"
                  }`}
                  style={{
                    height: `${barHeightPct}%`,
                    minHeight: v > 0 ? 6 : 2,
                    opacity: v > 0 ? 1 : 0.2,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2 px-1 border-t border-gray-50 pt-2">
          {months.map((m, i) => (
            <span 
              key={m} 
              className={`text-center flex-1 font-medium ${i === thisMonth ? "text-green-700 font-bold" : ""}`}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Tabel Riwayat Transaksi */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs">
        {/* Header & Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Tabel Riwayat Transaksi</h2>
              <p className="text-xs text-gray-500 mt-0.5">Filter riwayat pendapatan toko berdasarkan bulan dan kata kunci</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold self-start sm:self-auto">
              Total {filteredTx.length} Transaksi
            </span>
          </div>

          {/* Controls: Search + Filter Bulan + Filter Tahun */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari ID pesanan, nama pembeli..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:bg-white transition-colors"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filter Bulan */}
            <div className="sm:col-span-4">
              <CustomFilterDropdown
                label="Bulan"
                options={[
                  { value: "all", label: "Semua Bulan" },
                  ...monthNamesFull.map((mName, idx) => ({ value: String(idx), label: mName })),
                ]}
                value={selectedMonth}
                onChange={setSelectedMonth}
              />
            </div>

            {/* Filter Tahun */}
            <div className="sm:col-span-3">
              <CustomFilterDropdown
                label="Tahun"
                options={[
                  { value: "all", label: "Semua Tahun" },
                  { value: "2026", label: "2026" },
                  { value: "2025", label: "2025" },
                  { value: "2024", label: "2024" },
                ]}
                value={selectedYear}
                onChange={setSelectedYear}
              />
            </div>
          </div>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-4">Kode Pesanan</th>
                <th className="py-3 px-4">Pembeli</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Pendapatan (Hak Seller)</th>
                <th className="py-3 px-4 text-center">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : paginatedTx.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Tidak ada transaksi pada filter ini.
                  </td>
                </tr>
              ) : (
                paginatedTx.map(t => {
                  const earned = sellerEarnings(t);
                  const bumdesFee = Number(t.bumdes_fee ?? 0);
                  const discount = Number(t.discount ?? 0);
                  const subTotal = Number(t.sub_total ?? 0);
                  const hasDeductions = bumdesFee > 0 || discount > 0;
                  const isExpanded = expandedId === t.id;

                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                        {t.order_code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-800 whitespace-nowrap">
                        {t.customer?.user?.name || "Pembeli"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                        {t.items?.map(i => `${i.product_name} (${i.quantity}x)`).join(", ") || "-"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          ["delivered", "completed"].includes(t.status)
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${["delivered", "completed"].includes(t.status) ? "bg-green-500" : "bg-amber-500"}`} />
                          {["delivered", "completed"].includes(t.status) ? "Selesai" : "Diproses"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-gray-900 block" style={{ color: "var(--primary)" }}>
                          {formatRp(earned)}
                        </span>
                        {hasDeductions && (
                          <span className="text-[10px] text-gray-400 line-through">
                            {formatRp(subTotal)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {hasDeductions ? (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : t.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold transition-colors"
                          >
                            <span>{isExpanded ? "Tutup" : "Lihat"}</span>
                            <svg className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}

                        {/* Breakdown popup / row detail */}
                        {isExpanded && hasDeductions && (
                          <div className="mt-2 text-left bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1 text-[11px]">
                            <div className="flex justify-between text-gray-500">
                              <span>Subtotal Produk:</span>
                              <span className="font-medium text-gray-800">{formatRp(subTotal)}</span>
                            </div>
                            {discount > 0 && (
                              <div className="flex justify-between text-red-600">
                                <span>Diskon Voucher:</span>
                                <span>−{formatRp(discount)}</span>
                              </div>
                            )}
                            {bumdesFee > 0 && (
                              <div className="flex justify-between text-amber-600">
                                <span>Fee BUMDes:</span>
                                <span>−{formatRp(bumdesFee)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                              <span>Hak Seller:</span>
                              <span className="text-green-700">{formatRp(earned)}</span>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Control Pagination */}
        {!loading && filteredTx.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-gray-500 font-medium">
              Menampilkan <strong className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</strong> – <strong className="text-gray-900">{Math.min(currentPage * itemsPerPage, filteredTx.length)}</strong> dari <strong className="text-gray-900">{filteredTx.length}</strong> transaksi
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      currentPage === page
                        ? "bg-green-600 text-white shadow-xs"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
