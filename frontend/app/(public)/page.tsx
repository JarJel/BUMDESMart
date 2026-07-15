"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { sellerApi, SellerData } from "@/lib/api/seller";
import { StarIcon } from "@/components/ui/StarIcon";
import { useRouter } from "next/navigation";
import { cartApi } from "@/lib/api/cart";
import api from "@/lib/api/axios";
import { useAuth } from "@/hooks/useAuth";
import { Bike, Store, Package, ShoppingBag, MapPin, DollarSign, Clock, BadgeCheck } from "lucide-react";

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

  return (
    <p ref={ref} className="text-2xl font-bold text-white">
      {count.toLocaleString("id-ID")}{suffix}
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

function TokoCard({ toko }: { toko: any }) {
  const shopName = toko.shop_name || toko.nama || "Nama Toko";
  const desc = toko.description || toko.deskripsi || "Deskripsi toko";
  const banner = toko.logo || toko.banner || toko.foto || "";
  const city = toko.city || toko.lokasi || "Jawa Barat";
  const rating = toko.rating || "5.0";
  const totalProduk = toko.totalProduk ?? 0;
  const totalPenjualan = toko.totalPenjualan ?? 0;

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
  const IMG_BASE = API_URL.replace("/api/v1", "");
  
  let bannerUrl = "";
  if (banner) {
    if (banner.startsWith("http")) {
      bannerUrl = banner;
    } else {
      const cleanBanner = banner.startsWith("/") ? banner : `/${banner}`;
      bannerUrl = `${IMG_BASE}${cleanBanner}`;
    }
  }

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
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full z-10">
          <StarIcon size="sm" className="text-yellow-400" />
          <span className="text-xs font-semibold text-white">{rating}</span>
        </div>
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
}

export default function BerandaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tokoUnggulan, setTokoUnggulan] = useState<SellerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PublicStats>({ umkm_aktif: 0, produk_tersedia: 0, transaksi_selesai: 0, desa_binaan: 0 });

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
      .then(res => { if (res.data?.data) setStats(res.data.data); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ paddingBottom: cartItems.length > 0 ? "96px" : "0" }}>
      {/* ===== HERO ===== */}
      <section
        className="relative overflow-hidden flex items-center"
        style={{
          minHeight: "480px",
          backgroundImage:
            "linear-gradient(to right, rgba(20,50,35,0.92) 0%, rgba(27,67,50,0.78) 55%, rgba(27,67,50,0.35) 100%), url('/images/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 60%",
        }}
      >
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight drop-shadow-sm">
              Hasil Bumi Pilihan,<br />Langsung dari Petani
            </h1>
            <p className="text-green-100/90 text-base mb-8 leading-relaxed max-w-sm">
              Belanja produk autentik dan berkualitas langsung dari UMKM desa di seluruh Indonesia ke tangan Anda.
            </p>
            <Link
              href="/produk"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 shadow-lg hover:gap-3"
              style={{ background: "var(--primary-light)", color: "white" }}
            >
              Belanja Sekarang
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Carousel dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          <div className="w-7 h-2 rounded-full bg-white" />
          <div className="w-2 h-2 rounded-full bg-white/40" />
          <div className="w-2 h-2 rounded-full bg-white/40" />
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
                Karya Terbaik<br />dari Desa
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
              <div className="hidden md:grid grid-cols-2 gap-4 shrink-0">
                {([
                  { label: "UMKM Aktif",        value: stats.umkm_aktif,        suffix: "+", Icon: Store },
                  { label: "Produk Tersedia",    value: stats.produk_tersedia,   suffix: "+", Icon: Package },
                  { label: "Transaksi Selesai",  value: stats.transaksi_selesai, suffix: "+", Icon: ShoppingBag },
                  { label: "Desa Binaan",        value: stats.desa_binaan,       suffix: "",  Icon: MapPin },
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

      {/* ===== JADI PENGIRIM ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Ilustrasi kiri */}
            <div className="w-full md:w-[420px] shrink-0">
              <div className="relative w-full h-72 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #EA580C 0%, #F97316 50%, #FED7AA 100%)" }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-32 h-32 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}
                      d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
                  </svg>
                </div>
                <div className="relative z-10 text-center text-white px-6">
                  <div className="flex items-center justify-center mb-3">
                    <Bike className="w-14 h-14 text-white drop-shadow-lg" strokeWidth={1.5} />
                  </div>
                  <p className="text-lg font-bold">Antar. Cepat. Cuan.</p>
                  <p className="text-sm text-orange-100 mt-1">Bergabung bersama pengirim BUMDESMart</p>
                </div>
                <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-white/10" />
                <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/10" />
              </div>
            </div>

            {/* Teks kanan */}
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#EA580C" }}>
                Peluang Penghasilan
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Jadi Pengirim<br />BUMDESMart
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-md">
                Bantu produk UMKM desa sampai ke tangan pembeli. Jadwal fleksibel, penghasilan kompetitif — mulai dari kendaraan yang kamu punya sekarang.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {([
                  { Icon: DollarSign, label: "Penghasilan Harian",  desc: "Bayaran per pengiriman langsung masuk" },
                  { Icon: Clock,      label: "Jam Kerja Bebas",     desc: "Aktif sesuai kesiapanmu, kapan saja" },
                  { Icon: BadgeCheck, label: "Mitra Resmi",         desc: "Terdaftar & dipercaya BUMDes" },
                ] as const).map(b => (
                  <div key={b.label} className="flex gap-3 items-start p-3 rounded-xl" style={{ background: "#FFF7ED" }}>
                    <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#EA580C" }}>
                      <b.Icon className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{b.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/daftar/kurir"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-all"
                style={{ background: "#EA580C" }}>
                Daftar Jadi Pengirim
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
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
            JADI MITRA KAMI DI BUMDESMART
          </h2>
          <p className="text-green-200 text-sm mb-8 leading-relaxed max-w-md mx-auto">
            Daftarkan bisnis Anda dan jangkau lebih banyak pelanggan. Bersama BumdesMart, UMKM Desa Lengkong semakin maju dan dikenal.
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