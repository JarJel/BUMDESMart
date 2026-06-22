"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getAllProduk, kategoriList } from "@/lib/data/dummy";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ProductCard } from "@/components/shared/ProductCard";
import { FilterContent } from "@/components/produk/FilterContent";

const DEFAULT_FILTER = {
  kategori: "Semua Kategori",
  hargaMax: 500000,
  minRating: 0,
};

function ProdukContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";
  const allProduk = getAllProduk();

  const [kategori, setKategori] = useState(DEFAULT_FILTER.kategori);
  const [sort, setSort] = useState("terlaris");
  const [hargaMax, setHargaMax] = useState(DEFAULT_FILTER.hargaMax);
  const [minRating, setMinRating] = useState(DEFAULT_FILTER.minRating);
  const [showFilter, setShowFilter] = useState(false);

  // Sync category param from URL with filter state
  useEffect(() => {
    const catParam = searchParams?.get("kategori");
    if (catParam) {
      const matched = kategoriList.find(
        (k) =>
          k.toLowerCase() === catParam.toLowerCase() ||
          k.toLowerCase().includes(catParam.toLowerCase())
      );
      if (matched) {
        setKategori(matched);
      }
    } else {
      setKategori(DEFAULT_FILTER.kategori);
    }
  }, [searchParams]);

  const resetFilter = () => {
    setKategori(DEFAULT_FILTER.kategori);
    setHargaMax(DEFAULT_FILTER.hargaMax);
    setMinRating(DEFAULT_FILTER.minRating);
  };

  const filtered = allProduk
    .filter((p) => kategori === "Semua Kategori" || p.kategori === kategori)
    .filter((p) => {
      if (!query) return true;
      const lowerQuery = query.toLowerCase();
      return (
        p.nama.toLowerCase().includes(lowerQuery) ||
        p.deskripsi.toLowerCase().includes(lowerQuery) ||
        p.tokNama.toLowerCase().includes(lowerQuery)
      );
    })
    .filter((p) => p.harga <= hargaMax)
    .filter((p) => p.rating >= minRating)
    .sort((a, b) => {
      if (sort === "terlaris") return b.terjual - a.terjual;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "harga_asc") return a.harga - b.harga;
      if (sort === "harga_desc") return b.harga - a.harga;
      return 0;
    });

  const activeFilterCount =
    (kategori !== DEFAULT_FILTER.kategori ? 1 : 0) +
    (hargaMax !== DEFAULT_FILTER.hargaMax ? 1 : 0) +
    (minRating !== DEFAULT_FILTER.minRating ? 1 : 0);

  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filter — Desktop only */}
          <aside
            className="hidden lg:block w-56 shrink-0"
            style={{ alignSelf: "flex-start", position: "sticky", top: "88px" }}
          >
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <FilterContent
                kategori={kategori}
                onKategoriChange={setKategori}
                hargaMax={hargaMax}
                onHargaChange={setHargaMax}
                minRating={minRating}
                onRatingChange={setMinRating}
                onReset={resetFilter}
              />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                {query && (
                  <span className="text-xs text-gray-500">
                    Hasil untuk <span className="font-semibold text-gray-800">"{query}"</span> · {filtered.length} produk
                  </span>
                )}
                {/* Mobile filter button */}
                <button
                  onClick={() => setShowFilter(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {kategori !== "Semua Kategori" && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
                    style={{ background: "var(--primary-muted)", color: "var(--primary)" }}
                  >
                    {kategori}
                    <button onClick={() => setKategori("Semua Kategori")} className="ml-1 font-bold">
                      x
                    </button>
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
                <svg
                  className="w-12 h-12 mx-auto mb-3 opacity-30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="font-medium text-sm">Tidak ada produk yang sesuai pencarian atau filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} compact />
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
              <Button variant="secondary" size="lg">
                Muat Lebih Banyak
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <BottomSheet
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter"
        footer={
          <Button onClick={() => setShowFilter(false)} className="w-full">
            Terapkan ({filtered.length})
          </Button>
        }
      >
        <FilterContent
          kategori={kategori}
          onKategoriChange={setKategori}
          hargaMax={hargaMax}
          onHargaChange={setHargaMax}
          minRating={minRating}
          onRatingChange={setMinRating}
          onReset={resetFilter}
        />
      </BottomSheet>
    </div>
  );
}

export default function ProdukPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">Memuat produk...</div>}>
      <ProdukContent />
    </Suspense>
  );
}
