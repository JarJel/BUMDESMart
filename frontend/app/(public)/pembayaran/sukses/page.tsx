import Link from "next/link";

export default function PembayaranSuksesPage() {
  return (
    <div
      className="flex items-center justify-center px-4 py-16"
      style={{ background: "#F4F7F5", minHeight: "100vh" }}
    >
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Pesananmu sudah dikonfirmasi. Penjual akan segera memproses dan mengirimkan barangmu.
        </p>

        <Link
          href="/pesanan"
          className="block w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 mb-3 transition-opacity"
          style={{ background: "var(--primary)" }}
        >
          Lihat Pesanan Saya
        </Link>
        <Link
          href="/"
          className="block w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Lanjut Belanja
        </Link>
      </div>
    </div>
  );
}
