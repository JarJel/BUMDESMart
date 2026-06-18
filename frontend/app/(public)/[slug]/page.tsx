import { notFound } from "next/navigation";
import Link from "next/link";
import { tokoList } from "@/lib/data/dummy";

function StarIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export async function generateStaticParams() {
  return tokoList.map((t) => ({ slug: t.slug }));
}

export default async function TokoProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const toko = tokoList.find((t) => t.slug === slug);
  if (!toko) return notFound();

  const starsArr = [1, 2, 3, 4, 5];

  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh" }}>
      {/* Banner Header */}
      <div
        className="relative h-64 md:h-80 overflow-hidden"
        style={{
          backgroundImage: toko.foto
            ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.65)), url('${toko.foto}')`
            : `linear-gradient(135deg, var(--primary-dark), var(--primary))`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Breadcrumb */}
        <div className="absolute top-5 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <Link href="/" className="hover:text-white">Beranda</Link>
            <span>/</span>
            <Link href="/toko" className="hover:text-white">Semua Toko</Link>
            <span>/</span>
            <span className="text-white">{toko.nama}</span>
          </div>
        </div>

        {/* Info overlay bawah */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-16 pb-6 px-4">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 flex items-end gap-4">
            {/* Avatar toko */}
            <div className="w-16 h-16 rounded-2xl border-2 border-white/30 overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{toko.nama}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <div className="flex items-center gap-1">
                  {starsArr.map(s => <StarIcon key={s} className={`w-3.5 h-3.5 ${s <= Math.round(toko.rating) ? "text-yellow-400" : "text-white/30"}`} />)}
                  <span className="text-white/80 text-xs ml-1">{toko.rating}</span>
                </div>
                <span className="text-white/60 text-xs">|</span>
                <span className="text-white/80 text-xs">{toko.totalPenjualan.toLocaleString("id")} terjual</span>
                <span className="text-white/60 text-xs">|</span>
                <span className="text-white/80 text-xs">{toko.totalProduk} produk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-7">
          {/* Sidebar info */}
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            {/* Info toko */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900">Info Toko</h2>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <div>
                    <p className="text-xs text-gray-400">Pemilik</p>
                    <p className="text-gray-800 font-medium">{toko.pemilik}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <div>
                    <p className="text-xs text-gray-400">Lokasi</p>
                    <p className="text-gray-800">{toko.lokasi}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  <div>
                    <p className="text-xs text-gray-400">Kategori</p>
                    <p className="text-gray-800">{toko.kategori}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legalitas */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Legalitas</h2>
              <div className="flex flex-wrap gap-2">
                {toko.legalitas.map(l => (
                  <span key={l} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "var(--primary-muted)", color: "var(--primary)" }}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* Deskripsi */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Tentang Toko</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{toko.deskripsi}</p>
            </div>

            {/* CTA pesan */}
            <button className="w-full py-3 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
              Kirim Pesan ke Toko
            </button>
          </aside>

          {/* Produk grid */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Produk dari {toko.nama}</h2>
              <span className="text-xs text-gray-400">{toko.produk.length} produk</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {toko.produk.map((produk) => (
                <Link
                  key={produk.id}
                  href={`/produk/${produk.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Foto produk */}
                  <div
                    className="h-40 relative overflow-hidden"
                    style={{
                      backgroundImage: produk.foto
                        ? `url('${produk.foto}')`
                        : `linear-gradient(135deg, var(--primary-muted), #B7E4C7)`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {produk.stok === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold px-3 py-1 bg-red-500 rounded-full">Stok Habis</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                      <svg className="w-2.5 h-2.5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <span className="text-white text-xs font-medium">{produk.rating}</span>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="text-xs text-gray-500 mb-1 truncate">{produk.kategori}</p>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-green-700 transition-colors leading-tight">
                      {produk.nama}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                        Rp {produk.harga.toLocaleString("id")}
                      </p>
                      <span className="text-xs text-gray-400">{produk.terjual} terjual</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}