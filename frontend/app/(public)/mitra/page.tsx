import Link from "next/link";

const steps = [
  {
    no: 1,
    title: "Daftar Akun",
    desc: "Isi formulir pendaftaran dengan nama, email, dan nomor WhatsApp aktif.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    no: 2,
    title: "Verifikasi Toko",
    desc: "Lengkapi data dan foto toko Anda. Tim kami akan memverifikasi dalam 1-3 hari kerja setelah data Anda masuk.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    no: 3,
    title: "Upload Produk",
    desc: "Mulai upload produk Anda dan langsung terima pesanan dari seluruh Indonesia!",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
];

const benefits = [
  "Tanpa biaya pendaftaran & iuran bulanan",
  "Dukungan penuh tim lapangan BumdesMart",
  "Dashboard kelola pesanan real-time yang mudah",
  "Pembayaran langsung ke rekening Anda via Xendit",
];

const testimonials = [
  {
    nama: "Ibu Siti Rahayu",
    peran: "Penjual Keripik, Jawa Barat",
    initial: "S",
    rating: 5,
    kutipan: "Dulu saya hanya berjualan di pasar lokal. Sejak bergabung di BumdesMart, produk saya dikenal sampai ke luar kota. Penjualan naik 3 kali lipat dalam 5 bulan pertama.",
  },
  {
    nama: "Pak Budi Santoso",
    peran: "Pengrajin Anyaman, Jawa Tengah",
    initial: "B",
    rating: 5,
    kutipan: "Saya dulu tidak mengerti teknologi. Tapi tim BumdesMart sangat sabar membantu saya setup toko online. Sekarang sudah bisa terima pesanan sendiri dari HP.",
  },
];

export default function MitraPage() {
  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh" }}>
      {/* ===== HERO ===== */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Teks kiri */}
          <div>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-5"
              style={{ background: "var(--primary-muted)", color: "var(--primary)" }}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2s-2-5-8-5c-4 0-7 2-7 2s4 2 8 4c-1.5 1-3 3-3 5s1.5 4 5 4c2 0 3.5-1 4-2" />
              </svg>
              Program Unggulan Desa Digital
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Bergabung sebagai<br />
              Merchant <span style={{ color: "var(--primary)" }}>BumdesMart</span>
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-5 max-w-md">
              Jangkau lebih banyak pembeli di seluruh Indonesia. Kelola toko dengan mudah. Dari desa, untuk semua.
            </p>
            <ul className="space-y-2.5 mb-7">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--primary-muted)" }}>
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: "var(--primary)" }}>
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/daftar"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-all shadow-md"
                style={{ background: "var(--primary)" }}
              >
                Daftar Sekarang — Gratis
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="/toko" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border-2 hover:bg-gray-50 transition-colors" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                Lihat Mitra Kami
              </Link>
            </div>
          </div>

          {/* Foto kanan */}
          <div
            className="w-full h-72 md:h-80 rounded-2xl overflow-hidden"
            style={{
              backgroundImage: "url('/images/mitra-hero.jpg'), linear-gradient(135deg, var(--primary-dark), var(--primary))",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </div>
      </section>

      {/* ===== LANGKAH MUDAH ===== */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Langkah Mudah Bergabung</h2>
            <p className="text-sm text-gray-500">Proses cepat, hanya butuh waktu kurang dari 10 menit</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            {/* Garis penghubung */}
            <div className="hidden sm:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-gray-100 z-0" />
            {steps.map((s, i) => (
              <div key={s.no} className="bg-white rounded-2xl border border-gray-100 p-7 text-center relative z-10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
                  style={{ background: "var(--primary)" }}
                >
                  {s.icon}
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--primary-light)" }}>
                  Langkah {s.no}
                </p>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== KENAPA BUMDESMART ===== */}
      <section className="py-16 px-4" style={{ background: "#F4F7F5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Kenapa Pilih BumdesMart?</h2>
            <p className="text-sm text-gray-500">Platform yang dirancang khusus untuk UMKM desa</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "💸", title: "Gratis Selamanya", desc: "Tidak ada biaya pendaftaran maupun komisi penjualan" },
              { icon: "📦", title: "Kelola Mudah", desc: "Dashboard sederhana, cocok untuk pemula sekalipun" },
              { icon: "🔒", title: "Pembayaran Aman", desc: "Uang langsung masuk rekening Anda via Xendit" },
              { icon: "📣", title: "Promosi Aktif", desc: "Tim kami aktif mempromosikan produk mitra di media sosial" },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SUARA DARI DESA ===== */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">Suara dari Desa</h2>
            <Link href="/toko" className="text-sm font-semibold flex items-center gap-1" style={{ color: "var(--primary)" }}>
              Lihat Semua Mitra
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mb-8">Kisah sukses mitra yang telah bertransformasi bersama kami</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {testimonials.map((t) => (
              <div key={t.nama} className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
                {/* Quote icon */}
                <svg className="w-8 h-8 mb-4 opacity-20" fill="currentColor" viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-sm text-gray-700 leading-relaxed mb-5 italic">{t.kutipan}</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                    style={{ background: "var(--primary)" }}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.nama}</p>
                    <p className="text-xs text-gray-500">{t.peran}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} className="w-3.5 h-3.5 fill-yellow-400" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BAWAH ===== */}
      <section
        className="py-16 px-4"
        style={{
          backgroundImage: "linear-gradient(rgba(20,50,35,0.90), rgba(20,50,35,0.90)), url('/images/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Siap Bergabung?</h2>
          <p className="text-green-200 text-sm mb-7 leading-relaxed">
            Daftarkan usaha Anda sekarang dan mulai berjualan di BumdesMart. Gratis, mudah, dan terpercaya.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/daftar" className="px-8 py-3 rounded-xl font-semibold text-sm bg-white hover:bg-gray-50 transition-colors" style={{ color: "var(--primary-dark)" }}>
              Daftar Sekarang — Gratis
            </Link>
            <Link href="/tentang" className="px-8 py-3 rounded-xl font-semibold text-sm border border-white/40 text-white hover:bg-white/10 transition-colors">
              Pelajari Lebih Lanjut
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}