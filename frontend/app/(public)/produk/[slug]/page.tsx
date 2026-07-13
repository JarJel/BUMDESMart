"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { StarIcon } from "@/components/ui/StarIcon";
import { ProductCard } from "@/components/shared/ProductCard";
import { VariantSelector } from "@/components/produk/VariantSelector";
import { QtyButtons } from "@/components/produk/QtyButtons";
import { DOKUMEN_META } from "@/lib/data/dummy";
import type { Dokumen } from "@/lib/data/dummy";
import { productApi } from "@/lib/api/product";
import { cartApi } from "@/lib/api/cart";
import { useToast } from "@/components/ui/Toast";

export default function ProdukDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [produk, setProduk] = useState<any>(null);
  const [toko, setToko] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await productApi.get(slug);
        if (res.data && res.data.success) {
          const prod = res.data.data;
          setProduk(prod);
          setToko(prod.umkm_profile);

          // Ambil produk serupa
          const relRes = await productApi.list({ category_id: prod.category_id });
          if (relRes.data && relRes.data.success) {
            setRelated(relRes.data.data.data.filter((p: any) => p.id !== prod.id).slice(0, 6));
          }
        } else {
          setError("Produk tidak ditemukan.");
        }
      } catch (err) {
        console.error(err);
        setError("Gagal memuat detail produk.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  const handleAddToCart = async (qty: number) => {
    try {
      const res = await cartApi.add(produk.id, qty, selectedVariantId);
      if (res.data && res.data.success) {
        toast.success("Produk berhasil ditambahkan ke keranjang!");
        window.dispatchEvent(new Event("cart-updated"));
      } else {
        toast.error(res.data.message || "Gagal menambahkan ke keranjang.");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.warning("Silakan masuk (login) terlebih dahulu.");
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else {
        toast.error(err.response?.data?.message || "Gagal menambahkan ke keranjang.");
      }
    }
  };

  const handleBuyNow = async (qty: number) => {
    try {
      const res = await cartApi.add(produk.id, qty, selectedVariantId);
      if (res.data && res.data.success) {
        window.dispatchEvent(new Event("cart-updated"));
        router.push("/checkout");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.warning("Silakan masuk (login) terlebih dahulu.");
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else {
        toast.error(err.response?.data?.message || "Gagal menambahkan ke keranjang.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#F4F7F5" }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !produk) return notFound();

  const IMG_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace("/api/v1", "");
  const mainImageUrl = produk.primary_image?.file_path
    ? `${IMG_BASE}${produk.primary_image.file_path}`
    : produk.images?.[0]?.file_path
      ? `${IMG_BASE}${produk.images[0].file_path}`
      : '/placeholder-product.jpg';

  const documents: Dokumen[] = [];
  if (toko?.nib) documents.push({ type: 'nib', nomor: toko.nib, tanggalTerbit: '2026-01-01', berlakuHingga: 'Permanen' });
  if (toko?.npwp) documents.push({ type: 'npwp', nomor: toko.npwp, tanggalTerbit: '2026-01-01', berlakuHingga: 'Permanen' });

  const price = Number(produk.price || 0);
  const rating = produk.rating || "4.8";
  const soldCount = produk.sold_count ?? 0;
  const activeDiscount = produk.active_discount ?? null;
  const finalPrice = activeDiscount ? activeDiscount.discounted_price : price;


  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
            <Link href="/" className="hover:text-green-700">Beranda</Link>
            <span>›</span>
            <Link href="/produk" className="hover:text-green-700">Produk</Link>
            <span>›</span>
            {toko && (
              <>
                <Link href={`/${toko.slug}`} className="hover:text-green-700 truncate max-w-[120px]">{toko.shop_name}</Link>
                <span>›</span>
              </>
            )}
            <span className="text-gray-600 truncate max-w-[120px] sm:max-w-xs">{produk.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Grid utama: foto (kiri, fixed) + info (kanan, flex-1) */}
        <div className="flex flex-row gap-3 sm:gap-6 lg:gap-8 mb-3 items-start">

          {/* Kolom foto + varian di bawahnya */}
          <div className="w-32 sm:w-52 lg:w-64 shrink-0">
            <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden mb-1.5 bg-gray-50 flex items-center justify-center">
              <img
                src={mainImageUrl}
                alt={produk.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/600x600?text=No+Image';
                }}
              />
            </div>
            {/* Thumbnail — hanya sm+ */}
            {produk.images && produk.images.length > 0 && (
              <div className="hidden sm:flex gap-1.5 mb-2">
                {produk.images.map((img: any, i: number) => (
                  <div
                    key={img.id}
                    className={`w-11 h-11 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors shrink-0 ${i === 0 ? "border-green-500" : "border-transparent hover:border-green-300"}`}
                    style={{
                      backgroundImage: `url('${IMG_BASE}${img.file_path}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                ))}
              </div>
            )}
            {/* Varian di bawah gambar — mengisi ruang kosong */}
            {produk.variants && produk.variants.length > 0 && (
              <VariantSelector variasi={produk.variants} />
            )}
          </div>

          {/* Kolom info */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--primary-muted)", color: "var(--primary)" }}>
                {produk.category?.name || "Produk"}
              </span>
              {produk.stock > 0
                ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">Tersedia</span>
                : <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">Habis</span>
              }
            </div>

            <h1 className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1.5 leading-snug">{produk.name}</h1>

            <div className="flex items-center gap-1 sm:gap-1.5 mb-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIcon key={s} size="sm" className={s <= Math.round(Number(rating)) ? "fill-yellow-400" : "fill-gray-200"} />
                ))}
              </div>
              <span className="text-xs text-gray-500">{rating}</span>
              <span className="text-gray-300 text-xs hidden sm:inline">·</span>
              <span className="text-xs text-gray-400 hidden sm:inline">{soldCount.toLocaleString("id")} terjual</span>
            </div>

            {/* Harga */}
            {activeDiscount ? (
              <div className="mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base sm:text-2xl lg:text-3xl font-bold" style={{ color: "var(--primary)" }}>
                    Rp {Number(activeDiscount.discounted_price).toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                    {activeDiscount.type === "percentage"
                      ? `-${Number(activeDiscount.value).toFixed(0)}%`
                      : `-Rp ${Number(activeDiscount.value).toLocaleString("id-ID")}`}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 line-through mt-0.5">
                  Rp {price.toLocaleString("id-ID")}
                </p>
                {activeDiscount.end_date && (
                  <p className="text-xs text-orange-500 mt-0.5">
                    ⏳ Berakhir {new Date(activeDiscount.end_date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-base sm:text-2xl lg:text-3xl font-bold mb-2" style={{ color: "var(--primary)" }}>
                Rp {price.toLocaleString("id-ID")}
              </p>
            )}

            <p className="hidden sm:block text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{produk.description}</p>

            {/* Qty + tombol */}
            <QtyButtons stok={produk.stock} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
          </div>
        </div>

        {/* Card toko — full width di bawah dua kolom */}
        {toko && (
          <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0"
              style={{
                backgroundImage: toko.logo
                  ? `url('${IMG_BASE}${toko.logo}')`
                  : toko.banner
                    ? `url('${IMG_BASE}${toko.banner}')`
                    : `linear-gradient(135deg, var(--primary-dark), var(--primary))`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{toko.shop_name}</p>
                {toko.has_halal_cert && (
                  <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 leading-none">HALAL</span>
                )}
              </div>
              <p className="text-xs text-gray-400">{toko.owner_name || "-"} · {toko.city || "Sukamaju"}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href="/chat"
                className="text-xs px-2.5 py-1.5 rounded-lg border font-medium bg-white hover:bg-gray-50 hidden sm:block cursor-pointer"
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                Pesan
              </Link>
              <Link
                href={`/${toko.slug}`}
                className="text-xs px-3 py-1.5 rounded-lg text-white font-medium cursor-pointer"
                style={{ background: "var(--primary)" }}
              >
                Kunjungi Toko
              </Link>
            </div>
          </div>
        )}

        {/* Detail — Info & Legalitas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Info produk (2/3) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100">
            {/* Tabs — scrollable pada mobile */}
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {["Informasi Produk", "Ulasan", "Info Pengiriman"].map((tab, i) => (
                <button
                  key={tab}
                  className={`shrink-0 px-3 sm:px-5 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${i === 0 ? "border-green-600 text-green-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">{produk.description}</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[
                  { label: "Asal Produk", val: toko?.city || "Desa Lengkong" },
                  { label: "Min. Pembelian", val: "1 pcs" },
                  { label: "Penjual", val: toko?.owner_name || "-" },
                  { label: "Kategori", val: produk.category?.name || "Produk" },
                ].map((row) => (
                  <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-800 leading-snug">{row.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legalitas toko (1/3) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">Legalitas Toko</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Dokumen resmi yang dimiliki {toko?.shop_name || "Toko"}.
            </p>
            {documents.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Belum ada dokumen terunggah.</p>
            ) : (
              <div className="space-y-1.5">
                {documents.map((doc) => {
                  const meta = DOKUMEN_META[doc.type];
                  if (!meta) return null;
                  return (
                    <div key={doc.type} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-100">
                      <svg className="w-3 h-3 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 leading-tight">{meta.nama}</p>
                        <p className="text-xs text-gray-400">{meta.penerbit}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {toko && (
              <div className="mt-3 pt-3 border-t border-gray-50">
                <Link href={`/${toko.slug}`} className="text-xs font-semibold cursor-pointer" style={{ color: "var(--primary)" }}>
                  Lihat profil toko →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Produk Serupa */}
        {related.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Produk Serupa</h2>
              <Link href="/produk" className="text-xs font-semibold cursor-pointer" style={{ color: "var(--primary)" }}>Lihat Semua</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
