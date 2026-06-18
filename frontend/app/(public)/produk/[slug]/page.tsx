import Link from "next/link";
import { notFound } from "next/navigation";
import { getProdukBySlug, getAllProduk } from "@/lib/data/dummy";

export function generateStaticParams() {
  return getAllProduk().map((p) => ({ slug: p.slug }));
}

function StarIcon({ size = 4 }: { size?: number }) {
  return (
    <svg className={`w-${size} h-${size} fill-yellow-400`} viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default async function ProdukDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = getProdukBySlug(slug);
  if (!result) notFound();

  const { toko, ...produk } = result;
  const related = getAllProduk()
    .filter((p) => p.slug !== slug && p.kategori === produk.kategori)
    .slice(0, 4);
  const relatedFill = related.length < 4
    ? [...related, ...getAllProduk().filter((p) => p.slug !== slug && !related.find(r => r.id === p.id)).slice(0, 4 - related.length)]
    : related;

  const fotoBg = produk.foto
    ? `url('${produk.foto}')`
    : `linear-gradient(135deg, var(--primary-muted), #B7E4C7)`;

  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-green-700">Beranda</Link>
            <span>›</span>
            <Link href="/produk" className="hover:text-green-700">Produk UMKM</Link>
            <span>›</span>
            <Link href={`/${toko.slug}`} className="hover:text-green-700">{toko.nama}</Link>
            <span>›</span>
            <span className="text-gray-700 font-medium truncate max-w-40">{produk.nama}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          {/* Gambar produk */}
          <div>
            {/* Foto utama */}
            <div
              className="aspect-square rounded-2xl overflow-hidden mb-3"
              style={{
                backgroundImage: fotoBg,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {/* Thumbnail strip */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-16 h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-colors ${i === 0 ? "border-green-500" : "border-transparent hover:border-green-300"}`}
                  style={{
                    backgroundImage: fotoBg,
                    backgroundSize: "cover",
                    backgroundPosition: i === 1 ? "right center" : i === 2 ? "bottom center" : "center",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Info produk */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--primary-muted)", color: "var(--primary)" }}>
                {produk.kategori}
              </span>
              {produk.stok > 0 ? (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">Tersedia</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600">Habis</span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{produk.nama}</h1>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className={`w-4 h-4 ${s <= Math.round(produk.rating) ? "fill-yellow-400" : "fill-gray-200"}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600 font-medium">{produk.rating}</span>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-500">{produk.terjual.toLocaleString("id")} terjual</span>
            </div>

            <p className="text-3xl font-bold mb-5" style={{ color: "var(--primary)" }}>
              Rp {produk.harga.toLocaleString("id-ID")}
            </p>

            <p className="text-sm text-gray-600 leading-relaxed mb-6">{produk.deskripsi}</p>

            {/* Qty */}
            <div className="flex items-center gap-4 mb-6">
              <p className="text-sm font-medium text-gray-700">Jumlah</p>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg">-</button>
                <span className="w-10 text-center text-sm font-semibold">1</span>
                <button className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg">+</button>
              </div>
              <span className="text-xs text-gray-400">Stok: {produk.stok}</span>
            </div>

            <div className="flex gap-3 mb-6">
              <Link href="/keranjang" className="flex-1 text-center py-3 rounded-xl text-sm font-semibold border-2 transition-colors hover:bg-gray-50 bg-white" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                Tambah ke Keranjang
              </Link>
              <Link href="/checkout" className="flex-1 text-center py-3 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ background: "var(--primary)" }}>
                Beli Sekarang
              </Link>
            </div>

            {/* Seller card */}
            <div className="border border-gray-100 rounded-2xl p-4 flex items-center gap-4 bg-white">
              <div
                className="w-12 h-12 rounded-xl shrink-0 overflow-hidden"
                style={{
                  backgroundImage: toko.foto ? `url('${toko.foto}')` : `linear-gradient(135deg, var(--primary-dark), var(--primary))`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{toko.nama}</p>
                <p className="text-xs text-gray-500">{toko.totalProduk} produk · {toko.rating} bintang</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href="/chat" className="text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors hover:bg-gray-50 bg-white" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                  Pesan
                </Link>
                <Link href={`/${toko.slug}`} className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ background: "var(--primary)" }}>
                  Kunjungi Toko
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Detail tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-10">
          <div className="flex border-b border-gray-100">
            {["Informasi Produk", "Ulasan", "Info Pengiriman"].map((tab, i) => (
              <button key={tab} className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${i === 0 ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{produk.deskripsi}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Asal Produk</p>
                <p className="text-sm font-semibold text-gray-800">Desa Lengkong, Bojongsoang</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Min. Pembelian</p>
                <p className="text-sm font-semibold text-gray-800">1 pcs</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Penjual</p>
                <p className="text-sm font-semibold text-gray-800">{toko.pemilik}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Legalitas</p>
                <p className="text-sm font-semibold text-gray-800">{toko.legalitas.join(", ")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Produk Serupa */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Produk Serupa dari Desa</h2>
            <Link href="/produk" className="text-sm font-semibold" style={{ color: "var(--primary)" }}>Lihat Semua</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedFill.slice(0, 4).map((p) => (
              <Link key={p.id} href={`/produk/${p.slug}`} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div
                  className="aspect-square overflow-hidden"
                  style={{
                    backgroundImage: p.foto ? `url('${p.foto}')` : `linear-gradient(135deg, var(--primary-muted), #B7E4C7)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="p-3">
                  <p className="text-xs text-gray-400 truncate mb-0.5">{p.tokNama}</p>
                  <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1 group-hover:text-green-700">{p.nama}</h3>
                  <div className="flex items-center gap-0.5 mb-1">
                    <StarIcon size={3} />
                    <span className="text-xs text-gray-500">{p.rating}</span>
                  </div>
                  <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>Rp {p.harga.toLocaleString("id-ID")}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}