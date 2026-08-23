import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ background: "#F0FDF4" }}>
      <img src="/logo.png" alt="BUMDeSMart" className="h-16 w-auto mb-6 opacity-60" />
      <p className="text-8xl font-black mb-2" style={{ color: "#2D6A4F", letterSpacing: "-4px" }}>404</p>
      <h1 className="text-xl font-bold text-gray-800 mb-2">Halaman Tidak Ditemukan</h1>
      <p className="text-sm text-gray-500 max-w-xs mb-8">
        Ups! Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#2D6A4F" }}
        >
          Kembali ke Beranda
        </Link>
        <Link
          href="/produk"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border text-gray-700 hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#D1FAE5" }}
        >
          Lihat Produk
        </Link>
      </div>
    </div>
  );
}
