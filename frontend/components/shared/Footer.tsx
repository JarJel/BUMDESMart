import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ background: "var(--primary-dark)" }} className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs" style={{ background: "var(--primary-light)" }}>🌿</div>
              <span className="font-bold text-white">BumdesMart</span>
            </div>
            <p className="text-xs leading-relaxed text-green-200">
              Platform digital marketplace UMKM desa Indonesia. Menghubungkan produk lokal dengan pembeli di seluruh nusantara.
            </p>
          </div>

          {/* Produk Unggulan */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-green-300 mb-4">Produk Unggulan</p>
            <ul className="space-y-2.5 text-xs text-green-200">
              <li><Link href="/produk" className="hover:text-white transition-colors">Best Sellers</Link></li>
              <li><Link href="/produk?sort=terbaru" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/produk?kategori=Makanan+%26+Minuman" className="hover:text-white transition-colors">Organic Produce</Link></li>
            </ul>
          </div>

          {/* Mitra Desa */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-green-300 mb-4">Mitra Desa</p>
            <ul className="space-y-2.5 text-xs text-green-200">
              <li><Link href="/mitra" className="hover:text-white transition-colors">Merchant Portal</Link></li>
              <li><Link href="/mitra#join" className="hover:text-white transition-colors">Join as Vendor</Link></li>
              <li><Link href="/tentang" className="hover:text-white transition-colors">Village Logistics</Link></li>
            </ul>
          </div>

          {/* Bantuan */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-green-300 mb-4">Bantuan</p>
            <ul className="space-y-2.5 text-xs text-green-200">
              <li><Link href="/tentang" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
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