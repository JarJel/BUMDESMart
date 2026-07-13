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

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

// ─── Tipe CartItem lokal untuk toko ini ───────────────────────────────────────
interface LocalCartItem {
  cartItemId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

// ─── Sticky Bar GoFood ────────────────────────────────────────────────────────
function StickyCartBar({ items, shopName, onViewCart }: {
  items: LocalCartItem[];
  shopName: string;
  onViewCart: () => void;
}) {
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto max-w-2xl px-4 pb-4 sm:pb-6">
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl border border-white/20"
          style={{ background: "var(--primary)" }}
        >
          {/* Badge qty */}
          <div className="flex-shrink-0 w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">{totalQty}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-none truncate">{shopName}</p>
            <p className="text-white/70 text-xs mt-0.5">{formatRupiah(totalPrice)}</p>
          </div>

          {/* Tombol */}
          <button
            onClick={onViewCart}
            className="flex-shrink-0 flex items-center gap-1.5 bg-white text-sm font-bold px-4 py-2 rounded-xl cursor-pointer border-0 transition-all hover:opacity-90 active:scale-95"
            style={{ color: "var(--primary)" }}
          >
            Lihat Pesanan
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

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
  
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  const [pendingQty, setPendingQty] = useState<number>(1);
  const [cartItems, setCartItems] = useState<LocalCartItem[]>([]);

  const syncCart = async (umkmId: number) => {
    try {
      const res = await cartApi.get();
      if (res.data?.success && res.data?.data?.items) {
        const tokoItems: LocalCartItem[] = res.data.data.items
          .filter((i: any) => i.product?.umkm_profile?.id === umkmId)
          .map((i: any) => ({
            cartItemId: i.id,
            productId: i.product_id,
            name: i.product?.name || "",
            price: i.variant ? Number(i.variant.price) : Number(i.product?.price || 0),
            quantity: i.quantity,
          }));
        setCartItems(tokoItems);
      }
    } catch {
      // Belum login
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await productApi.get(slug);
        if (res.data && res.data.success) {
          const prod = res.data.data;
          setProduk(prod);
          setToko(prod.umkm_profile);
          
          if (prod.umkm_profile?.id) {
            syncCart(prod.umkm_profile.id);
          }

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
        if (toko?.id) {
          syncCart(toko.id);
        }
      } else {
        toast.error(res.data.message || "Gagal menambahkan ke keranjang.");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setShowLoginAlert(true);
      } else if (
        err.response?.data?.message?.toLowerCase().includes("toko lain") ||
        err.response?.data?.message?.toLowerCase().includes("beda toko")
      ) {
        setPendingQty(qty);
        setShowConflictAlert(true);
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
        setShowLoginAlert(true);
      } else if (
        err.response?.data?.message?.toLowerCase().includes("toko lain") ||
        err.response?.data?.message?.toLowerCase().includes("beda toko")
      ) {
        setPendingQty(qty);
        setShowConflictAlert(true);
      } else {
        toast.error(err.response?.data?.message || "Gagal menambahkan ke keranjang.");
      }
    }
  };

  const handleReplaceCart = async () => {
    try {
      await cartApi.clear();
      const res = await cartApi.add(produk.id, pendingQty, selectedVariantId);
      if (res.data && res.data.success) {
        toast.success("Produk ditambahkan ke keranjang baru!");
        window.dispatchEvent(new Event("cart-updated"));
        if (toko?.id) {
          syncCart(toko.id);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengganti keranjang.");
    } finally {
      setShowConflictAlert(false);
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
  const totalCartQty = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh", paddingBottom: totalCartQty > 0 ? "96px" : "0" }}>
      {/* Alert Konflik Beda Toko */}
      {showConflictAlert && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowConflictAlert(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Ganti Keranjang?</h3>
            <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
              Keranjangmu berisi produk dari toko lain. Ingin menghapus keranjang lama dan mulai belanja di toko ini?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConflictAlert(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={handleReplaceCart}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
              >
                Hapus & Ganti
              </button>
            </div>
          </div>
        </div>
      )}

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
              Kamu perlu login untuk menambahkan produk ke keranjang.
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

            {/* Konten Tab */}
            <div className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-6">
                {produk.description}
              </p>

              <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-3">Spesifikasi Produk</h3>
              <div className="grid grid-cols-2 gap-3">
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

      {/* Sticky Bar GoFood-style */}
      {totalCartQty > 0 && toko && (
        <StickyCartBar
          items={cartItems}
          shopName={toko.shop_name || toko.nama || "Nama Toko"}
          onViewCart={() => router.push("/checkout")}
        />
      )}
    </div>
  );
}
