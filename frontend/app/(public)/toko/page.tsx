"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { sellerApi, SellerData } from "@/lib/api/seller";

function StarIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function SemuaTokoPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("terbaru");
  const [tokoList, setTokoList] = useState<SellerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerApi.list().then(res => {
      const d = res.data.data as any;
      setTokoList(Array.isArray(d) ? d : (d?.data ?? []));
    }).catch(() => setTokoList([])).finally(() => setLoading(false));
  }, []);

  let filtered = [...tokoList];
  if (search) filtered = filtered.filter(t =>
    t.shop_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  );
  if (sort === "terbaru") filtered.sort((a, b) => b.id - a.id);
  else if (sort === "terlama") filtered.sort((a, b) => a.id - b.id);

  const getBannerUrl = (banner: string | null) => {
    if (!banner) return "";
    if (banner.startsWith("http") || banner.startsWith("/")) return banner;
    return `http://localhost:8000/${banner}`;
  };

  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh" }}>
      {/* Hero kecil */}
      <div className="bg-white border-b border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <Link href="/" className="hover:text-green-700">Beranda</Link>
            <span>/</span>
            <span className="text-gray-700">Semua Toko</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Semua Toko UMKM</h1>
          <p className="text-sm text-gray-500 mt-1">{tokoList.length} toko aktif</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-52">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama toko..." className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-400" />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-600">
            <option value="terbaru">Terbaru</option>
            <option value="terlama">Terlama</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Memuat toko...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((toko) => {
                const bannerUrl = getBannerUrl(toko.banner);
                const logoUrl = toko.logo
                  ? (toko.logo.startsWith("http") || toko.logo.startsWith("/") ? toko.logo : `http://localhost:8000/${toko.logo}`)
                  : null;
                const initials = toko.shop_name ? toko.shop_name.slice(0, 2).toUpperCase() : "TK";

                return (
                  <Link key={toko.id} href={`/${toko.slug}`} className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-100 flex flex-col">
                    {/* Banner Section */}
                    <div className="h-32 relative overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                      {bannerUrl ? (
                        <img src={bannerUrl} alt={toko.shop_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" onError={e => { e.currentTarget.style.display = "none"; }} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-[var(--primary)] via-[var(--primary)] to-[var(--primary-light)] group-hover:scale-105 transition-transform duration-200" />
                      )}
                      
                      <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
                        <StarIcon className="w-3 h-3 text-yellow-400" />
                        <span className="text-[10px] font-semibold text-white">5.0</span>
                      </div>
                    </div>

                    {/* Logo & Content Section */}
                    <div className="px-4 pb-4 pt-10 relative flex-1 flex flex-col">
                      {/* Overlapping Logo */}
                      <div className="absolute -top-8 left-4 w-16 h-16 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white flex items-center justify-center">
                        {logoUrl ? (
                          <img src={logoUrl} alt={toko.shop_name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
                        ) : (
                          <div className="w-full h-full bg-green-50 flex items-center justify-center text-green-700 font-bold text-lg">
                            {initials}
                          </div>
                        )}
                      </div>

                      <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-green-700 transition-colors truncate">{toko.shop_name}</h3>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-1">{toko.description || "Toko UMKM BUMDESMart"}</p>

                      <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50 mt-auto">
                        <div className="flex items-center gap-1 min-w-0">
                          <svg className="w-3 h-3 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span className="truncate">{toko.city || "Indonesia"}</span>
                        </div>
                        <span className="font-semibold truncate shrink-0 max-w-[100px]" style={{ color: "var(--primary)" }}>{toko.owner_name}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <p className="text-sm">Toko tidak ditemukan</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
