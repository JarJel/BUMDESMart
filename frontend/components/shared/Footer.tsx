import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ background: "var(--primary-dark)" }} className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="BUMDESmart" className="h-9 w-auto" />
              <span className="font-bold text-white text-sm">BUMDESmart</span>
            </div>
            <p className="text-xs leading-relaxed text-green-200">
              Platform digital marketplace UMKM desa Indonesia. Menghubungkan produk lokal dengan pembeli di seluruh nusantara.
            </p>
          </div>

          {/* Produk Unggulan */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-green-300 mb-4">Produk Unggulan</p>
            <ul className="space-y-2.5 text-xs text-green-200">
              <li><Link href="/produk" className="hover:text-white transition-colors">Terlaris</Link></li>
              <li><Link href="/produk?sort=terbaru" className="hover:text-white transition-colors">Produk Terbaru</Link></li>
              <li><Link href="/produk?kategori=Makanan+%26+Minuman" className="hover:text-white transition-colors">Makanan & Minuman</Link></li>
            </ul>
          </div>

          {/* Mitra Desa */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-green-300 mb-4">Mitra Desa</p>
            <ul className="space-y-2.5 text-xs text-green-200">
              <li><Link href="/mitra" className="hover:text-white transition-colors">Portal Mitra</Link></li>
              <li><Link href="/daftar/seller" className="hover:text-white transition-colors">Daftar sebagai Mitra</Link></li>
              <li><Link href="/tentang" className="hover:text-white transition-colors">Logistik Desa</Link></li>
            </ul>
          </div>

          {/* Bantuan */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-green-300 mb-4">Bantuan</p>
            <ul className="space-y-2.5 text-xs text-green-200">
              <li><Link href="/tentang" className="hover:text-white transition-colors">Pusat Bantuan</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Kebijakan Pengiriman</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-green-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-green-400">© 2026 BumdesMart</p>
          <p className="text-xs text-green-500">Program Hibah PkM Unggulan Desa Digital</p>
        </div>
      </div>
    </footer>
  );
}