"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSellerProfile } from "@/lib/context/sellerProfile";
import { ProductData } from "@/lib/api/product";
import api from "@/lib/api/axios";

export default function SellerSummaryPage() {
  const profile = useSellerProfile();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    api.get<{ data: { data: ProductData[] } }>("/seller/products")
      .then(res => setProducts(res.data.data?.data ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }, []);

  const activeProducts = products.filter(p => p.status === "active").length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter(p => p.stock === 0 && p.status === "active").length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 18) return "Selamat sore";
    return "Selamat malam";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {greeting()}, {profile?.owner_name ?? "Seller"}!
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {profile?.shop_name ? `Toko: ${profile.shop_name}` : "Selamat datang di dashboard seller"}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Produk",
            value: loadingProducts ? "..." : products.length.toString(),
            sub: `${activeProducts} aktif`,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            ),
          },
          {
            label: "Stok Hampir Habis",
            value: loadingProducts ? "..." : lowStock.toString(),
            sub: "≤ 5 unit",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ),
          },
          {
            label: "Stok Habis",
            value: loadingProducts ? "..." : outOfStock.toString(),
            sub: "produk aktif",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ),
          },
          {
            label: "Status Akun",
            value: profile?.status === "active" ? "Aktif" : profile?.status === "rejected" ? "Ditolak" : "Pending",
            sub: profile?.status === "active" ? "Terverifikasi BUMDes" : "Belum diverifikasi",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ),
          },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{card.label}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--primary-muted)", color: "var(--primary)" }}>
                {card.icon}
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs mt-1 text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Daftar Produk Terbaru */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Produk Terbaru</h2>
          <Link href="/seller/produk" className="text-xs font-medium" style={{ color: "var(--primary)" }}>
            Lihat semua
          </Link>
        </div>
        {loadingProducts ? (
          <div className="text-center py-12 text-sm text-gray-400">Memuat produk...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-gray-400">Belum ada produk.</p>
            <Link href="/seller/produk/tambah" className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl text-white" style={{ background: "var(--primary)" }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Tambah Produk Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-50">
                  <th className="text-left px-5 py-3 font-medium">Produk</th>
                  <th className="text-right px-5 py-3 font-medium">Harga</th>
                  <th className="text-right px-5 py-3 font-medium hidden md:table-cell">Stok</th>
                  <th className="text-center px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map(p => {
                  const imgPath = p.primary_image?.file_path ?? p.images?.[0]?.file_path;
                  const imgUrl = imgPath ? (imgPath.startsWith("http") ? imgPath : `http://localhost:8000/${imgPath}`) : null;
                  const statusLabel = { active: "Aktif", inactive: "Arsip", draft: "Draft" }[p.status] ?? p.status;
                  const badgeClass = { active: "bg-green-50 text-green-700", inactive: "bg-gray-100 text-gray-500", draft: "bg-yellow-50 text-yellow-700" }[p.status] ?? "bg-gray-100 text-gray-500";
                  return (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                            {imgUrl ? (
                              <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            )}
                          </div>
                          <span className="font-medium text-gray-900 line-clamp-1">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">
                        Rp {Number(p.price).toLocaleString("id")}
                      </td>
                      <td className="px-5 py-3 text-right hidden md:table-cell">
                        <span className={p.stock === 0 ? "text-red-500 font-medium" : "text-gray-600"}>{p.stock}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>{statusLabel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/seller/produk/tambah" className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--primary-muted)" }}>
            <svg className="w-5 h-5" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Tambah Produk Baru</p>
            <p className="text-xs text-gray-400 mt-0.5">Upload produk dan mulai berjualan</p>
          </div>
        </Link>
        <Link href="/seller/pengaturan" className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--primary-muted)" }}>
            <svg className="w-5 h-5" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Lengkapi Profil Toko</p>
            <p className="text-xs text-gray-400 mt-0.5">Nama, deskripsi, dan info kontak</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
