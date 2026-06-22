import Link from "next/link";
import { notFound } from "next/navigation";
import { getProdukBySlug, getAllProduk, DOKUMEN_META } from "@/lib/data/dummy";
import { StarIcon } from "@/components/ui/StarIcon";
import { ProductCard } from "@/components/shared/ProductCard";
import { VariantSelector } from "@/components/produk/VariantSelector";
import { QtyButtons } from "@/components/produk/QtyButtons";
import type { Dokumen } from "@/lib/data/dummy";

export function generateStaticParams() {
  return getAllProduk().map((p) => ({ slug: p.slug }));
}

export default async function ProdukDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = getProdukBySlug(slug);
  if (!result) notFound();

  const { toko, ...produk } = result;
  const allOther = getAllProduk().filter((p) => p.slug !== slug);
  const sameKategori = allOther.filter((p) => p.kategori === produk.kategori);
  const relatedFill = sameKategori.length >= 24
    ? sameKategori.slice(0, 24)
    : [...sameKategori, ...allOther.filter((p) => !sameKategori.find(r => r.id === p.id))].slice(0, 24);

  const fotoBg = produk.foto
    ? `url('${produk.foto}')`
    : `linear-gradient(135deg, var(--primary-muted), #B7E4C7)`;

  const dokumen: Dokumen[] = (toko as any).dokumen ?? [];

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
            <Link href={`/${toko.slug}`} className="hover:text-green-700 truncate max-w-[120px]">{toko.nama}</Link>
            <span>›</span>
            <span className="text-gray-600 truncate max-w-[120px] sm:max-w-xs">{produk.nama}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Grid utama: foto (kiri, fixed) + info (kanan, flex-1) */}
        <div className="flex flex-row gap-3 sm:gap-6 lg:gap-8 mb-3 items-start">

          {/* Kolom foto + varian di bawahnya */}
          <div className="w-32 sm:w-52 lg:w-64 shrink-0">
            <div
              className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden mb-1.5"
              style={{ backgroundImage: fotoBg, backgroundSize: "cover", backgroundPosition: "center" }}
            />
            {/* Thumbnail — hanya sm+ */}
            <div className="hidden sm:flex gap-1.5 mb-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-11 h-11 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors shrink-0 ${i === 0 ? "border-green-500" : "border-transparent hover:border-green-300"}`}
                  style={{
                    backgroundImage: fotoBg,
                    backgroundSize: "cover",
                    backgroundPosition: i === 1 ? "right center" : i === 2 ? "bottom center" : "center",
                  }}
                />
              ))}
            </div>
            {/* Varian di bawah gambar — mengisi ruang kosong */}
            {produk.variasi && produk.variasi.length > 0 && (
              <VariantSelector variasi={produk.variasi} />
            )}
          </div>

          {/* Kolom info */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--primary-muted)", color: "var(--primary)" }}>
                {produk.kategori}
              </span>
              {produk.stok > 0
                ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">Tersedia</span>
                : <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">Habis</span>
              }
            </div>

            <h1 className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1.5 leading-snug">{produk.nama}</h1>

            <div className="flex items-center gap-1 sm:gap-1.5 mb-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIcon key={s} size="sm" className={s <= Math.round(produk.rating) ? "fill-yellow-400" : "fill-gray-200"} />
                ))}
              </div>
              <span className="text-xs text-gray-500">{produk.rating}</span>
              <span className="text-gray-300 text-xs hidden sm:inline">·</span>
              <span className="text-xs text-gray-400 hidden sm:inline">{produk.terjual.toLocaleString("id")} terjual</span>
            </div>

            <p className="text-base sm:text-2xl lg:text-3xl font-bold mb-2" style={{ color: "var(--primary)" }}>
              Rp {produk.harga.toLocaleString("id-ID")}
            </p>

            <p className="hidden sm:block text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{produk.deskripsi}</p>

            {/* Qty + tombol */}
            <QtyButtons stok={produk.stok} />
          </div>
        </div>

        {/* Card toko — full width di bawah dua kolom */}
        <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0"
            style={{
              backgroundImage: toko.foto ? `url('${toko.foto}')` : `linear-gradient(135deg, var(--primary-dark), var(--primary))`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{toko.nama}</p>
            <p className="text-xs text-gray-400">{toko.pemilik} · {toko.totalProduk} produk · {toko.rating} bintang</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href="/chat"
              className="text-xs px-2.5 py-1.5 rounded-lg border font-medium bg-white hover:bg-gray-50 hidden sm:block"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              Pesan
            </Link>
            <Link
              href={`/${toko.slug}`}
              className="text-xs px-3 py-1.5 rounded-lg text-white font-medium"
              style={{ background: "var(--primary)" }}
            >
              Kunjungi Toko
            </Link>
          </div>
        </div>

        {/* Detail — Info & Legalitas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Info produk (2/3) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100">
            {/* Tabs — scrollable pada mobile */}
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {["Informasi Produk", "Ulasan", "Info Pengiriman"].map((tab, i) => (
                <button
                  key={tab}
                  className={`shrink-0 px-3 sm:px-5 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${i === 0 ? "border-green-600 text-green-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">{produk.deskripsi}</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[
                  { label: "Asal Produk", val: "Desa Lengkong" },
                  { label: "Min. Pembelian", val: "1 pcs" },
                  { label: "Penjual", val: toko.pemilik },
                  { label: "Kategori", val: produk.kategori },
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
              Dokumen resmi yang dimiliki {toko.nama}.
            </p>
            {dokumen.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Belum ada dokumen.</p>
            ) : (
              <div className="space-y-1.5">
                {dokumen.map((doc) => {
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
            <div className="mt-3 pt-3 border-t border-gray-50">
              <Link href={`/${toko.slug}`} className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                Lihat profil toko →
              </Link>
            </div>
          </div>
        </div>

        {/* Produk Serupa */}
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm sm:text-base font-bold text-gray-900">Produk Serupa</h2>
            <Link href="/produk" className="text-xs font-semibold" style={{ color: "var(--primary)" }}>Lihat Semua</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {relatedFill.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
