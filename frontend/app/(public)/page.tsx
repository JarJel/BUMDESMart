"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { sellerApi, SellerData } from "@/lib/api/seller";
import { StarIcon } from "@/components/ui/StarIcon";

function TokoCard({ toko }: { toko: any }) {
  const shopName = toko.shop_name || toko.nama || "Nama Toko";
  const desc = toko.description || toko.deskripsi || "Deskripsi toko";
  const banner = toko.banner || toko.foto || "";
  const city = toko.city || toko.lokasi || "Jawa Barat";
  const rating = toko.rating || "5.0";
  const totalProduk = toko.totalProduk ?? 0;
  const totalPenjualan = toko.totalPenjualan ?? 0;

  const hasBanner = banner && (banner.startsWith('http') || banner.startsWith('/'));
  const bannerUrl = hasBanner ? banner : (banner ? `http://localhost:8000${banner}` : '');

  return (
    <Link
      href={`/${toko.slug}`}
      className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-100"
    >
      {/* Banner foto toko */}
      <div className="h-44 relative overflow-hidden bg-gray-50 flex items-center justify-center">
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

export default function BerandaPage() {
  const [tokoUnggulan, setTokoUnggulan] = useState<SellerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerApi.list({ limit: 4 })
      .then(res => {
        if (res.data && res.data.success) {
          setTokoUnggulan(res.data.data);
        }
      })
      .catch(err => {
        console.error("Gagal memuat toko unggulan:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-white rounded-2xl h-72 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

              {/* Stat */}
              <div className="hidden md:grid grid-cols-2 gap-4 shrink-0">
                {[
                  { label: "UMKM Aktif", value: "9+" },
                  { label: "Produk Tersedia", value: "50+" },
                  { label: "Transaksi/Hari", value: "100+" },
                  { label: "Desa Binaan", value: "1" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-center">
                    <p className="text-2xl font-bold text-white">{s.value}</p>
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
                  <p className="text-5xl font-bold mb-2">🛵</p>
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
                {[
                  { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Penghasilan Harian", desc: "Bayaran per pengiriman langsung masuk" },
                  { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Jam Kerja Bebas", desc: "Aktif sesuai kesiapanmu, kapan saja" },
                  { icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", label: "Mitra Resmi", desc: "Terdaftar & dipercaya BUMDes" },
                ].map(b => (
                  <div key={b.label} className="flex gap-3 items-start p-3 rounded-xl" style={{ background: "#FFF7ED" }}>
                    <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#EA580C" }}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={b.icon} />
                      </svg>
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
    </>
  );
}