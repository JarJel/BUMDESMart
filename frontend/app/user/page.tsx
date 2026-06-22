"use client"

import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"

export default function UserProfilePage() {
  const { user } = useAuth()

  const quickLinks = [
    { href: "/user/pesanan", label: "Pesanan Saya", sub: "3 pesanan aktif", color: "#2563eb" },
    { href: "/user/alamat", label: "Alamat Pengiriman", sub: "2 alamat tersimpan", color: "#059669" },
    { href: "/user/wishlist", label: "Wishlist", sub: "8 produk disimpan", color: "#db2777" },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: "#2563eb" }}>
            {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.name ?? "—"}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">{user?.phone || "Nomor HP belum diisi"}</p>
          </div>
          <button className="ml-auto px-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
            Edit Profil
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3">
        {quickLinks.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: q.color + "20" }}>
              <div className="w-full h-full flex items-center justify-center" style={{ color: q.color }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{q.label}</p>
              <p className="text-xs text-gray-400">{q.sub}</p>
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Goto marketplace */}
      <Link
        href="/"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold text-white"
        style={{ background: "#2563eb" }}
      >
        Lihat Produk di Marketplace
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </div>
  )
}
