import Link from "next/link";

const sellerSteps = [
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
    desc: "Lengkapi data dan foto toko. Tim kami memverifikasi dalam 1–3 hari kerja.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    no: 3,
    title: "Upload Produk",
    desc: "Mulai upload produk dan langsung terima pesanan dari seluruh Indonesia!",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
];

const kurirSteps = [
  {
    no: 1,
    title: "Daftar Akun",
    desc: "Isi formulir dengan nama, nomor WhatsApp, dan pilih jenis kendaraanmu.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    no: 2,
    title: "Verifikasi Kurir",
    desc: "Siapkan SIM & STNK. Tim BUMDes akan memverifikasi datamu dalam 1–2 hari.",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    no: 3,
    title: "Mulai Antar",
    desc: "Aktifkan status online di app, terima order, dan langsung cari cuan!",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
      </svg>
    ),
  },
];

const testimonials = [
  {
    nama: "Ibu Siti Rahayu",
    peran: "Penjual Keripik, Jawa Barat",
    initial: "S",
    kutipan: "Dulu saya hanya berjualan di pasar lokal. Sejak bergabung di BUMDESMARTNUKITA, produk saya dikenal sampai ke luar kota. Penjualan naik 3 kali lipat dalam 5 bulan pertama.",
  },
  {
    nama: "Pak Budi Santoso",
    peran: "Pengrajin Anyaman, Jawa Tengah",
    initial: "B",
    kutipan: "Saya dulu tidak mengerti teknologi. Tapi tim BUMDESMARTNUKITA sangat sabar membantu saya setup toko online. Sekarang sudah bisa terima pesanan sendiri dari HP.",
  },
];

export default function MitraPage() {
  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh" }}>

      {/* ===== HERO — DUA JALUR ===== */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center mb-10">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
              style={{ background: "var(--primary-muted)", color: "var(--primary)" }}
            >
              Program Unggulan Desa Digital
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              Bergabung bersama <span style={{ color: "var(--primary)" }}>BUMDESMARTNUKITA</span>
            </h1>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              Pilih peran yang paling sesuai denganmu. Dua cara berbeda untuk ikut membangun ekosistem desa digital.
            </p>
          </div>

          {/* Dua kartu pilihan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {/* Merchant */}
            <div className="rounded-2xl border-2 p-7 bg-white flex flex-col gap-5 hover:shadow-md transition-shadow" style={{ borderColor: "var(--primary)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--primary-muted)" }}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--primary)" }}>Merchant / Penjual</p>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Jual Produk UMKM</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Buka toko online gratis, jangkau pembeli lebih luas, dan kelola pesanan dari satu dashboard. Cocok untuk pelaku UMKM desa.
                </p>
              </div>
              <ul className="space-y-2">
                {["Gratis daftar & tanpa komisi", "Dashboard kelola pesanan mudah", "Pembayaran langsung ke rekening"].map(b => (
                  <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--primary-muted)" }}>
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: "var(--primary)" }}>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href="/daftar/seller"
                className="mt-auto inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-all"
                style={{ background: "var(--primary)" }}
              >
                Daftar Jadi Merchant — Gratis
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Pengantar */}
            <div className="rounded-2xl border-2 p-7 bg-white flex flex-col gap-5 hover:shadow-md transition-shadow" style={{ borderColor: "var(--accent)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#FEF3E8" }}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--accent-dark)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--accent-dark)" }}>Mitra Pengantar</p>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Antar Produk, Cari Cuan</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Bantu produk UMKM desa sampai ke tangan pembeli. Jadwal fleksibel, bayaran per antar, mulai dari kendaraan yang sudah kamu punya.
                </p>
              </div>
              <ul className="space-y-2">
                {["Penghasilan harian per pengiriman", "Jam kerja bebas, sesuai jadwalmu", "Mitra resmi BUMDes terdaftar"].map(b => (
                  <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FEF3E8" }}>
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" style={{ color: "var(--accent-dark)" }}>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href="/daftar/kurir"
                className="mt-auto inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-all"
                style={{ background: "var(--accent-dark)" }}
              >
                Daftar Jadi Pengantar
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LANGKAH — MERCHANT ===== */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--primary-muted)" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cara Daftar sebagai Merchant</h2>
              <p className="text-sm text-gray-500">Proses cepat, hanya butuh waktu kurang dari 10 menit</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {sellerSteps.map((s) => (
              <div key={s.no} className="bg-white rounded-2xl border border-gray-100 p-7 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm" style={{ background: "var(--primary)" }}>
                  {s.icon}
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--primary-light)" }}>Langkah {s.no}</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Kenapa Pilih BUMDESMARTNUKITA?</h2>
            <p className="text-sm text-gray-500">Platform yang dirancang khusus untuk UMKM desa</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: "Gratis Selamanya", desc: "Tidak ada biaya pendaftaran maupun komisi penjualan" },
              { icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, title: "Kelola Mudah", desc: "Dashboard sederhana, cocok untuk pemula sekalipun" },
              { icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>, title: "Pembayaran Aman", desc: "Uang langsung masuk rekening Anda via Midtrans" },
              { icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>, title: "Promosi Aktif", desc: "Tim kami aktif mempromosikan produk mitra di media sosial" },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-3 mx-auto">{f.icon}</div>
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Suara dari Desa</h2>
          <p className="text-sm text-gray-500 mb-8">Kisah sukses mitra yang telah bertransformasi bersama kami</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {testimonials.map((t) => (
              <div key={t.nama} className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
                <svg className="w-8 h-8 mb-4 opacity-20" fill="currentColor" viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-sm text-gray-700 leading-relaxed mb-5 italic">{t.kutipan}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0" style={{ background: "var(--primary)" }}>
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

      {/* ===== LANGKAH — PENGANTAR/KURIR ===== */}
      <section className="py-16 px-4" style={{ background: "#FEF3E8" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#FDDCCC" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--accent-dark)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cara Daftar sebagai Pengantar</h2>
              <p className="text-sm text-gray-500">Mulai antar dalam 2 hari setelah verifikasi selesai</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {kurirSteps.map((s) => (
              <div key={s.no} className="bg-white rounded-2xl border border-orange-100 p-7 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm" style={{ background: "var(--accent-dark)" }}>
                  {s.icon}
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>Langkah {s.no}</p>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Keuntungan Pengantar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Penghasilan Harian", desc: "Bayaran per antar langsung masuk ke dompet digitalmu." },
              { label: "Jam Kerja Bebas", desc: "Online saat kamu siap. Tidak ada minimum jam kerja." },
              { label: "Kendaraan Sendiri", desc: "Motor atau mobil yang kamu punya sudah cukup untuk mulai." },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-2xl border border-orange-100 p-5">
                <p className="font-semibold text-gray-900 text-sm mb-1">{k.label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{k.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/daftar/kurir"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-all"
              style={{ background: "var(--accent-dark)" }}
            >
              Daftar Jadi Pengantar Sekarang
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
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
            Pilih jalurmu dan mulai berkontribusi untuk ekosistem UMKM desa bersama BUMDESMARTNUKITA.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/daftar/seller" className="px-7 py-3 rounded-xl font-semibold text-sm bg-white hover:bg-gray-50 transition-colors" style={{ color: "var(--primary-dark)" }}>
              Daftar sebagai Merchant
            </Link>
            <Link href="/daftar/kurir" className="px-7 py-3 rounded-xl font-semibold text-sm border border-white/40 text-white hover:bg-white/10 transition-colors">
              Daftar sebagai Pengantar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
