"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { useState, use, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DOKUMEN_META } from "@/lib/data/dummy";
import type { Dokumen } from "@/lib/data/dummy";
import { ProductCard } from "@/components/shared/ProductCard";
import { DokumenModal } from "@/components/shared/DokumenModal";
import { sellerApi } from "@/lib/api/seller";
import { productApi } from "@/lib/api/product";

function StarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function TokoProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [toko, setToko] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sellerRes = await sellerApi.get(slug);
        if (sellerRes.data && sellerRes.data.success) {
          const sellerData = sellerRes.data.data;
          setToko(sellerData);
          
          const productRes = await productApi.list({ umkm_id: sellerData.id });
          if (productRes.data && productRes.data.success) {
            setProducts(productRes.data.data.data || []);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data toko:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#F4F7F5" }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!toko) return notFound();

  return (
    <Suspense fallback={null}>
      <TokoContent toko={toko} products={products} />
    </Suspense>
  );
}

function TokoContent({ toko, products }: { toko: any; products: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightSlug = searchParams?.get("p") ?? null;

  const sortedProducts = highlightSlug
    ? [...products].sort((a, b) => (a.slug === highlightSlug ? -1 : b.slug === highlightSlug ? 1 : 0))
    : products;

  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [modalDoc, setModalDoc] = useState<Dokumen | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const starsArr = [1, 2, 3, 4, 5];

  // Cek login dari cookie saat mount (client-side)
  useEffect(() => {
    const hasCookie = document.cookie.split(";").some(c => c.trim().startsWith("bumdesmart-role="));
    setIsLoggedIn(hasCookie);
  }, []);

  const handleDocClick = useCallback((type: string) => {
    if (!isLoggedIn) { setShowLoginAlert(true); return; }
    setOpenDoc(prev => prev === type ? null : type);
  }, [isLoggedIn]);

  const handleLihatDokumen = useCallback((doc: Dokumen) => {
    if (!isLoggedIn) { setShowLoginAlert(true); return; }
    setModalDoc(doc);
  }, [isLoggedIn]);

  const shopName = toko.shop_name || toko.nama || "Nama Toko";
  const desc = toko.description || toko.deskripsi || "Deskripsi toko";
  const owner = toko.owner_name || toko.pemilik || "-";
  const city = toko.city || "";
  const province = toko.province || "";
  const location = city && province ? `${city}, ${province}` : (toko.lokasi || "Jawa Barat");
  const banner = toko.banner || toko.foto || "";
  const rating = toko.rating || "4.8";
  const totalPenjualan = toko.totalPenjualan ?? 120;
  
  const documents: Dokumen[] = [];
  if (toko.nib) documents.push({ type: 'nib', nomor: toko.nib, tanggalTerbit: '2026-01-01', berlakuHingga: 'Permanen' });
  if (toko.npwp) documents.push({ type: 'npwp', nomor: toko.npwp, tanggalTerbit: '2026-01-01', berlakuHingga: 'Permanen' });
  if (documents.length === 0 && toko.dokumen) {
    documents.push(...toko.dokumen);
  }

  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh" }}>
      {modalDoc && <DokumenModal doc={modalDoc} onClose={() => setModalDoc(null)} />}

      {/* Alert login */}
      {showLoginAlert && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowLoginAlert(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Login Dulu, Yuk!</h3>
            <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
              Detail dokumen legalitas toko hanya bisa dilihat oleh pembeli yang sudah masuk akun.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowLoginAlert(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50">
                Nanti Saja
              </button>
              <button
                onClick={() => { setShowLoginAlert(false); router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--primary)" }}
              >
                Masuk Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Banner */}
      <div className="relative overflow-hidden bg-gray-50 flex items-center justify-center" style={{ height: "clamp(160px, 25vw, 320px)" }}>
        <img
          src={banner.startsWith('http') || banner.startsWith('/') ? banner : (banner ? `http://localhost:8000${banner}` : 'https://placehold.co/1200x400?text=No+Banner')}
          alt={shopName}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://placehold.co/1200x400?text=No+Banner';
          }}
        />

        {/* Breadcrumb */}
        <div className="absolute top-4 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center gap-1.5 text-xs text-white/70">
            <Link href="/" className="hover:text-white">Beranda</Link>
            <span>/</span>
            <Link href="/toko" className="hover:text-white">Semua Toko</Link>
            <span>/</span>
            <span className="text-white">{shopName}</span>
          </div>
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-12 pb-5 px-4 z-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 flex items-end gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-white/30 overflow-hidden shrink-0 flex items-center justify-center bg-gray-100">
              <img
                src={toko.logo ? (toko.logo.startsWith('http') ? toko.logo : `http://localhost:8000${toko.logo}`) : 'https://placehold.co/150x150?text=Shop'}
                alt={shopName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/150x150?text=Shop';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight truncate">{shopName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className="flex items-center gap-0.5">
                  {starsArr.map(s => <StarIcon key={s} className={`w-3 h-3 ${s <= Math.round(Number(rating)) ? "text-yellow-400" : "text-white/30"}`} />)}
                  <span className="text-white/80 text-xs ml-1">{rating}</span>
                </div>
                <span className="text-white/40 text-xs">·</span>
                <span className="text-white/70 text-xs">{totalPenjualan.toLocaleString("id")} terjual</span>
                <span className="text-white/40 text-xs">·</span>
                <span className="text-white/70 text-xs">{products.length} produk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0 space-y-4">
            {/* Info toko */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Info Toko</h2>
              {[
                { icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "Pemilik", val: owner },
                { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z", label: "Lokasi", val: location },
                { icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z", label: "Kategori", val: toko.kategori || "Makanan & Kerajinan" },
              ].map((row) => (
                <div key={row.label} className="flex gap-2.5">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={row.icon} />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400">{row.label}</p>
                    <p className="text-xs text-gray-700 font-medium leading-snug">{row.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dokumen Legalitas */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Legalitas Terverifikasi</h2>
              {!isLoggedIn && (
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <svg className="w-3 h-3 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-amber-600">Login untuk melihat detail dokumen</p>
                </div>
              )}
              <div className="space-y-2">
                {documents.map((doc) => {
                  const meta = DOKUMEN_META[doc.type];
                  if (!meta) return null;
                  const isOpen = openDoc === doc.type;
                  return (
                    <div key={doc.type} className={`border rounded-xl overflow-hidden ${!isLoggedIn ? "border-gray-100 opacity-80" : "border-gray-100"}`}>
                      <button
                        onClick={() => handleDocClick(doc.type)}
                        className="w-full flex items-center gap-2.5 p-2.5 hover:bg-gray-50 text-left"
                      >
                        <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800">{meta.nama}</p>
                          <p className="text-xs text-gray-400">{meta.kategori}</p>
                        </div>
                        {isLoggedIn ? (
                          <svg className={`w-3 h-3 text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-2.5 pb-2.5 space-y-1.5 border-t border-gray-50 pt-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">No. Dokumen</span>
                            <span className="font-mono text-gray-700 text-right">{doc.nomor}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Terbit</span>
                            <span className="text-gray-700">{doc.tanggalTerbit}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Berlaku</span>
                            <span className="text-gray-700">{doc.berlakuHingga ?? "Permanen"}</span>
                          </div>
                          {doc.cakupan && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Cakupan</span>
                              <span className="text-gray-700 text-right max-w-[130px]">{doc.cakupan}</span>
                            </div>
                          )}
                          <p className="text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1 mt-1">{meta.efek}</p>
                          <button
                            onClick={() => handleLihatDokumen(doc)}
                            className="w-full mt-1 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                            style={{ background: "var(--primary)" }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-4-8a9.953 9.953 0 014 0M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Lihat Dokumen
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tentang */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tentang Toko</h2>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>

            <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
              Kirim Pesan ke Toko
            </button>
          </aside>

          {/* Produk grid */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Produk dari {shopName}</h2>
              <span className="text-xs text-gray-400">{products.length} produk</span>
            </div>

            {highlightSlug && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-green-50 border border-green-100">
                <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs text-green-700">Produk yang kamu pilih ditampilkan paling atas</p>
              </div>
            )}

            {sortedProducts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-400 text-sm">Belum ada produk terdaftar di toko ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sortedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={{ ...p, tokoSlug: toko.slug, tokNama: shopName, tokoPemilik: owner }}
                    compact
                    highlighted={!!highlightSlug && p.slug === highlightSlug}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
