"use client";
import { useState } from "react";
import Link from "next/link";
import ApexChart from "@/components/shared/ApexChart";
import {
  IconStore, IconBox, IconMoney, IconShoppingBag,
  IconCheck, IconDoc, IconTag, IconShield, IconChevronRight,
} from "@/components/shared/Icon";
import type { ApexOptions } from "apexcharts";

const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

type ChartKey = "umkm" | "pendapatan";

const CHART_DATA: Record<ChartKey, { label: string; data: number[]; color: string; unit: string }> = {
  umkm:       { label: "UMKM",       data: [12,18,22,28,35,40,48,55,62,71,80,87],                    color: "#16a34a", unit: " mitra" },
  pendapatan: { label: "Pendapatan", data: [4.2,6.1,5.8,8.4,10.2,9.7,12.1,14.3,13.8,18.2,22.5,28.4], color: "#f59e0b", unit: " Jt"    },
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
  const [activeChart, setActiveChart] = useState<ChartKey>("umkm");
  const chart = CHART_DATA[activeChart];
  const growth = (((chart.data[11] - chart.data[0]) / chart.data[0]) * 100).toFixed(0);

  const areaOptions: ApexOptions = {
    chart: { type: "area", toolbar: { show: false }, zoom: { enabled: false }, animations: { speed: 500 } },
    colors: [chart.color],
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02, stops: [0, 100] } },
    stroke: { curve: "smooth", width: 2.5 },
    markers: { size: 4, strokeWidth: 2, strokeColors: "#fff", fillOpacity: 1 },
    xaxis: {
      categories: months,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "11px", colors: "#9ca3af" } },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: "#9ca3af" },
        formatter: (v: number) => `${v}${chart.unit}`,
      },
    },
    grid: { borderColor: "#f3f4f6", strokeDashArray: 4, xaxis: { lines: { show: false } } },
    tooltip: { y: { formatter: (v: number) => `${v.toLocaleString("id-ID")}${chart.unit}` } },
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

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Tren Platform</h2>
              <p className="text-xs text-gray-400 mt-0.5">Januari – Desember 2026</p>
            </div>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
              {(Object.keys(CHART_DATA) as ChartKey[]).map(k => (
                <button
                  key={k}
                  onClick={() => setActiveChart(k)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeChart === k ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {CHART_DATA[k].label}
                </button>
              ))}
            </div>
          </div>

          <ApexChart type="area" series={[{ name: chart.label, data: chart.data }]} options={areaOptions} height={220} />

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
            <div>
              <p className="text-xs text-gray-400">Nilai Tertinggi</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{Math.max(...chart.data).toLocaleString("id-ID")}{chart.unit}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Rata-rata</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {(chart.data.reduce((a,b)=>a+b)/chart.data.length).toFixed(chart.unit === " Jt" ? 1 : 0)}{chart.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Pertumbuhan YTD</p>
              <p className="text-sm font-bold text-green-600 mt-0.5">+{growth}%</p>
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Aktivitas Terkini</h2>
          <div>
            {recentActivity.map((a, i) => (
              <div key={i} className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: a.color }} />
                <div>
                  <p className="text-xs text-gray-700 leading-snug">{a.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
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
    </div>
  );
}
