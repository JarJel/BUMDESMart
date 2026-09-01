"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { sellerApi, SellerData } from "@/lib/api/seller";
import { StarIcon } from "@/components/ui/StarIcon";
import { useRouter } from "next/navigation";
import { cartApi } from "@/lib/api/cart";
import api from "@/lib/api/axios";
import { useAuth } from "@/hooks/useAuth";
import { Store, Package, ShoppingBag, MapPin, Eye } from "lucide-react";
import { getFileUrl } from "@/lib/storage";

// ─── Counter animasi count-up ─────────────────────────────────────────────────
function CountUp({ target, suffix = "", duration = 1800 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        observer.disconnect();
        let startTs: number | null = null;
        const step = (ts: number) => {
          if (!startTs) startTs = ts;
          const p = Math.min((ts - startTs) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setCount(Math.floor(eased * target));
          if (p < 1) requestAnimationFrame(step);
          else setCount(target);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  const safeCount = isNaN(count) || count == null ? 0 : count;
  return (
    <p ref={ref} className="text-2xl font-bold text-white">
      {safeCount.toLocaleString("id-ID")}{suffix}
    </p>
  );
}

// ─── Sticky Bar GoFood Component ─────────────────────────────────────────────
function StickyCartBar({ items, shopName, onViewCart }: {
  items: any[];
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
          <div className="flex-shrink-0 w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">{totalQty}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-none truncate">{shopName}</p>
            <p className="text-white/70 text-xs mt-0.5">Rp {totalPrice.toLocaleString("id-ID")}</p>
          </div>

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

// ─── Hero Banner Slider Component ─────────────────────────────────────────────
const BANNER_SLIDES = [
  {
    id: 1,
    tag: "🌱 Produk Asli Desa",
    title: <>Hasil Bumi Pilihan, <br className="hidden sm:inline" />Langsung dari Petani</>,
    desc: "Belanja produk segar, autentik, dan berkualitas langsung dari UMKM desa di seluruh Indonesia ke tangan Anda.",
    btnText: "Belanja Sekarang",
    btnLink: "/produk",
    bgImage: "/images/hero-bg.jpg",
    accentBadge: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    btnBg: "var(--primary-light)",
  },
  {
    id: 2,
    tag: "🤝 Pemberdayaan Ekonomi",
    title: <>Kembangkan Usaha Anda <br className="hidden sm:inline" />Bersama BUMDesMart</>,
    desc: "Daftarkan produk UMKM desa Anda dan jangkau pasar lebih luas dengan sistem penjualan digital yang mudah & terintegrasi.",
    btnText: "Gabung Jadi Mitra",
    btnLink: "/mitra",
    bgImage: "/images/mitra-hero.jpg",
    accentBadge: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    btnBg: "#059669",
  },
  {
    id: 3,
    tag: "✨ Spesial Hari Ini",
    title: <>Dukung Produk Lokal, <br className="hidden sm:inline" />Nikmati Diskon Spesial</>,
    desc: "Temukan ragam olahan khas nusantara, kerajinan tangan, dan sembako berkualitas dengan harga terbaik dari produsen.",
    btnText: "Lihat Produk Unggulan",
    btnLink: "/produk",
    bgImage: "/images/tentang-hero.jpg",
    accentBadge: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    btnBg: "var(--primary-light)",
  },
];

function HeroBannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
  };

  return (
    <section
      className="relative overflow-hidden group select-none"
      style={{ minHeight: "520px" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides */}
      {BANNER_SLIDES.map((slide, idx) => {
        const isActive = idx === currentSlide;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
            }`}
          >
            {/* Optimized Next.js Background Image */}
            <div className="absolute inset-0 z-0">
              <Image
                src={slide.bgImage}
                alt={typeof slide.tag === "string" ? slide.tag : "Banner Desa"}
                fill
                priority={idx === 0}
                quality={80}
                sizes="100vw"
                className="object-cover object-center"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to right, rgba(15,35,25,0.94) 0%, rgba(20,55,40,0.85) 45%, rgba(27,67,50,0.5) 100%)",
                }}
              />
            </div>

            <div className="relative w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center py-20 z-10">
              <div
                className={`max-w-2xl transition-all duration-700 delay-100 ${
                  isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                }`}
              >
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-4 backdrop-blur-sm ${slide.accentBadge}`}
                >
                  {slide.tag}
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-sm">
                  {slide.title}
                </h1>
                <p className="text-emerald-50/90 text-sm sm:text-base mb-8 leading-relaxed max-w-lg">
                  {slide.desc}
                </p>
                <Link
                  href={slide.btnLink}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-95 shadow-xl hover:gap-3.5 active:scale-95"
                  style={{ background: slide.btnBg, color: "white" }}
                >
                  {slide.btnText}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        aria-label="Slide Sebelumnya"
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/25 hover:bg-black/50 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 border border-white/10 hover:scale-105 active:scale-95 cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={handleNext}
        aria-label="Slide Selanjutnya"
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/25 hover:bg-black/50 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 border border-white/10 hover:scale-105 active:scale-95 cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Interactive Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm border border-white/10">
        {BANNER_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Pindah ke slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer border-0 p-0 ${
                isActive ? "w-7 h-2 bg-white shadow-sm" : "w-2 h-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}

function TokoCard({ toko }: { toko: any }) {
  const shopName = toko.shop_name || toko.nama || "Nama Toko";
  const desc = toko.description || toko.deskripsi || "Deskripsi toko";
  const banner = toko.logo || toko.banner || toko.foto || "";
  const city = toko.city || toko.lokasi || "Jawa Barat";
  const rating = toko.rating ? Number(toko.rating).toFixed(1) : null;
  const totalProduk = toko.totalProduk ?? 0;
  const totalPenjualan = toko.totalPenjualan ?? 0;

  const bannerUrl = getFileUrl(banner) ?? "";

  return (
    <Link
      href={`/${toko.slug}`}
      className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-100"
    >
      {/* Banner foto toko */}
      <div className="h-32 sm:h-44 relative overflow-hidden bg-gray-50 flex items-center justify-center">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={shopName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[var(--primary)] via-[var(--primary)] to-[var(--primary-light)] group-hover:scale-105 transition-transform duration-200" />
        )}
        {rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full z-10">
            <StarIcon size="sm" className="text-yellow-400" />
            <span className="text-xs font-semibold text-white">{rating}</span>
          </div>
        )}
        {totalProduk > 0 && (
          <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white font-medium z-10">
            {totalProduk} produk
          </div>
        )}
        {/* Nama toko overlay bawah */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent z-0" />
      </div>

      {/* Info toko */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-green-700 transition-colors line-clamp-1">
          {shopName}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
          {desc}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{city.split(",")[0]}</span>
          </div>
          {totalPenjualan > 0 && (
            <span className="font-medium text-green-700">{totalPenjualan.toLocaleString("id")} terjual</span>
          )}
        </div>
      </div>
    </Link>
  );
}

interface PublicStats {
  umkm_aktif: number;
  produk_tersedia: number;
  transaksi_selesai: number;
  desa_binaan: number;
  total_pengunjung: number;
}

export default function BerandaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tokoUnggulan, setTokoUnggulan] = useState<SellerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PublicStats>({ umkm_aktif: 0, produk_tersedia: 0, transaksi_selesai: 0, desa_binaan: 0, total_pengunjung: 0 });

  // State untuk sticky bar keranjang
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartShopName, setCartShopName] = useState<string>("");

  const loadCartData = async () => {
    if (user?.role !== "customer") return;
    try {
      const res = await cartApi.get();
      if (res.data?.success && res.data?.data?.items) {
        const items = res.data.data.items;
        setCartItems(items);
        if (items.length > 0) {
          const firstItemShop = items[0].product?.umkm_profile?.shop_name || "Nama Toko";
          setCartShopName(firstItemShop);
        } else {
          setCartShopName("");
        }
      }
    } catch {
      // Belum login atau tidak ada cart
    }
  };

  useEffect(() => {
    loadCartData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Listen event update keranjang jika ada perubahan di page lain
  useEffect(() => {
    const handleCartUpdated = () => {
      loadCartData();
    };
    window.addEventListener("cart-updated", handleCartUpdated);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, []);

  useEffect(() => {
    sellerApi.list({ limit: 4 })
      .then(res => { if (res.data?.success) setTokoUnggulan(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get("/stats")
      .then(res => { if (res.data?.data) setStats(prev => ({ ...prev, ...res.data.data })); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ paddingBottom: cartItems.length > 0 ? "96px" : "0" }}>
      {/* ===== HERO SLIDER ===== */}
      <HeroBannerSlider />

      {/* ===== DIDUKUNG OLEH ===== */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
            Didukung oleh
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            <a href="https://kemdiktisaintek.go.id" aria-label="Website Kemdiktisaintek" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
              <img src="/images/logo-kemendikbud.png" alt="Kemdiktisaintek — Tut Wuri Handayani" width="140" height="56" className="h-14 w-auto object-contain" />
            </a>
            <a href="https://kemdiktisaintek.go.id" aria-label="Website Diktisaintek" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
              <img src="/images/logo-diktisaintek.png" alt="Diktisaintek Berdampak" width="140" height="56" className="h-14 w-auto object-contain" />
            </a>
            <a href="https://bima.kemdiktisaintek.go.id" aria-label="Website BiMA Kemdiktisaintek" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
              <img src="/images/logo-bima.png" alt="BiMA — Kemdiktisaintek" width="120" height="48" className="h-12 w-auto object-contain" />
            </a>
            <a href="https://ukebangsaan.ac.id" aria-label="Website Universitas Kebangsaan RI" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
              <img src="/images/logo-ukri.png" alt="Universitas Kebangsaan Republik Indonesia" width="56" height="56" className="h-14 w-auto object-contain" />
            </a>
          </div>
          <p className="text-center text-xs text-gray-500 mt-5 italic">
            Program ini dibiayai dari APBN melalui anggaran Kemdiktisaintek
          </p>
        </div>
      </section>

      {/* ===== KARYA TERBAIK ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Foto kiri */}
            <div className="w-full md:w-[420px] shrink-0">
              <div
                className="w-full h-72 rounded-2xl overflow-hidden"
                style={{
                  backgroundImage: "url('/images/karya-terbaik.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>

            {/* Teks kanan */}
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--primary-light)" }}>
                Produk Terbaik Desa
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Karya Terbaik <br />dari Desa
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-2 max-w-md">
                Keripik tempe, manisan tradisional, frozen food, bakery — produk unggulan yang lahir dari tangan terampil warga desa.
              </p>
              <p className="text-sm text-gray-500 leading-relaxed mb-7 max-w-md">
                Setiap produk dibuat dengan bahan lokal pilihan, diproses higienis, dan telah tersertifikasi. Kualitas terbaik, langsung dari desa.
              </p>
              <Link
                href="/produk"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                style={{ background: "var(--primary)" }}
              >
                Jelajahi Semua Produk
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== UMKM UNGGULAN ===== */}
      <section className="py-14" style={{ background: "#F4F7F5" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Produk Unggulan Desa</h2>
              <p className="text-sm text-gray-400 mt-0.5">Toko terpopuler pilihan pelanggan dari desa-desa Indonesia</p>
            </div>
            <Link href="/toko" className="text-sm font-semibold flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: "var(--primary)" }}>
              Lihat Semua
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-white rounded-2xl h-60 sm:h-72 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {tokoUnggulan.map((toko) => <TokoCard key={toko.id} toko={toko} />)}
            </div>
          )}
        </div>
      </section>

      {/* ===== BELANJA BANNER ===== */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              backgroundImage: "linear-gradient(rgba(20,50,35,0.85), rgba(20,50,35,0.85)), url('/images/hero-bg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center 70%",
            }}
          >
            <div className="px-8 md:px-14 py-14 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
                  Belanja Produk Lokal,<br />Dukung Desa Kita
                </h2>
                <p className="text-green-200 text-sm leading-relaxed mb-8 max-w-sm">
                  Setiap pembelian Anda langsung mendukung perekonomian UMKM dan masyarakat desa di seluruh Indonesia.
                </p>
                <Link
                  href="/produk"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm bg-white hover:bg-gray-50 transition-colors"
                  style={{ color: "var(--primary-dark)" }}
                >
                  Mulai Belanja
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Stat dengan animasi count-up */}
              <div className="grid grid-cols-2 gap-4 shrink-0">
                {([
                  { label: "UMKM Aktif",           value: stats.umkm_aktif,         suffix: "+", Icon: Store },
                  { label: "Produk Tersedia",       value: stats.produk_tersedia,    suffix: "+", Icon: Package },
                  { label: "Transaksi Selesai",     value: stats.transaksi_selesai,  suffix: "+", Icon: ShoppingBag },
                  { label: "Desa Binaan",           value: stats.desa_binaan,        suffix: "",  Icon: MapPin },
                  { label: "Pengunjung Website",    value: stats.total_pengunjung,   suffix: "+", Icon: Eye },
                ] as const).map((s) => (
                  <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-center">
                    <s.Icon className="w-5 h-5 text-green-300 mx-auto mb-1" />
                    <CountUp target={s.value} suffix={s.suffix} />
                    <p className="text-xs text-green-200 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== JADI MITRA CTA ===== */}
      <section
        className="py-20 px-4 relative overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(20,50,35,0.88), rgba(27,67,50,0.92)), url('/images/karya-terbaik.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
            JADI MITRA KAMI DI BumDesMartNukita
          </h2>
          <p className="text-green-200 text-sm mb-8 leading-relaxed max-w-md mx-auto">
            Daftarkan bisnis Anda dan jangkau lebih banyak pelanggan. Bersama BumDesMartNukita, UMKM Desa Lengkong semakin maju dan dikenal.
          </p>
          <Link
            href="/mitra"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-all"
            style={{ background: "var(--primary-light)" }}
          >
            Jadi Mitra
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {/* Dekorasi lingkaran */}
        <div className="absolute -right-24 -top-24 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-white/5" />
      </section>

      {/* Sticky Bar GoFood-style */}
      {cartItems.length > 0 && cartShopName && (
        <StickyCartBar
          items={cartItems.map(i => ({
            cartItemId: i.id,
            productId: i.product_id,
            name: i.product?.name || "",
            price: i.variant ? Number(i.variant.price) : Number(i.product?.price || 0),
            quantity: i.quantity,
          }))}
          shopName={cartShopName}
          onViewCart={() => router.push("/checkout")}
        />
      )}
    </div>
  );
}