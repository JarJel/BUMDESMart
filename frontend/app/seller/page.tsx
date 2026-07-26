"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSellerProfile } from "@/lib/context/sellerProfile";
import { ProductData } from "@/lib/api/product";
import api from "@/lib/api/axios";

interface DiscountData {
  id: number;
  product_id: number;
  product?: { id: number; name: string; stock: number; price: number; primary_image?: { file_path: string } };
  discount_type: "percentage" | "fixed";
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function SellerSummaryPage() {
  const profile = useSellerProfile();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [todayOrders, setTodayOrders] = useState<number>(0);
  const [activeDiscounts, setActiveDiscounts] = useState<DiscountData[]>([]);

  const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace("/api/v1", "");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);

  useEffect(() => {
    api.get<{ data: { data: ProductData[] } }>("/seller/products")
      .then(res => setProducts(res.data.data?.data ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));

    api.get("/my/berita")
      .then(res => setAnnouncements(res.data.data?.data ?? []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoadingAnnouncements(false));

    const today = new Date().toISOString().split("T")[0];
    api.get(`/seller/orders?per_page=100&status=pending&date=${today}`)
      .then(res => {
        const orders = res.data.data?.data ?? [];
        const newToday = orders.filter((o: any) => o.created_at?.startsWith(today)).length;
        setTodayOrders(newToday > 0 ? newToday : orders.length);
      })
      .catch(() => setTodayOrders(0));

    api.get("/seller/discounts")
      .then(res => {
        const all: DiscountData[] = res.data.data?.data ?? res.data.data ?? [];
        const now = new Date();
        const active = all.filter(d => d.is_active && new Date(d.end_date) >= now);
        setActiveDiscounts(active);
      })
      .catch(() => setActiveDiscounts([]));
  }, []);

  const activeProducts = products.filter(p => p.status === "active").length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter(p => p.stock === 0 && p.status === "active").length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 18) return "Selamat sore";
    return "Selamat malam";
  };

  const discountedPrice = (d: DiscountData) => {
    const base = Number(d.product?.price ?? 0);
    if (d.discount_type === "percentage") return base - (base * d.discount_value) / 100;
    return base - d.discount_value;
  };

  return (
    <div className="p-6 space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {greeting()}, {profile?.owner_name ?? "Seller"}!
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {profile?.shop_name ? `Toko: ${profile.shop_name}` : "Selamat datang di dashboard penjual"}
        </p>
      </div>

      {/* Ringkasan Hari Ini */}
      {!loadingProducts && (todayOrders > 0 || lowStock > 0 || outOfStock > 0) && (
        <div className="rounded-2xl px-5 py-4 flex items-start gap-3" style={{ background: "var(--primary-muted)" }}>
          <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm" style={{ color: "var(--primary-dark)" }}>
            <p className="font-semibold mb-1">Ringkasan hari ini</p>
            <ul className="text-xs space-y-0.5 text-gray-600">
              {todayOrders > 0 && <li>Ada <strong>{todayOrders} pesanan</strong> yang perlu diproses</li>}
              {lowStock > 0 && <li><strong>{lowStock} produk</strong> stoknya mau habis (sisa ≤ 5)</li>}
              {outOfStock > 0 && <li><strong>{outOfStock} produk</strong> stoknya sudah habis</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Warning stok habis — banner merah */}
      {!loadingProducts && outOfStock > 0 && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">{outOfStock} produk stok habis!</p>
            <p className="text-xs text-red-500 mt-0.5">Segera isi ulang agar pembeli bisa memesan.</p>
          </div>
          <Link href="/seller/produk" className="text-xs font-semibold text-red-600 hover:text-red-800 shrink-0 underline">
            Cek produk
          </Link>
        </div>
      )}

      {/* Warning stok hampir habis */}
      {!loadingProducts && lowStock > 0 && (
        <div className="rounded-2xl bg-yellow-50 border border-yellow-200 px-5 py-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-700">Stok hampir habis: {lowStockProducts.slice(0, 3).map(p => p.name).join(", ")}{lowStockProducts.length > 3 ? ` dan ${lowStockProducts.length - 3} lainnya` : ""}</p>
            <p className="text-xs text-yellow-600 mt-0.5">Sisa stok ≤ 5 unit. Segera tambah sebelum kehabisan.</p>
          </div>
          <Link href="/seller/produk" className="text-xs font-semibold text-yellow-700 hover:text-yellow-900 shrink-0 underline">
            Cek produk
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Produk",
            value: loadingProducts ? "..." : products.length.toString(),
            sub: `${activeProducts} aktif`,
            color: false,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            ),
          },
          {
            label: "Stok Hampir Habis",
            value: loadingProducts ? "..." : lowStock.toString(),
            sub: "sisa ≤ 5 unit",
            color: lowStock > 0 ? "yellow" : false,
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
            color: outOfStock > 0 ? "red" : false,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ),
          },
          {
            label: "Status Akun",
            value: profile?.status === "active" ? "Aktif" : profile?.status === "rejected" ? "Ditolak" : "Menunggu",
            sub: profile?.status === "active" ? "Sudah diverifikasi BUMDes" : "Belum diverifikasi",
            color: false,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ),
          },
        ].map(card => {
          const bgIcon = card.color === "red" ? "bg-red-50" : card.color === "yellow" ? "bg-yellow-50" : "";
          const fgIcon = card.color === "red" ? "text-red-500" : card.color === "yellow" ? "text-yellow-600" : "";
          const valueFg = card.color === "red" ? "text-red-600" : card.color === "yellow" ? "text-yellow-600" : "text-gray-900";
          return (
            <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">{card.label}</p>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bgIcon || ""}`}
                  style={!card.color ? { background: "var(--primary-muted)", color: "var(--primary)" } : { color: fgIcon.replace("text-", "") }}>
                  <span className={card.color ? fgIcon : ""}>{card.icon}</span>
                </div>
              </div>
              <p className={`text-xl font-bold ${valueFg}`}>{card.value}</p>
              <p className="text-xs mt-1 text-gray-400">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Promo Aktif Hari Ini */}
      {activeDiscounts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-base">🏷️</span>
              <h2 className="text-sm font-semibold text-gray-900">Diskon Aktif Hari Ini</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700">{activeDiscounts.length} produk</span>
            </div>
            <Link href="/seller/diskon" className="text-xs font-medium" style={{ color: "var(--primary)" }}>
              Kelola diskon
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {activeDiscounts.slice(0, 4).map((d) => {
              const prodName = d.product?.name ?? `Produk #${d.product_id}`;
              const basePrice = Number(d.product?.price ?? 0);
              const finalPrice = discountedPrice(d);
              const stock = d.product?.stock ?? 0;
              const imgPath = d.product?.primary_image?.file_path;
              const imgUrl = imgPath ? (imgPath.startsWith("http") ? imgPath : `http://localhost:8000/${imgPath}`) : null;
              const endDate = new Date(d.end_date);
              const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / 86400000);
              return (
                <div key={d.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                    {imgUrl ? (
                      <img src={imgUrl} alt={prodName} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-1">{prodName}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400 line-through">Rp {basePrice.toLocaleString("id")}</span>
                      <span className="text-xs font-bold text-green-600">Rp {finalPrice.toLocaleString("id")}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-600">
                        {d.discount_type === "percentage" ? `−${d.discount_value}%` : `−Rp ${Number(d.discount_value).toLocaleString("id")}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-semibold ${stock === 0 ? "text-red-500" : stock <= 5 ? "text-yellow-600" : "text-gray-600"}`}>
                      Stok: {stock}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{daysLeft <= 1 ? "Berakhir hari ini!" : `${daysLeft} hari lagi`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                          <div className="min-w-0">
                            <span className="font-medium text-gray-900 line-clamp-1">{p.name}</span>
                            {p.stock <= 5 && p.stock > 0 && (
                              <p className="text-[10px] text-yellow-600 font-medium">Stok menipis!</p>
                            )}
                            {p.stock === 0 && (
                              <p className="text-[10px] text-red-500 font-medium">Stok habis</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">
                        Rp {Number(p.price).toLocaleString("id")}
                      </td>
                      <td className="px-5 py-3 text-right hidden md:table-cell">
                        <span className={p.stock === 0 ? "text-red-500 font-semibold" : p.stock <= 5 ? "text-yellow-600 font-semibold" : "text-gray-600"}>{p.stock}</span>
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

      {/* Pengumuman dari BUMDes */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-gray-900">Pengumuman dari BUMDes</h2>
          </div>
        </div>
        {loadingAnnouncements ? (
          <div className="text-center py-10 text-sm text-gray-400">Memuat pengumuman...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-400">
            Belum ada pengumuman dari BUMDes Anda.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {announcements.slice(0, 5).map((ann) => {
              const firstPhoto = ann.photos?.[0];
              const photoUrl = firstPhoto
                ? (firstPhoto.startsWith("http") ? firstPhoto : `${BASE_URL}${firstPhoto}`)
                : null;
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
                  key={ann.id}
                  onClick={() => setSelectedAnnouncement(ann)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/70 transition-colors cursor-pointer"
                >
                  <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                    {photoUrl ? (
                      <img src={photoUrl} alt={ann.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${catColors[ann.category] ?? "bg-gray-100 text-gray-600"}`}>
                        {catLabels[ann.category] ?? "Info"}
                      </span>
                      {ann.photos && ann.photos.length > 1 && (
                        <span className="text-[9px] text-gray-400">📷 {ann.photos.length} foto</span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-900 line-clamp-1">{ann.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(ann.sent_at ?? ann.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })}
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
        <Link href="/seller/pesanan" className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--primary-muted)" }}>
            <svg className="w-5 h-5" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">Lihat Pesanan</p>
            <p className="text-xs text-gray-400 mt-0.5">Proses dan pantau pesanan masuk</p>
          </div>
        </Link>
      </div>

      {/* Modal Detail Pengumuman */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 pr-4">Detail Berita</h2>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition shrink-0"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {selectedAnnouncement.photos && selectedAnnouncement.photos.length > 0 && (() => {
                const AnnPhotoSlider = () => {
                  const [pidx, setPidx] = useState(0);
                  const photoUrls = (selectedAnnouncement.photos as string[]).map((p) =>
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
                            {photoUrls.map((_, i) => (
                              <button key={i} onClick={() => setPidx(i)} className={`w-1.5 h-1.5 rounded-full transition ${i === pidx ? "bg-white" : "bg-white/50"}`} />
                            ))}
                          </div>
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 text-white text-[10px] font-semibold">{pidx + 1}/{photoUrls.length}</span>
                        </>
                      )}
                    </div>
                  );
                };
                return <AnnPhotoSlider />;
              })()}
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-snug mb-1">{selectedAnnouncement.title}</h1>
                <p className="text-[10px] text-gray-400 mb-3">
                  {new Date(selectedAnnouncement.sent_at ?? selectedAnnouncement.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  {selectedAnnouncement.bumdes_profile && ` · ${selectedAnnouncement.bumdes_profile.name}`}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedAnnouncement.content}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
