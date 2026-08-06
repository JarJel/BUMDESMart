"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useState, useEffect, use, useRef } from "react";
import { StarIcon } from "@/components/ui/StarIcon";
import { ProductCard } from "@/components/shared/ProductCard";
import { VariantSelector } from "@/components/produk/VariantSelector";
import { QtyButtons } from "@/components/produk/QtyButtons";
import { DOKUMEN_META } from "@/lib/data/dummy";
import type { Dokumen } from "@/lib/data/dummy";
import { productApi } from "@/lib/api/product";
import { cartApi } from "@/lib/api/cart";
import { useToast } from "@/components/ui/Toast";
import { getFileUrl } from "@/lib/storage";

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  const [pendingQty, setPendingQty] = useState<number>(1);
  const [cartItems, setCartItems] = useState<LocalCartItem[]>([]);

  const syncCart = async (umkmId: number) => {
    if (!localStorage.getItem('token')) return;
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
    if (produk.variants && produk.variants.length > 0 && selectedVariantId === null) {
      toast.warning("Silakan pilih varian produk terlebih dahulu.");
      return;
    }
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
    if (produk.variants && produk.variants.length > 0 && selectedVariantId === null) {
      toast.warning("Silakan pilih varian produk terlebih dahulu.");
      return;
    }
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

  const resolveImg = (p: string | null | undefined) => getFileUrl(p) ?? '/placeholder-product.jpg';
  const defaultMainImage = resolveImg(
    produk.primary_image?.file_path ?? produk.images?.[0]?.file_path ?? null
  );
  const mainImageUrl = selectedImage || defaultMainImage;
  const allImages = Array.from(new Set([
    defaultMainImage,
    ...(produk.images || []).map((img: any) => getFileUrl(img.file_path) ?? "")
  ].filter(Boolean) as string[]));

  const selectIndex = (idx: number) => {
    setActiveIndex(idx);
    if (sliderRef.current) {
      const container = sliderRef.current;
      const width = container.clientWidth;
      container.scrollTo({
        left: width * idx,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (sliderRef.current) {
      const container = sliderRef.current;
      const scrollLeft = container.scrollLeft;
      const width = container.clientWidth;
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);
    }
  };

  const slidePrev = () => {
    const index = Math.max(0, activeIndex - 1);
    selectIndex(index);
  };

  const slideNext = () => {
    const index = Math.min(allImages.length - 1, activeIndex + 1);
    selectIndex(index);
  };

  const price = Number(produk.price || 0);
  const rating = produk.rating ?? null;
  const soldCount = produk.sold_count ?? 0;
  const activeDiscount = produk.active_discount ?? null;
  
  // Hitung harga dinamis berdasarkan varian (options) atau diskon
  let activeVariant: any = null;
  const allVariantOptions = (produk.variants ?? []).flatMap((v: any) => v.options ?? []);
  const isVariantProduct = produk.has_variant && allVariantOptions.length > 0;

  if (produk.variants) {
    for (const v of produk.variants) {
      const found = v.options?.find((opt: any) => opt.id === selectedVariantId);
      if (found) {
        activeVariant = found;
        break;
      }
    }
  }

  // Effective price & stock: use variant data when product has variants
  const effectivePrice = isVariantProduct
    ? (activeVariant ? Number(activeVariant.price) : Math.min(...allVariantOptions.map((o: any) => Number(o.price))))
    : price;
  const effectiveStock = isVariantProduct
    ? (activeVariant ? Number(activeVariant.stock) : allVariantOptions.reduce((sum: number, o: any) => sum + Number(o.stock), 0))
    : produk.stock;

  const finalPrice = activeVariant 
    ? Number(activeVariant.price) 
    : (activeDiscount ? Number(activeDiscount.discounted_price) : effectivePrice);
    
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
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 lg:gap-8 mb-3 items-start">

          {/* Kolom foto + varian di bawahnya */}
          <div className="w-full sm:w-52 lg:w-64 shrink-0">
            {allImages.length > 1 ? (
              <div className="relative aspect-square -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full rounded-none sm:rounded-2xl overflow-hidden mb-1.5 bg-gray-50 group">
                <div 
                  ref={sliderRef}
                  onScroll={handleScroll}
                  className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {allImages.map((imgUrl, idx) => (
                    <div key={idx} className="w-full h-full shrink-0 snap-center flex items-center justify-center">
                      <img
                        src={imgUrl}
                        alt={`${produk.name} - ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/600x600?text=No+Image';
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Tombol Navigasi Kiri & Kanan (Desktop Only) */}
                <button
                  onClick={slidePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hidden sm:flex border-0 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={slideNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hidden sm:flex border-0 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Dots Indikator */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                  {allImages.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all ${idx === activeIndex ? "w-4 bg-green-600" : "w-1.5 bg-gray-300/80"}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="aspect-square -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full rounded-none sm:rounded-2xl overflow-hidden mb-1.5 bg-gray-50 flex items-center justify-center">
                <img
                  src={allImages[0]}
                  alt={produk.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/600x600?text=No+Image';
                  }}
                />
              </div>
            )}

            {/* Thumbnail — ditampilkan di desktop dan mobile jika lebih dari 1 gambar */}
            {allImages.length > 1 && (
              <div className="flex gap-1.5 mb-2 overflow-x-auto px-4 sm:px-0 scrollbar-none">
                {allImages.map((imgUrl, idx) => {
                  const isActive = activeIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => selectIndex(idx)}
                      className={`w-11 h-11 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors shrink-0 ${isActive ? "border-green-600" : "border-transparent hover:border-green-300"}`}
                      style={{
                        backgroundImage: `url('${imgUrl}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Kolom info */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--primary-muted)", color: "var(--primary)" }}>
                {produk.category?.name || "Produk"}
              </span>
              {produk.is_pre_order ? (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">Pre-Order ({produk.pre_order_days} Hari)</span>
              ) : effectiveStock > 0 ? (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">Tersedia</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">Habis</span>
              )}
            </div>

            <h1 className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1.5 leading-snug">{produk.name}</h1>

            <div className="flex items-center gap-1 sm:gap-1.5 mb-2">
              {rating !== null && (
                <>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarIcon key={s} size="sm" className={s <= Math.round(Number(rating)) ? "fill-yellow-400" : "fill-gray-200"} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{rating}</span>
                  <span className="text-gray-300 text-xs hidden sm:inline">·</span>
                </>
              )}
              <span className="text-xs text-gray-400 hidden sm:inline">{soldCount.toLocaleString("id")} terjual</span>
            </div>

            {/* Harga */}
            <div className="mb-3">
              {activeVariant ? (
                <div>
                  <p className="text-base sm:text-2xl lg:text-3xl font-bold" style={{ color: "var(--primary)" }}>
                    Rp {Number(activeVariant.price).toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Varian terpilih: <span className="font-semibold text-gray-700">{activeVariant.value}</span>
                  </p>
                </div>
              ) : activeDiscount ? (
                <div>
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
              ) : isVariantProduct && !activeVariant ? (
                <div>
                  <p className="text-base sm:text-2xl lg:text-3xl font-bold" style={{ color: "var(--primary)" }}>
                    {(() => {
                      const prices = allVariantOptions.map((o: any) => Number(o.price));
                      const min = Math.min(...prices);
                      const max = Math.max(...prices);
                      return min === max
                        ? `Rp ${min.toLocaleString("id-ID")}`
                        : `Rp ${min.toLocaleString("id-ID")} – ${max.toLocaleString("id-ID")}`;
                    })()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Pilih varian untuk melihat harga</p>
                </div>
              ) : (
                <p className="text-base sm:text-2xl lg:text-3xl font-bold" style={{ color: "var(--primary)" }}>
                  Rp {effectivePrice.toLocaleString("id-ID")}
                </p>
              )}
            </div>

            <p className="hidden sm:block text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{produk.description}</p>

            {/* Pilihan Varian (Ditempatkan di atas Qty & Beli) */}
            {produk.variants && produk.variants.length > 0 && (
              <div className="py-3 mb-4 border-t border-b border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Variasi</span>
                  {!activeVariant && (
                    <span className="text-[11px] text-amber-600 font-semibold animate-pulse">Pilih varian untuk checkout</span>
                  )}
                </div>
                <VariantSelector 
                  variants={produk.variants}
                  selectedId={selectedVariantId}
                  onChange={setSelectedVariantId}
                />
              </div>
            )}

            {/* Qty + tombol */}
            <QtyButtons 
              stok={effectiveStock} 
              onAddToCart={handleAddToCart} 
              onBuyNow={handleBuyNow} 
              isPreOrder={produk.is_pre_order}
              preOrderDays={produk.pre_order_days}
            />
          </div>
        </div>

        {/* Card toko — full width di bawah dua kolom */}
        {toko && (
          <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0"
              style={{
                backgroundImage: toko.logo
                  ? `url('${resolveImg(toko.logo)}')`
                  : toko.banner
                    ? `url('${resolveImg(toko.banner)}')`
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
              <p className="text-xs text-gray-400">{toko.owner_name || "-"} · {toko.city || "-"}</p>
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
                  onClick={() => setActiveTab(i)}
                  className={`shrink-0 px-3 sm:px-5 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === i ? "border-green-600 text-green-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab 0: Informasi Produk */}
            {activeTab === 0 && (
              <div className="p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-6">
                  {produk.description}
                </p>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-3">Spesifikasi Produk</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Asal Produk", val: toko?.city || "-" },
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
            )}

            {/* Tab 1: Ulasan */}
            {activeTab === 1 && (
              <div className="p-4 sm:p-6">
                {(produk.reviews ?? []).length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Belum ada ulasan</p>
                    <p className="text-xs text-gray-400 mt-1">Jadilah yang pertama memberikan ulasan untuk produk ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(produk.reviews as any[]).map((r: any, idx: number) => (
                      <div key={idx} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                            {(r.customer?.user?.name ?? "A")[0].toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{r.customer?.user?.name ?? "Pembeli"}</span>
                          <div className="flex gap-0.5 ml-auto">
                            {[1,2,3,4,5].map(s => (
                              <svg key={s} className={`w-3 h-3 ${s <= r.rating ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-xs text-gray-600 leading-relaxed pl-9">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Info Pengiriman */}
            {activeTab === 2 && (
              <div className="p-4 sm:p-6 space-y-4">
                {[
                  { icon: "🚚", title: "Pengiriman oleh Kurir BUMDESmart", desc: "Diantar langsung oleh kurir terverifikasi dari BUMDes sekitar. Estimasi 1–3 jam setelah pesanan dikonfirmasi." },
                  { icon: "📦", title: "Pengemasan Aman", desc: "Produk dikemas oleh penjual sebelum diambil kurir. Pastikan produk sudah siap saat pesanan dikonfirmasi." },
                  { icon: "📍", title: "Area Pengiriman", desc: `Pengiriman dalam area operasional BUMDes${toko?.bumdesProfile?.village ? " " + toko.bumdesProfile.village : ""}. Cek area coverage di halaman toko.` },
                  { icon: "💳", title: "Pembayaran di Muka", desc: "Pembayaran dilakukan saat checkout. Pesanan akan diproses setelah pembayaran dikonfirmasi." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
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
