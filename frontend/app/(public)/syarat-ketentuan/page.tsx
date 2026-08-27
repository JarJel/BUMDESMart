import Link from "next/link";

export default function SyaratKetentuanPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-green-600 hover:underline mb-6 inline-block">&larr; Kembali ke Beranda</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Syarat & Ketentuan</h1>

      <div className="prose prose-sm text-gray-600 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">1. Umum</h2>
        <p>Dengan menggunakan platform BUMDeSMart Nukita, Anda menyetujui syarat dan ketentuan yang berlaku. Platform ini dikelola sebagai bagian dari program pemberdayaan desa digital.</p>

        <h2 className="text-lg font-semibold text-gray-800">2. Akun Pengguna</h2>
        <p>Pengguna bertanggung jawab atas keamanan akun dan informasi login. Setiap aktivitas yang dilakukan melalui akun Anda menjadi tanggung jawab Anda.</p>

        <h2 className="text-lg font-semibold text-gray-800">3. Transaksi</h2>
        <p>Semua transaksi pembayaran diproses melalui Midtrans sebagai payment gateway resmi. Harga yang tertera sudah termasuk biaya produk dan belum termasuk ongkos kirim.</p>

        <h2 className="text-lg font-semibold text-gray-800">4. Produk</h2>
        <p>Setiap UMKM bertanggung jawab atas kualitas, deskripsi, dan ketersediaan produk yang dijual. BUMDeSMart Nukita berperan sebagai platform penghubung.</p>

        <h2 className="text-lg font-semibold text-gray-800">5. Pengembalian</h2>
        <p>Pengembalian produk dapat dilakukan jika produk yang diterima tidak sesuai atau rusak. Hubungi penjual melalui fitur chat untuk proses pengembalian.</p>

        <h2 className="text-lg font-semibold text-gray-800">6. Privasi</h2>
        <p>Data pribadi Anda dilindungi dan hanya digunakan untuk keperluan transaksi dan peningkatan layanan platform.</p>
      </div>
    </div>
  );
}
