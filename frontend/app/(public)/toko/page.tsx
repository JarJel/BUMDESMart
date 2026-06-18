"use client";
import Link from "next/link";
import { useState } from "react";
import { tokoList } from "@/lib/data/dummy";

function StarIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function SemuaTokoPage() {
  const [search, setSearch] = useState("");
  const [kategori, setKategori] = useState("Semua");
  const [sort, setSort] = useState("terpopuler");

  let filtered = [...tokoList];
  if (search) filtered = filtered.filter(t => t.nama.toLowerCase().includes(search.toLowerCase()) || t.deskripsi.toLowerCase().includes(search.toLowerCase()));
  if (kategori !== "Semua") filtered = filtered.filter(t => t.kategori === kategori);
  if (sort === "terpopuler") filtered.sort((a, b) => b.totalPenjualan - a.totalPenjualan);
  else if (sort === "rating") filtered.sort((a, b) => b.rating - a.rating);
  else if (sort === "terbaru") filtered.sort((a, b) => b.id - a.id);

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
          <p className="text-sm text-gray-500 mt-1">{tokoList.length} toko aktif di Desa Lengkong, Kec. Bojongsoang</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-52">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama toko atau produk..." className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-green-400" />
          </div>
          <select value={kategori} onChange={e => setKategori(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-600">
            <option value="Semua">Semua Kategori</option>
            <option value="Makanan & Minuman">Makanan & Minuman</option>
            <option value="Pertanian">Pertanian</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-600">
            <option value="terpopuler">Terpopuler</option>
            <option value="rating">Rating Tertinggi</option>
            <option value="terbaru">Terbaru</option>
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((toko) => (
            <Link key={toko.id} href={`/${toko.slug}`} className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-100">
              {/* Foto toko */}
              <div
                className="h-48 relative overflow-hidden"
                style={{
                  backgroundImage: toko.foto
                    ? `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url('${toko.foto}')`
                    : `linear-gradient(135deg, var(--primary-dark), var(--primary-light))`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                  <StarIcon className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs font-semibold text-white">{toko.rating}</span>
                </div>
                <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white">{toko.kategori}</div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-green-700 transition-colors">{toko.nama}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{toko.deskripsi}</p>

                {/* Legalitas badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {toko.legalitas.slice(0,3).map(l => (
                    <span key={l} className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: "var(--primary-muted)", color: "var(--primary)" }}>{l}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="truncate">{toko.lokasi.split(",")[0]}</span>
                  </div>
                  <span className="font-medium" style={{ color: "var(--primary)" }}>{toko.totalPenjualan.toLocaleString("id")} terjual</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <p className="text-sm">Toko tidak ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}