"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ApexChart from "@/components/shared/ApexChart";
import api from "@/lib/api/axios";
import {
  IconStore, IconBox, IconMoney, IconShoppingBag,
  IconCheck, IconDoc, IconTag, IconShield, IconChevronRight,
} from "@/components/shared/Icon";
import type { ApexOptions } from "apexcharts";

function rupiah(n: number) {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}

interface BalanceData {
  pending: number;
  available: number;
  total_seller_fee: number;
  total_service_fee: number;
  month_seller_fee: number;
  month_service_fee: number;
  month_total: number;
}
type ChartKey = "umkm" | "pendapatan";
type PeriodKey = "1b" | "3b" | "6b" | "12b";

const CHART_META: Record<ChartKey, { label: string; color: string; unit: string }> = {
  umkm:       { label: "UMKM",       color: "#16a34a", unit: " mitra" },
  pendapatan: { label: "Pendapatan", color: "#f59e0b", unit: " Jt"    },
};

// Data bulanan per tahun (12 bulan: Jan-Des)
const BASE_MONTHLY: Record<ChartKey, Record<number, number[]>> = {
  umkm: {
    2024: [5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27],
    2025: [8, 12, 16, 20, 24, 28, 33, 39, 44, 51, 57, 63],
    2026: [12, 18, 22, 28, 35, 40, 48, 55, 62, 71, 80, 87],
  },
  pendapatan: {
    2024: [1.5, 2.1, 2.3, 3.0, 3.8, 3.5, 4.2, 4.8, 5.1, 6.2, 7.5, 9.1],
    2025: [2.8, 4.0, 3.9, 5.5, 6.8, 6.3, 8.0, 9.5, 9.2, 12.1, 14.8, 18.5],
    2026: [4.2, 6.1, 5.8, 8.4, 10.2, 9.7, 12.1, 14.3, 13.8, 18.2, 22.5, 28.4],
  },
};

// Data harian per tahun (30 hari — bulan representatif)
const BASE_DAILY: Record<ChartKey, Record<number, number[]>> = {
  umkm: {
    2024: [15,15,16,16,15,17,17,16,18,18,17,19,19,18,20,20,19,21,21,20,22,22,21,23,23,22,24,24,23,25],
    2025: [55,56,57,55,58,58,59,60,59,61,61,60,62,62,61,63,63,62,64,64,63,65,65,64,66,66,65,67,67,63],
    2026: [48,50,51,49,52,53,54,55,54,56,57,55,58,59,60,61,59,62,63,64,62,65,66,67,66,68,69,70,71,72],
  },
  pendapatan: {
    2024: [3.5,3.7,3.6,3.8,3.9,3.8,4.0,4.1,4.0,4.2,4.3,4.2,4.4,4.5,4.4,4.6,4.7,4.6,4.8,4.9,4.8,5.0,5.1,5.0,5.2,5.3,5.2,5.4,5.5,5.4],
    2025: [8.5,8.8,8.7,9.0,9.2,9.1,9.4,9.6,9.5,9.8,10.0,9.9,10.2,10.4,10.3,10.6,10.8,10.7,11.0,11.2,11.1,11.4,11.6,11.5,11.8,12.0,11.9,12.2,12.4,12.3],
    2026: [12.1,12.5,11.8,13.0,12.7,13.5,13.2,14.0,13.8,14.5,14.2,15.0,14.8,15.5,15.2,16.0,15.8,16.5,16.2,17.0,16.8,17.5,17.2,18.0,17.8,18.5,18.2,19.0,18.8,19.5],
  },
};

const MONTHS_ALL  = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const AVAILABLE_YEARS = [2022, 2023, 2024, 2025, 2026];

// Labels sumbu X per periode
const getChartLabels = (period: PeriodKey, startMonth: number = 1): string[] => {
  if (period === "1b")  return Array.from({ length: 30 }, (_, i) => `${i + 1}`);
  if (period === "3b")  return MONTHS_ALL.slice(startMonth - 1, startMonth - 1 + 3);
  if (period === "6b")  return MONTHS_ALL.slice(startMonth - 1, startMonth - 1 + 6);
  return MONTHS_ALL;                                  // 12b: Jan–Des
};

// Data series per tahun dan periode
const getChartSeries = (key: ChartKey, year: number, period: PeriodKey, startMonth: number = 1): number[] => {
  if (period === "1b") return BASE_DAILY[key][Math.min(year, 2026)] ?? BASE_DAILY[key][2026];
  const monthly = BASE_MONTHLY[key][Math.min(year, 2026)] ?? BASE_MONTHLY[key][2026];
  if (period === "3b") return monthly.slice(startMonth - 1, startMonth - 1 + 3);
  if (period === "6b") return monthly.slice(startMonth - 1, startMonth - 1 + 6);
  return monthly;                                 // 12b: semua bulan
};

// Judul informatif
const getPeriodTitle = (year: number, period: PeriodKey, startMonth: number = 1): string => {
  if (period === "1b")  return `Desember ${year}`;
  if (period === "3b") {
    const end = Math.min(startMonth - 1 + 2, 11);
    return `${MONTHS_ALL[startMonth - 1]} – ${MONTHS_ALL[end]} ${year}`;
  }
  if (period === "6b") {
    const end = Math.min(startMonth - 1 + 5, 11);
    return `${MONTHS_ALL[startMonth - 1]} – ${MONTHS_ALL[end]} ${year}`;
  }
  return `Jan – Des ${year}`;
};

const pendingUmkm = [
  { id: 1, name: "Keripik Mang Asep", owner: "Asep Sulaiman", since: "3 hari lalu", docs: 3 },
  { id: 2, name: "Bakso Bu Eti",      owner: "Eti Kusuma",    since: "1 hari lalu", docs: 2 },
  { id: 3, name: "Sambel Pak Budi",   owner: "Budi Santoso",  since: "5 jam lalu",  docs: 4 },
];

const recentActivity = [
  { text: "Toko Keripik Mang Asep mendaftar",   time: "3 jam lalu", color: "#f59e0b" },
  { text: "CV Maju Jaya berhasil diverifikasi", time: "5 jam lalu", color: "#16a34a" },
  { text: "Produk baru: Sirup Jeruk Peras",     time: "6 jam lalu", color: "#3b82f6" },
  { text: "Pesanan #ORD-1042 selesai",          time: "8 jam lalu", color: "#8b5cf6" },
];

export default function BumdesDashboard() {
  const [activeChart, setActiveChart]   = useState<ChartKey>("umkm");
  const [activePeriod, setActivePeriod] = useState<PeriodKey>("12b");
  const [activeYear, setActiveYear]     = useState<number>(2026);
  const [startMonth, setStartMonth]     = useState<number>(1); // Bulan awal (1=Jan)

  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);

  const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace("/api/v1", "");

  useEffect(() => {
    // Fetch saldo
    api.get("/admin/balance")
      .then(r => setBalance(r.data.data))
      .catch(() => {});

    // Fetch berita dari endpoint broadcasts (BumdesBroadcast — data konsisten dengan seller & publik)
    api.get("/admin/broadcasts")
      .then(res => setNewsList(res.data.data?.data?.slice(0, 4) ?? []))
      .catch(() => setNewsList([]))
      .finally(() => setLoadingNews(false));
  }, []);

  // Saat ganti periode, pastikan startMonth masih valid
  const handlePeriodChange = (p: PeriodKey) => {
    setActivePeriod(p);
    if (p === "3b" && startMonth > 10) setStartMonth(10);
    if (p === "6b" && startMonth > 7)  setStartMonth(7);
  };

  // Bulan awal yang valid: 3b=Jan-Okt, 6b=Jan-Jul
  const maxStart = activePeriod === "3b" ? 10 : activePeriod === "6b" ? 7 : 12;

  const meta        = CHART_META[activeChart];
  const seriesData  = getChartSeries(activeChart, activeYear, activePeriod, startMonth);
  const chartLabels = getChartLabels(activePeriod, startMonth);
  const periodTitle = getPeriodTitle(activeYear, activePeriod, startMonth);
  const growth      = seriesData.length >= 2
    ? (((seriesData[seriesData.length - 1] - seriesData[0]) / seriesData[0]) * 100).toFixed(0)
    : "0";

  const areaOptions: ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false }, animations: { speed: 500 } },
    colors: [meta.color],
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02, stops: [0, 100] } },
    stroke: { curve: "smooth", width: 2.5 },
    markers: { size: 4, strokeWidth: 2, strokeColors: "#fff", fillOpacity: 1 },
    xaxis: {
      categories: chartLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "11px", colors: "#9ca3af" }, rotate: activePeriod === "1b" ? -45 : 0 },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: "#9ca3af" },
        formatter: (v: number) => `${v}${meta.unit}`,
      },
    },
    grid: { borderColor: "#f3f4f6", strokeDashArray: 4, xaxis: { lines: { show: false } } },
    tooltip: { y: { formatter: (v: number) => `${v.toLocaleString("id-ID")}${meta.unit}` } },
    dataLabels: { enabled: false },
  };

  const stats = [
    { label: "UMKM Aktif",          value: "87",          sub: "5 menunggu verifikasi", Icon: IconStore,       bg: "bg-green-50",  fg: "text-green-600"  },
    { label: "Pesanan Hari Ini",     value: "142",         sub: "+18% vs kemarin",       Icon: IconBox,         bg: "bg-blue-50",   fg: "text-blue-500"   },
    { label: "Pendapatan Bulan Ini", value: "Rp 28,4 Jt", sub: "+11% vs bulan lalu",   Icon: IconMoney,       bg: "bg-yellow-50", fg: "text-yellow-500" },
    { label: "Total Produk",         value: "364",         sub: "12 kategori aktif",     Icon: IconShoppingBag, bg: "bg-purple-50", fg: "text-purple-600" },
  ];

  const quickLinks = [
    { href: "/bumdes/verifikasi", label: "Verifikasi UMKM", desc: "Tinjau pendaftar baru",       Icon: IconShield },
    { href: "/bumdes/dokumen",    label: "Dokumen Wajib",   desc: "Atur persyaratan dokumen",    Icon: IconDoc    },
    { href: "/bumdes/kategori",   label: "Kategori Produk", desc: "Kelola kategori marketplace", Icon: IconTag    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard BUMDes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola dan pantau ekosistem UMKM desa</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, Icon, bg, fg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{label}</p>
              <span className={`p-1.5 rounded-xl ${bg} ${fg}`}><Icon size={16} /></span>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs mt-1 text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Saldo BUMDes — ringkasan, detail di /bumdes/saldo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Saldo BUMDes</h2>
          <Link href="/bumdes/saldo" className="text-xs font-medium text-green-700">Kelola saldo →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Tersedia</p>
            <p className="text-lg font-bold text-green-700 mt-0.5">{balance ? rupiah(balance.available) : "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Menunggu</p>
            <p className="text-lg font-bold text-gray-700 mt-0.5">{balance ? rupiah(balance.pending) : "—"}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Bulan Ini</p>
            <p className="text-lg font-bold text-blue-700 mt-0.5">{balance ? rupiah(balance.month_total) : "—"}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-yellow-700 mt-0.5">{balance ? rupiah(balance.total_seller_fee + balance.total_service_fee) : "—"}</p>
          </div>
        </div>
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Tren Platform</h2>
              <p className="text-xs text-gray-400 mt-0.5">{periodTitle}</p>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              {/* Baris 1: Filter Metrik */}
              <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                {(["umkm", "pendapatan"] as ChartKey[]).map(k => (
                  <button
                    key={k}
                    onClick={() => setActiveChart(k)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeChart === k ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {CHART_META[k].label}
                  </button>
                ))}
              </div>
              {/* Baris 2: Dropdown Tahun | Tombol Periode | Dropdown Bulan Awal (kondisional) */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Dropdown Tahun */}
                <div className="relative">
                  <select
                    value={activeYear}
                    onChange={e => setActiveYear(Number(e.target.value))}
                    className="pl-2.5 pr-7 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 cursor-pointer appearance-none transition-colors hover:border-gray-300"
                  >
                    {AVAILABLE_YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <svg className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <span className="text-gray-200 text-xs">|</span>

                {/* Tombol Periode */}
                <div className="flex gap-1">
                  {(["1b", "3b", "6b", "12b"] as PeriodKey[]).map((p) => {
                    const labels: Record<PeriodKey, string> = { "1b": "1B", "3b": "3B", "6b": "6B", "12b": "12B" };
                    return (
                      <button
                        key={p}
                        onClick={() => handlePeriodChange(p)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          activePeriod === p
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 bg-white"
                        }`}
                      >
                        {labels[p]}
                      </button>
                    );
                  })}
                </div>

                {/* Dropdown Bulan Awal — muncul hanya saat 3B atau 6B */}
                {(activePeriod === "3b" || activePeriod === "6b") && (
                  <>
                    <span className="text-gray-200 text-xs">|</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">Mulai:</span>
                      <div className="relative">
                        <select
                          value={startMonth}
                          onChange={e => setStartMonth(Number(e.target.value))}
                          className="pl-2.5 pr-7 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-green-300 rounded-lg focus:outline-none focus:border-green-500 cursor-pointer appearance-none transition-colors hover:border-green-400"
                        >
                          {Array.from({ length: maxStart }).map((_, idx) => {
                            const monthsFull = [
                              "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                              "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                            ];
                            const startName = monthsFull[idx];
                            const offset = activePeriod === "3b" ? 2 : 5;
                            const endName = monthsFull[idx + offset];
                            return (
                              <option key={idx + 1} value={idx + 1}>
                                {startName} - {endName}
                              </option>
                            );
                          })}
                        </select>
                        <svg className="w-3 h-3 text-green-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <ApexChart type="area" series={[{ name: meta.label, data: seriesData }]} options={areaOptions} height={220} />

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
            <div>
              <p className="text-xs text-gray-400">Nilai Tertinggi</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{Math.max(...seriesData).toLocaleString("id-ID")}{meta.unit}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Rata-rata</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {(seriesData.reduce((a,b)=>a+b,0)/seriesData.length).toFixed(meta.unit === " Jt" ? 1 : 0)}{meta.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">{activePeriod === "12b" ? "Pertumbuhan" : "Perubahan"}</p>
              <p className={`text-sm font-bold mt-0.5 ${Number(growth) >= 0 ? "text-green-600" : "text-red-500"}`}>
                {Number(growth) >= 0 ? "+" : ""}{growth}%
              </p>
            </div>
          </div>
        </div>

        {/* Berita Terkini */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
            <h2 className="text-sm font-semibold text-gray-900">Berita Terkini</h2>
            <Link href="/bumdes/berita" className="text-xs font-semibold text-green-600 hover:text-green-700">
              Kelola →
            </Link>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[320px] pr-1">
            {loadingNews ? (
              <div className="text-center py-8 text-xs text-gray-400">Memuat berita...</div>
            ) : newsList.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-400 space-y-1">
                <p>Belum ada berita yang diterbitkan.</p>
                <Link href="/bumdes/berita" className="text-green-600 hover:underline text-[11px]">Tulis Berita Baru</Link>
              </div>
            ) : (
              newsList.map((a) => {
                const firstPhoto = a.photos?.[0];
                const photoUrl = firstPhoto ? (firstPhoto.startsWith("http") ? firstPhoto : `${BASE_URL}${firstPhoto}`) : null;
                const catColors: Record<string, string> = {
                  pengumuman: "bg-blue-50 text-blue-700", pelatihan: "bg-purple-50 text-purple-700",
                  info_bantuan: "bg-yellow-50 text-yellow-700", jadwal: "bg-orange-50 text-orange-700",
                  acara: "bg-pink-50 text-pink-700", promosi: "bg-green-50 text-green-700",
                  sistem: "bg-gray-100 text-gray-600", undangan: "bg-indigo-50 text-indigo-700",
                };
                const catLabels: Record<string, string> = {
                  pengumuman: "Pengumuman", pelatihan: "Pelatihan", info_bantuan: "Info Bantuan",
                  jadwal: "Jadwal", acara: "Acara Desa", promosi: "Promosi", sistem: "Sistem", undangan: "Undangan",
                };
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedNews(a)}
                    className="flex gap-3 items-start p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                      {photoUrl ? (
                        <img src={photoUrl} alt={a.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide ${catColors[a.category] ?? "bg-gray-100 text-gray-600"}`}>
                          {catLabels[a.category] ?? "Info"}
                        </span>
                        {a.photos && a.photos.length > 1 && (
                          <span className="text-[8px] text-gray-400">📷 {a.photos.length}</span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-900 line-clamp-1">{a.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(a.sent_at ?? a.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Pending verifikasi */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">UMKM Menunggu Verifikasi</h2>
            <span className="px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-xs font-semibold">{pendingUmkm.length}</span>
          </div>
          <Link href="/bumdes/verifikasi" className="text-xs font-medium text-green-700">Lihat semua</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {pendingUmkm.map(u => (
            <div key={u.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div>
                <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{u.owner} · Daftar {u.since}</p>
                <p className="text-xs text-gray-400 mt-0.5">{u.docs} dokumen diunggah</p>
              </div>
              <Link href="/bumdes/verifikasi" className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg bg-green-600 hover:bg-green-700 shrink-0">
                Tinjau
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map(({ href, label, desc, Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow group">
            <span className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
              <Icon size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <IconChevronRight size={14} className="text-gray-300 ml-auto shrink-0" />
          </Link>
        ))}
      </div>

      {/* Modal Detail Berita */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 pr-4">Detail Berita</h2>
              <button onClick={() => setSelectedNews(null)} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition shrink-0">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {/* Slider Foto */}
              {selectedNews.photos && selectedNews.photos.length > 0 && (() => {
                const NewsPhotoSlider = () => {
                  const [pidx, setPidx] = useState(0);
                  const photoUrls = selectedNews.photos!.map((p: string) =>
                    p.startsWith("http") ? p : `${BASE_URL}${p}`
                  );
                  return (
                    <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden">
                      <img src={photoUrls[pidx]} alt={`Foto ${pidx + 1}`} className="w-full h-full object-cover" />
                      {photoUrls.length > 1 && (
                        <>
                          <button onClick={() => setPidx((i) => (i - 1 + photoUrls.length) % photoUrls.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                          </button>
                          <button onClick={() => setPidx((i) => (i + 1) % photoUrls.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {photoUrls.map((_: string, i: number) => (
                              <button key={i} onClick={() => setPidx(i)} className={`w-1.5 h-1.5 rounded-full transition ${i === pidx ? "bg-white" : "bg-white/50"}`} />
                            ))}
                          </div>
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 text-white text-[10px] font-semibold">{pidx + 1}/{photoUrls.length}</span>
                        </>
                      )}
                    </div>
                  );
                };
                return <NewsPhotoSlider />;
              })()}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-50 text-green-700">
                    {(({ pengumuman: "Pengumuman", pelatihan: "Pelatihan", info_bantuan: "Info Bantuan", jadwal: "Jadwal", acara: "Acara Desa", promosi: "Promosi", sistem: "Sistem", undangan: "Undangan" } as Record<string, string>)[selectedNews.category]) ?? "Info"}
                  </span>
                </div>
                <h1 className="text-base font-bold text-gray-900 leading-snug">{selectedNews.title}</h1>
                <p className="text-[10px] text-gray-400">
                  {new Date(selectedNews.sent_at ?? selectedNews.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  {" · "}{selectedNews.recipient_count} penerima
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pt-2">{selectedNews.content}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setSelectedNews(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

