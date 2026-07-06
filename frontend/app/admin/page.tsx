"use client";
import React, { useState } from "react";
import Link from "next/link";
import ApexChart from "@/components/shared/ApexChart";
import {
  IconUsers, IconStore, IconBox, IconMoney, IconHome,
  IconPeople, IconTag, IconChart, IconChevronRight,
} from "@/components/shared/Icon";
import type { ApexOptions } from "apexcharts";

const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

type ChartKey = "pengguna" | "pesanan" | "pendapatan";

const CHART_DATA: Record<ChartKey, { label: string; data: number[]; color: string; unit: string }> = {
  pengguna:   { label: "Pengguna",   data: [890,950,1010,1080,1120,1160,1200,1248,1248,1248,1248,1248], color: "#6366f1", unit: "" },
  pesanan:    { label: "Pesanan",    data: [280,340,390,420,460,500,550,610,660,720,790,870],            color: "#0ea5e9", unit: "" },
  pendapatan: { label: "Pendapatan", data: [5.2,6.1,7.4,8.0,8.8,9.5,10.2,10.9,11.4,12.0,12.4,12.4],   color: "#16a34a", unit: " Jt" },
};

const recentUsers = [
  { name: "Siti Rahayu",     email: "siti@gmail.com",     role: "customer", status: "active",  join: "2 jam lalu"  },
  { name: "Bakso Mang Udin", email: "mangudin@gmail.com", role: "umkm",     status: "pending", join: "5 jam lalu"  },
  { name: "Rina Kartika",    email: "rina@gmail.com",     role: "customer", status: "active",  join: "1 hari lalu" },
  { name: "Keripik Bu Asih", email: "buasih@gmail.com",   role: "umkm",     status: "active",  join: "2 hari lalu" },
];

const roleBadge: Record<string, string> = {
  customer:    "bg-blue-50 text-blue-600",
  umkm:        "bg-green-50 text-green-700",
  admin_bumdes:"bg-purple-50 text-purple-600",
  pengirim:    "bg-orange-50 text-orange-600",
};
const statusBadge: Record<string, string> = {
  active:   "bg-green-50 text-green-700",
  pending:  "bg-yellow-50 text-yellow-700",
  suspended:"bg-red-50 text-red-600",
};

const donutOptions: ApexOptions = {
  chart: { type: "donut", animations: { speed: 400 } },
  colors: ["#6366f1", "#16a34a", "#f59e0b", "#f97316"],
  labels: ["Customer", "UMKM / Seller", "Admin BUMDes", "Pengirim"],
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: "65%",
        labels: {
          show: true,
          total: {
            show: true,
            label: "Pengguna",
            fontSize: "11px",
            color: "#6b7280",
            formatter: () => "1.248",
          },
        },
      },
    },
  },
  tooltip: { y: { formatter: (v: number) => `${v}%` } },
  stroke: { width: 2 },
};

export default function AdminDashboard() {
  const [activeChart, setActiveChart] = useState<ChartKey>("pengguna");
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
    { label: "Total Pengguna",      value: "1.248",      sub: "+34 bulan ini",         Icon: IconPeople, bg: "bg-indigo-50", fg: "text-indigo-500" },
    { label: "UMKM Aktif",          value: "87",         sub: "5 menunggu verifikasi",  Icon: IconStore,  bg: "bg-green-50",  fg: "text-green-600"  },
    { label: "Total Pesanan",       value: "4.612",      sub: "+12% vs bulan lalu",    Icon: IconBox,    bg: "bg-sky-50",    fg: "text-sky-500"    },
    { label: "Pendapatan Platform", value: "Rp 12,4 Jt", sub: "+8% vs bulan lalu",    Icon: IconMoney,  bg: "bg-yellow-50", fg: "text-yellow-500" },
  ];

  const quickLinks = [
    { href:"/admin/bumdes",   label:"Kelola BUMDes",    desc:"Tambah & verifikasi BUMDes", Icon: IconHome  },
    { href:"/admin/pengguna", label:"Kelola Pengguna",  desc:"Suspend, ubah role, reset",  Icon: IconUsers },
    { href:"/admin/kategori", label:"Kategori Produk",  desc:"Tambah & ubah kategori",     Icon: IconTag   },
    { href:"/admin/laporan",  label:"Laporan Platform", desc:"Unduh laporan lengkap",      Icon: IconChart },
  ];

  const donutLegend = [
    { label: "Customer",      pct: "62%", color: "bg-indigo-500" },
    { label: "UMKM / Seller", pct: "24%", color: "bg-green-600"  },
    { label: "Admin BUMDes",  pct: "8%",  color: "bg-yellow-400" },
    { label: "Pengirim",      pct: "6%",  color: "bg-orange-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard Super Admin</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pantau seluruh aktivitas platform BUMDESmart</p>
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

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Pertumbuhan Platform</h2>
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
              {(chart.data.reduce((a, b) => a + b) / chart.data.length).toFixed(chart.unit ? 1 : 0)}{chart.unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Pertumbuhan YTD</p>
            <p className="text-sm font-bold text-green-600 mt-0.5">+{growth}%</p>
          </div>
        </div>
      </div>

      {/* Donut + Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Distribusi Pengguna</h2>
          <ApexChart type="donut" series={[62, 24, 8, 6]} options={donutOptions} height={200} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-1">
            {donutLegend.map(s => (
              <div key={s.label} className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full shrink-0 ${s.color}`} />
                <span className="text-gray-500 truncate">{s.label}</span>
                <span className="font-semibold text-gray-900 ml-auto">{s.pct}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Manajemen Cepat</h2>
          <div className="space-y-1">
            {quickLinks.map(({ href, label, desc, Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 group-hover:text-indigo-600">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <IconChevronRight size={14} className="text-gray-300 ml-auto shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent users */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Pengguna Terbaru</h2>
          <Link href="/admin/pengguna" className="text-xs font-medium text-indigo-600">Lihat semua</Link>
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
              {recentUsers.map(u => (
                <tr key={u.email} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${roleBadge[u.role] ?? "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${statusBadge[u.status] ?? "bg-gray-100 text-gray-500"}`}>{u.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-400">{u.join}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
