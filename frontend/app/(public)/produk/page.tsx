"use client";

import Link from "next/link";
import { useState } from "react";
import { getAllProduk, kategoriList } from "@/lib/data/dummy";

function StarIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-yellow-400" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function ProdukPage() {
  const allProduk = getAllProduk();
  const [kategori, setKategori] = useState("Semua Kategori");
  const [sort, setSort] = useState("terlaris");
  const [hargaMax, setHargaMax] = useState(500000);
  const [minRating, setMinRating] = useState(0);

  const filtered = allProduk
    .filter((p) => kategori === "Semua Kategori" || p.kategori === kategori)
    .filter((p) => p.harga <= hargaMax)
    .filter((p) => p.rating >= minRating)
    .sort((a, b) => {
      if (sort === "terlaris") return b.terjual - a.terjual;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "harga_asc") return a.harga - b.harga;
      if (sort === "harga_desc") return b.harga - a.harga;
      return 0;
    });

  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <Link href="/" className="hover:text-green-700">Beranda</Link>
            <span>/</span>
            <span className="text-gray-700">Produk UMKM</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Semua Produk UMKM</h1>
          <p className="text-sm text-gray-500 mt-1">Menampilkan {filtered.length} dari {allProduk.length} produk dari Desa Lengkong</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filter */}
          <aside className="w-full lg:w-56 shrink-0" style={{ alignSelf: "flex-start", position: "sticky", top: "88px" }}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-6">
              {/* Kategori */}
              <div>
                <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Kategori</p>
                <div className="space-y-2">
                  {kategoriList.map((k) => (
                    <label key={k} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="kategori"
                        checked={kategori === k}
                        onChange={() => setKategori(k)}
                        className="w-3.5 h-3.5 accent-green-600"
                      />
                      <span className={`text-sm ${kategori === k ? "font-semibold text-green-700" : "text-gray-600"}`}>{k}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Harga */}
              <div>
                <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Rentang Harga</p>
                <input
                  type="range"
                  min={5000}
                  max={500000}
                  step={5000}
                  value={hargaMax}
                  onChange={(e) => setHargaMax(Number(e.target.value))}
                  className="w-full accent-green-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Rp 5.000</span>
                  <span>Rp {hargaMax.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Rating */}
              <div>
                <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Rating</p>
                <div className="space-y-1.5">
                  {[4.5, 4.0, 3.5, 0].map((r) => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={minRating === r}
                        onChange={() => setMinRating(r)}
                        className="w-3.5 h-3.5 accent-green-600"
                      />
                      <span className="flex items-center gap-0.5">
                        {r > 0 ? (
                          <>
                            <span className="text-xs text-gray-600">{r}+</span>
                            <StarIcon />
                          </>
                        ) : (
                          <span className="text-xs text-gray-600">Semua</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={() => { setKategori("Semua Kategori"); setHargaMax(500000); setMinRating(0); }}
                className="w-full py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                Reset Filter
              </button>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Sort bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-2">
                {kategori !== "Semua Kategori" && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1" style={{ background: "var(--primary-muted)", color: "var(--primary)" }}>
                    {kategori}
                    <button onClick={() => setKategori("Semua Kategori")} className="ml-1 font-bold">x</button>
                  </span>
                )}
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none"
              >
                <option value="terlaris">Terlaris</option>
                <option value="rating">Rating Tertinggi</option>
                <option value="harga_asc">Harga Terendah</option>
                <option value="harga_desc">Harga Tertinggi</option>
                <option value="terbaru">Terbaru</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <p className="font-medium text-sm">Tidak ada produk yang sesuai filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((p) => (
                  <Link
                    key={p.id}
                    href={`/produk/${p.slug}`}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Foto produk */}
                    <div
                      className="aspect-square relative overflow-hidden"
                      style={{
                        backgroundImage: p.foto
                          ? `url('${p.foto}')`
                          : `linear-gradient(135deg, var(--primary-muted), #B7E4C7)`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {p.terjual > 300 && (
                        <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--accent-dark)" }}>
                          TERLARIS
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-400 truncate mb-0.5">{p.tokNama}</p>
                      <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1.5 group-hover:text-green-700 transition-colors leading-snug">
                        {p.nama}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        <StarIcon />
                        <span className="text-xs text-gray-500">{p.rating}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{p.terjual.toLocaleString("id")} terjual</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>Rp {p.harga.toLocaleString("id-ID")}</p>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-lg font-light" style={{ background: "var(--primary)" }}>+</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
              <button className="px-6 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                Muat Lebih Banyak
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}