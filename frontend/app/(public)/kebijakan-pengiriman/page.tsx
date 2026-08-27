import Link from "next/link";

export default function KebijakanPengirimanPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-green-600 hover:underline mb-6 inline-block">&larr; Kembali ke Beranda</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kebijakan Pengiriman</h1>

      <div className="prose prose-sm text-gray-600 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">1. Jangkauan Pengiriman</h2>
        <p>BumDesMartNukita Nukita melayani pengiriman ke seluruh wilayah Indonesia melalui jasa kurir yang bekerja sama dengan platform kami.</p>

        <h2 className="text-lg font-semibold text-gray-800">2. Waktu Pengiriman</h2>
        <p>Estimasi waktu pengiriman tergantung pada lokasi tujuan dan jasa kurir yang dipilih. Umumnya pengiriman membutuhkan waktu 2–7 hari kerja.</p>

        <h2 className="text-lg font-semibold text-gray-800">3. Biaya Pengiriman</h2>
        <p>Biaya pengiriman dihitung berdasarkan berat paket dan jarak pengiriman. Biaya ditampilkan saat proses checkout sebelum pembayaran.</p>

        <h2 className="text-lg font-semibold text-gray-800">4. Pengemasan</h2>
        <p>Setiap produk dikemas dengan baik oleh masing-masing UMKM untuk memastikan produk sampai dalam kondisi aman dan layak.</p>

        <h2 className="text-lg font-semibold text-gray-800">5. Pelacakan Pesanan</h2>
        <p>Nomor resi pengiriman akan diberikan setelah penjual mengirimkan paket. Anda dapat melacak status pengiriman melalui halaman pesanan.</p>
      </div>
    </div>
  );
}
