import Link from "next/link";

const prinsip = [
  {
    title: "Integritas",
    desc: "Kami membangun ekosistem yang transparan dan terpercaya antara penjual, pembeli, dan BUMDes.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Pemberdayaan",
    desc: "Mendorong UMKM lokal berkembang melalui teknologi dan akses pasar yang lebih luas.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Kualitas Lokal",
    desc: "Mengangkat produk-produk berkualitas tinggi dari desa-desa Indonesia ke seluruh penjuru nusantara.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
];

const stats = [
  { angka: "9+", label: "UMKM Mitra Aktif" },
  { angka: "25+", label: "Produk Terdaftar" },
  { angka: "2026", label: "Tahun Berdiri" },
];

export default function TentangPage() {
  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh" }}>

      {/* ===== HERO ===== */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest mb-4 block" style={{ color: "var(--primary-light)" }}>
              Tentang Kami
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Membangun Ekonomi Desa,<br />
              <span style={{ color: "var(--primary)" }}>Menghubungkan Harapan</span>
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-7 max-w-md">
              BumdesMart adalah platform digital marketplace UMKM desa yang diinisiasi oleh BUMDes bersama program Hibah PkM. Kami hadir untuk menghubungkan pengrajin, petani, dan pelaku usaha desa dengan pasar yang lebih luas di seluruh Indonesia.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/produk"
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-colors"
                style={{ background: "var(--primary)" }}
              >
                Belanja Sekarang
              </Link>
              <Link
                href="/mitra"
                className="px-5 py-2.5 rounded-xl font-semibold text-sm border-2 transition-colors hover:bg-gray-50"
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                Jadi Mitra
              </Link>
            </div>
          </div>

          {/* Foto hero - wanita pengrajin */}
          <div
            className="w-full h-72 md:h-96 rounded-2xl overflow-hidden"
            style={{
              backgroundImage: "url('/images/tentang-hero.jpg'), linear-gradient(135deg, var(--primary-dark), var(--primary))",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </div>
      </section>

      {/* ===== VISI & MISI ===== */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Visi & Misi Kami</h2>
            <p className="text-sm text-gray-500">Membangun masa depan desa yang mandiri dan sejahtera secara digital</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--primary-muted)" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Visi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Menjadi platform digital UMKM terpercaya yang mendorong kemandirian ekonomi desa dan meningkatkan kesejahteraan masyarakat desa di seluruh Indonesia melalui teknologi.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--primary-muted)" }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-lg">Misi</h3>
              <ul className="text-sm text-gray-600 space-y-2.5">
                {[
                  "Memfasilitasi UMKM desa dalam memasarkan produk secara digital",
                  "Memberikan akses transaksi yang aman dan transparan",
                  "Mendukung pertumbuhan ekonomi lokal yang berkelanjutan",
                ].map((m) => (
                  <li key={m} className="flex gap-2.5">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: "var(--primary)" }}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRINSIP ===== */}
      <section className="py-16 px-4" style={{ background: "#F4F7F5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Prinsip yang Menggerakkan Kami</h2>
            <p className="text-sm text-gray-500">Nilai-nilai yang menjadi landasan setiap langkah BumdesMart</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {prinsip.map((p) => (
              <div key={p.title} className="bg-white rounded-2xl border border-gray-100 p-7 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--primary-muted)" }}>
                  {p.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CERITA BUMDESMART ===== */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest mb-3 block" style={{ color: "var(--primary-light)" }}>
                Latar Belakang
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cerita BumdesMart</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                BumdesMart lahir dari keprihatinan akan terbatasnya akses pasar bagi UMKM di Desa. Banyak produk berkualitas yang tidak dikenal luas karena keterbatasan infrastruktur digital.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Dengan dukungan program Hibah PkM dari kampus, tim kami mengembangkan platform ini untuk menjadi jembatan antara produk desa dengan pembeli di manapun berada.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed mb-8">
                Setiap transaksi di BumdesMart berarti mendukung langsung kehidupan keluarga petani, pengrajin, dan pelaku usaha lokal di Desa.
              </p>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                {stats.map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl font-bold mb-1" style={{ color: "var(--primary)" }}>{s.angka}</p>
                    <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Foto sawah */}
            <div
              className="w-full h-80 md:h-96 rounded-2xl overflow-hidden"
              style={{
                backgroundImage: "url('/images/tentang-sawah.jpg'), url('/images/hero-bg.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>
        </div>
      </section>

      {/* ===== CTA BAWAH ===== */}
      <section
        className="py-16 px-4"
        style={{
          backgroundImage: "linear-gradient(rgba(20,50,35,0.88), rgba(20,50,35,0.92)), url('/images/tentang-sawah.jpg'), url('/images/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-400 mb-3">Platform UMKM Desa Indonesia</p>
          <h2 className="text-2xl font-bold text-white mb-4">Siap Memberdayakan Desa Hari Ini?</h2>
          <p className="text-green-200 text-sm mb-8 leading-relaxed">
            Bergabunglah bersama ribuan pembeli dan UMKM desa di seluruh Indonesia yang telah merasakan manfaat BumdesMart.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/daftar" className="px-8 py-3 rounded-xl font-semibold text-sm bg-white hover:bg-gray-50 transition-colors" style={{ color: "var(--primary-dark)" }}>
              Daftar sebagai Mitra
            </Link>
            <Link href="/produk" className="px-8 py-3 rounded-xl font-semibold text-sm border border-white/40 text-white hover:bg-white/10 transition-colors">
              Mulai Belanja
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}