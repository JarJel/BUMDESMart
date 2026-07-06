export const tokoList = [
  {
    id: 1,
    slug: "manisan-bu-lilis",
    nama: "Manisan & Catering Bu Lilis",
    pemilik: "Lilis Romlah",
    kategori: "Makanan & Minuman",
    deskripsi: "Manisan cangkaleng tradisional dan layanan catering untuk acara keluarga dan hajatan. Sudah berdiri bertahun-tahun dengan pelanggan setia.",
    lokasi: "RT 02/RW 07, Desa Lengkong",
    foto: "/images/manisan-kolang1.jpg",
    rating: 4.9,
    totalPenjualan: 980,
    totalProduk: 3,
    bergabungSejak: "2026-02-01",
    status: "aktif",
    legalitas: ["NIB", "Sertifikasi Halal", "PIRT"],
    dokumen: [
      { type: 'nib',     nomor: '9120706290001', tanggalTerbit: '2026-02-01', berlakuHingga: null },
      { type: 'halal',   nomor: 'ID20260201001', tanggalTerbit: '2026-02-15', berlakuHingga: '2028-02-15' },
      { type: 'spp_irt', nomor: '204/3208/02/2026', tanggalTerbit: '2026-03-01', berlakuHingga: '2031-03-01', cakupan: 'Manisan & produk kering' },
    ] as Dokumen[],
    produk: [
      { id: 1, slug: "manisan-cangkaleng-250gr", nama: "Manisan Cangkaleng 250gr", harga: 25000, stok: 60, foto: "/images/manisan-kolang2.jpg", rating: 5.0, terjual: 280, kategori: "Makanan & Minuman", deskripsi: "Manisan cangkaleng asli Desa Lengkong, dibuat dari buah segar pilihan tanpa pewarna.", variasi: ["250gr", "500gr", "1kg"] },
      { id: 2, slug: "manisan-cangkaleng-500gr", nama: "Manisan Cangkaleng 500gr", harga: 45000, stok: 40, foto: "/images/manisan-kolang1.jpg", rating: 4.9, terjual: 190, kategori: "Makanan & Minuman", deskripsi: "Manisan cangkaleng ukuran jumbo, cocok untuk oleh-oleh dan hampers.", variasi: ["500gr", "1kg", "2kg"] },
      { id: 3, slug: "paket-catering-10-porsi", nama: "Paket Catering 10 Porsi", harga: 150000, stok: 20, foto: "/images/toko-manisan.jpg", rating: 4.8, terjual: 85, kategori: "Jasa", deskripsi: "Paket catering 10 porsi nasi+lauk pilihan, cocok untuk arisan dan acara kecil." },
    ],
  },
  {
    id: 2,
    slug: "kedai-maju",
    nama: "Kedai Maju",
    pemilik: "Leny Nurkellany",
    kategori: "Makanan & Minuman",
    deskripsi: "Kacang daruk dan kacang bawang daun jeruk buatan sendiri dengan resep turun-temurun. Renyah, gurih, dan harum daun jeruk.",
    lokasi: "Gg. ML Tobing RT 03/RW 05, Desa Lengkong",
    foto: "/images/kedai-kacang-pedas.jpg",
    rating: 4.8,
    totalPenjualan: 870,
    totalProduk: 2,
    bergabungSejak: "2026-02-15",
    status: "aktif",
    legalitas: ["NIB", "Sertifikasi Halal"],
    dokumen: [
      { type: 'nib',   nomor: '9120706290002', tanggalTerbit: '2026-02-15', berlakuHingga: null },
      { type: 'halal', nomor: 'ID20260215002', tanggalTerbit: '2026-03-01', berlakuHingga: '2028-03-01' },
    ] as Dokumen[],
    produk: [
      { id: 4, slug: "kacang-daruk-original-200gr", nama: "Kacang Daruk Original 200gr", harga: 18000, stok: 120, foto: "/images/kedai-kacang-goreng.jpg", rating: 4.8, terjual: 340, kategori: "Makanan & Minuman", deskripsi: "Kacang daruk renyah dengan bumbu original, resep turun-temurun khas Desa Lengkong.", variasi: ["Original", "Pedas", "Extra Pedas", "BBQ"] },
      { id: 5, slug: "kacang-bawang-daun-jeruk-200gr", nama: "Kacang Bawang Daun Jeruk 200gr", harga: 20000, stok: 90, foto: "/images/kedai-kacang-pedas.jpg", rating: 4.7, terjual: 280, kategori: "Makanan & Minuman", deskripsi: "Perpaduan kacang bawang dengan aroma daun jeruk segar, gurih dan harum.", variasi: ["200gr", "350gr", "500gr"] },
    ],
  },
  {
    id: 3,
    slug: "keripik-kentang-mustofa",
    nama: "Keripik Kentang Mustofa 3 Boy",
    pemilik: "Tuti Wargini",
    kategori: "Makanan & Minuman",
    deskripsi: "Keripik kentang renyah dengan berbagai varian rasa. Produk unggulan dengan NIB, PIRT, Halal, dan HKI terdaftar.",
    lokasi: "D GPA Blok A11/20 RT 05/RW 13, Desa Lengkong",
    foto: "/images/keripik-balado.jpg",
    rating: 4.7,
    totalPenjualan: 760,
    totalProduk: 3,
    bergabungSejak: "2026-03-20",
    status: "aktif",
    legalitas: ["NIB", "Sertifikasi Halal", "PIRT", "HKI"],
    dokumen: [
      { type: 'nib',     nomor: '9120706290003', tanggalTerbit: '2026-03-20', berlakuHingga: null },
      { type: 'halal',   nomor: 'ID20260320003', tanggalTerbit: '2026-04-01', berlakuHingga: '2028-04-01' },
      { type: 'spp_irt', nomor: '204/3208/04/2026', tanggalTerbit: '2026-04-10', berlakuHingga: '2031-04-10', cakupan: 'Keripik kentang & snack kering' },
      { type: 'haki',    nomor: 'IDM000984301', tanggalTerbit: '2026-05-01', berlakuHingga: '2036-05-01', cakupan: 'Merek "Mustofa 3 Boy"' },
    ] as Dokumen[],
    produk: [
      { id: 6, slug: "keripik-kentang-original-150gr", nama: "Keripik Kentang Original 150gr", harga: 16000, stok: 200, foto: "/images/keripik-original.jpg", rating: 4.7, terjual: 220, kategori: "Makanan & Minuman", deskripsi: "Keripik kentang renyah rasa original, tanpa MSG dan pengawet." },
      { id: 7, slug: "keripik-kentang-balado-150gr", nama: "Keripik Kentang Balado 150gr", harga: 16000, stok: 180, foto: "/images/keripik-balado.jpg", rating: 4.8, terjual: 210, kategori: "Makanan & Minuman", deskripsi: "Keripik kentang dengan bumbu balado pedas manis, bikin ketagihan." },
      { id: 8, slug: "keripik-kentang-bbq-150gr", nama: "Keripik Kentang BBQ 150gr", harga: 17000, stok: 150, foto: "/images/keripik-bumbu.jpg", rating: 4.6, terjual: 180, kategori: "Makanan & Minuman", deskripsi: "Keripik kentang dengan bumbu BBQ smoky, renyah dan lezat." },
    ],
  },
  {
    id: 4,
    slug: "momeera-bakery",
    nama: "MomeeRa Bakery",
    pemilik: "Rori Handayani",
    kategori: "Makanan & Minuman",
    deskripsi: "Roti, bakery, dan pastri segar dipanggang setiap hari. Cocok untuk sarapan dan hampers. Lebih dari 100 transaksi per hari.",
    lokasi: "Komplek GBA B6/2, Desa Lengkong",
    foto: "/images/bakery-display.jpg",
    rating: 4.9,
    totalPenjualan: 1240,
    totalProduk: 3,
    bergabungSejak: "2026-03-01",
    status: "aktif",
    legalitas: ["NIB", "Sertifikasi Halal", "PIRT"],
    dokumen: [
      { type: 'nib',     nomor: '9120706290004', tanggalTerbit: '2026-03-01', berlakuHingga: null },
      { type: 'halal',   nomor: 'ID20260301004', tanggalTerbit: '2026-03-15', berlakuHingga: '2028-03-15' },
      { type: 'spp_irt', nomor: '204/3208/03/2026', tanggalTerbit: '2026-03-20', berlakuHingga: '2031-03-20', cakupan: 'Roti, bakery & pastri kemasan' },
    ] as Dokumen[],
    produk: [
      { id: 9, slug: "roti-tawar-gandum-loaf", nama: "Roti Tawar Gandum Loaf", harga: 22000, stok: 30, foto: "/images/bakery-roti-gandum.jpg", rating: 5.0, terjual: 210, kategori: "Makanan & Minuman", deskripsi: "Roti tawar gandum segar dipanggang setiap pagi, bebas pengawet.", variasi: ["Gandum", "Tawar", "Susu", "Kismis"] },
      { id: 10, slug: "croissant-butter-3pcs", nama: "Croissant Butter (3 pcs)", harga: 35000, stok: 20, foto: "/images/bakery-croissant.jpg", rating: 4.9, terjual: 185, kategori: "Makanan & Minuman", deskripsi: "Croissant mentega renyah di luar, lembut di dalam. Dipanggang segar tiap pagi.", variasi: ["Plain", "Cokelat", "Keju"] },
      { id: 11, slug: "brownies-panggang-20x20", nama: "Brownies Panggang 20x20", harga: 55000, stok: 15, foto: "/images/bakery-brownies.jpg", rating: 4.8, terjual: 140, kategori: "Makanan & Minuman", deskripsi: "Brownies panggang ukuran 20x20cm, cokelat pekat dan lembut, cocok untuk hampers.", variasi: ["20×20 Original", "20×20 Keju", "25×25 Original"] },
    ],
  },
  {
    id: 5,
    slug: "ayam-geprek-mashita",
    nama: "Ayam Geprek Mashita",
    pemilik: "Reni Handayani",
    kategori: "Makanan & Minuman",
    deskripsi: "Ayam geprek level 1-10, tersedia paket makan siang dan takeaway. Buka setiap hari. Lebih dari 30 transaksi per hari.",
    lokasi: "Jl. Saung Bandrek, depan Sky Mart, Desa Lengkong",
    foto: "/images/ayam-geprek-1.jpg",
    rating: 4.7,
    totalPenjualan: 1100,
    totalProduk: 3,
    bergabungSejak: "2026-04-01",
    status: "aktif",
    legalitas: ["NIB", "Sertifikasi Halal"],
    dokumen: [
      { type: 'nib',   nomor: '9120706290005', tanggalTerbit: '2026-04-01', berlakuHingga: null },
      { type: 'halal', nomor: 'ID20260401005', tanggalTerbit: '2026-04-15', berlakuHingga: '2028-04-15' },
      { type: 'slhs',  nomor: 'SLHS/3208/2026/001', tanggalTerbit: '2026-04-20', berlakuHingga: '2027-04-20', cakupan: 'Warung makan ayam geprek' },
    ] as Dokumen[],
    produk: [
      { id: 12, slug: "ayam-geprek-nasi-level-1-5", nama: "Ayam Geprek + Nasi Level 1-5", harga: 15000, stok: 50, foto: "/images/ayam-geprek-1.jpg", rating: 4.7, terjual: 380, kategori: "Makanan & Minuman", deskripsi: "Paket ayam geprek + nasi dengan pilihan level pedas 1-5, porsi kenyang." },
      { id: 13, slug: "ayam-geprek-level-6-10", nama: "Ayam Geprek Level 6-10", harga: 17000, stok: 50, foto: "/images/ayam-geprek-2.jpg", rating: 4.6, terjual: 220, kategori: "Makanan & Minuman", deskripsi: "Buat yang suka tantangan! Level pedas 6-10 dijamin nagih." },
      { id: 14, slug: "paket-ayam-geprek-keluarga", nama: "Paket Keluarga (4 pcs)", harga: 55000, stok: 20, foto: "/images/ayam-geprek-1.jpg", rating: 4.8, terjual: 95, kategori: "Makanan & Minuman", deskripsi: "Paket hemat 4 ayam geprek + 4 nasi + 4 teh manis, cocok makan bareng keluarga." },
    ],
  },
  {
    id: 6,
    slug: "keripik-kacang-bu-lisma",
    nama: "Keripik & Asinan Bu Lisma",
    pemilik: "Lisma Yanti",
    kategori: "Makanan & Minuman",
    deskripsi: "Keripik kacang renyah, asinan segar, dan telor asin berkualitas. Produk homemade dengan bahan lokal pilihan.",
    lokasi: "RT 04/RW 06, Desa Lengkong",
    foto: "/images/toko-keripik.jpg",
    rating: 4.6,
    totalPenjualan: 520,
    totalProduk: 2,
    bergabungSejak: "2026-04-10",
    status: "aktif",
    legalitas: ["NIB", "Sertifikasi Halal", "HKI"],
    dokumen: [
      { type: 'nib',   nomor: '9120706290006', tanggalTerbit: '2026-04-10', berlakuHingga: null },
      { type: 'halal', nomor: 'ID20260410006', tanggalTerbit: '2026-04-25', berlakuHingga: '2028-04-25' },
      { type: 'haki',  nomor: 'IDM000984302', tanggalTerbit: '2026-05-10', berlakuHingga: '2036-05-10', cakupan: 'Merek "Bu Lisma"' },
    ] as Dokumen[],
    produk: [
      { id: 15, slug: "keripik-kacang-original-200gr", nama: "Keripik Kacang Original 200gr", harga: 15000, stok: 100, foto: "/images/toko-keripik.jpg", rating: 4.6, terjual: 200, kategori: "Makanan & Minuman", deskripsi: "Keripik kacang renyah dengan bumbu original, tanpa pengawet." },
      { id: 16, slug: "telor-asin-6pcs", nama: "Telor Asin (6 pcs)", harga: 18000, stok: 60, foto: "/images/toko-keripik.jpg", rating: 4.7, terjual: 150, kategori: "Makanan & Minuman", deskripsi: "Telor asin masir kuning kemerahan, proses tradisional 2 minggu." },
    ],
  },
  {
    id: 7,
    slug: "frozen-food-bu-eva",
    nama: "Frozen Food Bu Eva",
    pemilik: "Ibu Eva",
    kategori: "Makanan & Minuman",
    deskripsi: "Aneka frozen food homemade: chicken egroll, ekado, kaniroll, ekado keju lumer, spring cheese roll. Halal dan tanpa bahan berbahaya.",
    lokasi: "D'Amarta Residensi Blok E15/2, Desa Lengkong",
    foto: "/images/frozen-ekado.jpg",
    rating: 4.7,
    totalPenjualan: 480,
    totalProduk: 3,
    bergabungSejak: "2026-05-01",
    status: "aktif",
    legalitas: ["NIB", "Sertifikasi Halal"],
    dokumen: [
      { type: 'nib',     nomor: '9120706290007', tanggalTerbit: '2026-05-01', berlakuHingga: null },
      { type: 'halal',   nomor: 'ID20260501007', tanggalTerbit: '2026-05-15', berlakuHingga: '2028-05-15' },
      { type: 'bpom_md', nomor: 'MD 204310720001', tanggalTerbit: '2026-05-20', berlakuHingga: '2031-05-20', cakupan: 'Aneka frozen food olahan ayam & keju' },
    ] as Dokumen[],
    produk: [
      { id: 17, slug: "chicken-egroll-10pcs", nama: "Chicken Egroll (10 pcs)", harga: 28000, stok: 40, foto: "/images/frozen-ekado.jpg", rating: 4.8, terjual: 180, kategori: "Makanan & Minuman", deskripsi: "Egg roll ayam crispy, gurih di luar lembut di dalam. Frozen siap goreng." },
      { id: 18, slug: "ekado-keju-lumer-10pcs", nama: "Ekado Keju Lumer (10 pcs)", harga: 32000, stok: 35, foto: "/images/frozen-kaniroll.jpg", rating: 4.7, terjual: 140, kategori: "Makanan & Minuman", deskripsi: "Ekado dengan isian keju yang meleleh saat digigit. Favorit anak-anak." },
      { id: 19, slug: "spring-cheese-roll-10pcs", nama: "Spring Cheese Roll (10 pcs)", harga: 30000, stok: 30, foto: "/images/frozen-springroll.jpg", rating: 4.6, terjual: 120, kategori: "Makanan & Minuman", deskripsi: "Spring roll dengan isian keju dan sayuran segar, renyah dan cheesy." },
    ],
  },
  {
    id: 8,
    slug: "onigiri-silvi",
    nama: "Onigiri Silvi",
    pemilik: "Silvi Widayati",
    kategori: "Makanan & Minuman",
    deskripsi: "Onigiri Jepang dengan berbagai isian, dibuat segar setiap hari. Populer dititipkan ke warung dan kantin sekolah di sekitar Bojongsoang.",
    lokasi: "Jl. Tirtwangi 2 No. 6D, Desa Lengkong",
    foto: "/images/onigiri-tuna.jpg",
    rating: 4.8,
    totalPenjualan: 650,
    totalProduk: 3,
    bergabungSejak: "2026-05-10",
    status: "aktif",
    legalitas: ["NIB", "Sertifikasi Halal"],
    dokumen: [
      { type: 'nib',   nomor: '9120706290008', tanggalTerbit: '2026-05-10', berlakuHingga: null },
      { type: 'halal', nomor: 'ID20260510008', tanggalTerbit: '2026-05-20', berlakuHingga: '2028-05-20' },
    ] as Dokumen[],
    produk: [
      { id: 20, slug: "onigiri-tuna-mayo", nama: "Onigiri Tuna Mayo", harga: 8000, stok: 40, foto: "/images/onigiri-tuna.jpg", rating: 4.9, terjual: 280, kategori: "Makanan & Minuman", deskripsi: "Onigiri dengan isian tuna mayo creamy, bungkus nori, segar dan kenyang." },
      { id: 21, slug: "onigiri-ayam-teriyaki", nama: "Onigiri Ayam Teriyaki", harga: 9000, stok: 35, foto: "/images/onigiri-triangle.jpg", rating: 4.8, terjual: 220, kategori: "Makanan & Minuman", deskripsi: "Onigiri dengan isian ayam teriyaki manis gurih. Cocok untuk bekal sekolah." },
      { id: 22, slug: "paket-onigiri-3pcs", nama: "Paket Onigiri 3 pcs", harga: 22000, stok: 25, foto: "/images/onigiri-plain.jpg", rating: 4.7, terjual: 150, kategori: "Makanan & Minuman", deskripsi: "Paket hemat 3 onigiri pilihan isian, cocok untuk sarapan atau bekal." },
    ],
  },
  {
    id: 9,
    slug: "pertanian-desa-lengkong",
    nama: "Pertanian Desa Lengkong",
    pemilik: "Kelompok Tani",
    kategori: "Pertanian",
    deskripsi: "Hasil pertanian segar langsung dari kebun: timun, cabe merah tanjung, labu siam. Dikelola koperasi tani desa, panen rutin.",
    lokasi: "Ciaganitri, Desa Lengkong",
    foto: "/images/pertanian-banner.jpg",
    rating: 4.5,
    totalPenjualan: 320,
    totalProduk: 3,
    bergabungSejak: "2026-06-01",
    status: "aktif",
    legalitas: ["Sertifikat Penangkar Benih"],
    dokumen: [
      { type: 'nib', nomor: '9120706290009', tanggalTerbit: '2026-06-01', berlakuHingga: null },
    ] as Dokumen[],
    produk: [
      { id: 23, slug: "timun-1kg", nama: "Timun Segar 1kg", harga: 8000, stok: 200, foto: "/images/pertanian-timun.jpg", rating: 4.5, terjual: 120, kategori: "Pertanian", deskripsi: "Timun segar hasil panen sendiri, crisp dan cocok untuk lalapan maupun jus." },
      { id: 24, slug: "cabe-merah-tanjung-250gr", nama: "Cabe Merah Tanjung 250gr", harga: 12000, stok: 150, foto: "/images/pertanian-cabe.jpg", rating: 4.6, terjual: 110, kategori: "Pertanian", deskripsi: "Cabe merah tanjung pedas segar, dipanen langsung dari kebun." },
      { id: 25, slug: "labu-siam-1kg", nama: "Labu Siam 1kg", harga: 6000, stok: 180, foto: "/images/pertanian-labu.jpg", rating: 4.4, terjual: 90, kategori: "Pertanian", deskripsi: "Labu siam segar, cocok untuk sayur bening, tumis, atau lalapan." },
    ],
  },
];

// ─── Tipe & konstanta dokumen legalitas ───────────────────────────────────────

export type DokumenType = 'nib' | 'halal' | 'spp_irt' | 'bpom_md' | 'slhs' | 'haki' | 'ing' | 'npwp'

export type Dokumen = {
  type: DokumenType
  nomor: string
  tanggalTerbit: string
  berlakuHingga: string | null
  cakupan?: string
}

export const DOKUMEN_META: Record<DokumenType, {
  nama: string; penerbit: string; kategori: string; efek: string
}> = {
  nib:     { nama: 'NIB',                    penerbit: 'OSS BKPM',               kategori: 'Dasar & Wajib',   efek: 'Menjamin toko nyata dan legal' },
  halal:   { nama: 'Sertifikat Halal',       penerbit: 'BPJPH Kemenag',          kategori: 'Dasar & Wajib',   efek: 'Menghapus keraguan konsumen Muslim' },
  spp_irt: { nama: 'SPP-IRT',               penerbit: 'Dinas Kesehatan Kab/Kota',kategori: 'Izin Edar',       efek: 'Produk aman dari zat berbahaya' },
  bpom_md: { nama: 'BPOM MD',               penerbit: 'BPOM',                    kategori: 'Izin Edar',       efek: 'Kualitas setara standar pabrik besar' },
  slhs:    { nama: 'SLHS',                  penerbit: 'Dinas Kesehatan',         kategori: 'Jasa Boga',       efek: 'Dapur higienis, air bersih, koki sehat' },
  haki:    { nama: 'Sertifikat Merek',      penerbit: 'DJKI Kemenkumham',        kategori: 'Perlindungan Merek', efek: 'Brand terlindungi, bukan peniru' },
  ing:     { nama: 'Info Nilai Gizi (ING)', penerbit: 'Lab Pangan / Universitas', kategori: 'Klaim Kesehatan', efek: 'Data nutrisi jujur untuk konsumen sehat' },
  npwp:    { nama: 'NPWP',                 penerbit: 'Direktorat Jenderal Pajak',  kategori: 'Pajak',           efek: 'Terdaftar sebagai wajib pajak' },
}

// Tambahkan dokumen ke tiap toko di bawah:
// legalitas tetap dipakai untuk kompatibilitas lama, dokumen untuk fitur baru

export type Produk = {
  id: number;
  slug: string;
  nama: string;
  harga: number;
  stok: number;
  foto: string | null;
  rating: number;
  terjual: number;
  kategori: string;
  deskripsi: string;
  variasi?: string[];
  tokoSlug?: string;
  tokoPemilik?: string;
  tokNama?: string;
};

export function getAllProduk(): (Produk & { tokoSlug: string; tokNama: string; tokoPemilik: string })[] {
  return tokoList.flatMap((toko) =>
    toko.produk.map((p) => ({
      ...p,
      tokoSlug: toko.slug,
      tokNama: toko.nama,
      tokoPemilik: toko.pemilik,
    }))
  );
}

export function getProdukBySlug(slug: string) {
  for (const toko of tokoList) {
    const p = toko.produk.find((pr) => pr.slug === slug);
    if (p) return { ...p, toko };
  }
  return null;
}

export const kategoriList = [
  "Semua Kategori",
  "Makanan & Minuman",
  "Pertanian",
  "Kerajinan Tangan",
  "Konveksi & Fashion",
  "Jasa",
];

export const sortOptions = [
  { value: "terlaris", label: "Terlaris" },
  { value: "rating", label: "Rating Tertinggi" },
  { value: "harga_asc", label: "Harga Terendah" },
  { value: "harga_desc", label: "Harga Tertinggi" },
  { value: "terbaru", label: "Terbaru" },
];