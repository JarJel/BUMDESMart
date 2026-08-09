"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { orderApi } from "@/lib/api/checkout";

function PembayaranSuksesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderCode = searchParams.get("order");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderCode) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await orderApi.list();
        if (res.data?.data?.data) {
          const list = res.data.data.data;
          const found = list.find((o: any) => o.order_code === orderCode);
          if (found) {
            setOrderId(found.id);
            // Redirect otomatis ke detail pesanan
            router.push(`/pesanan/${found.id}`);
          }
        }
      } catch (err) {
        console.error("Gagal mendapatkan data order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderCode, router]);

  return (
    <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600" />
        ) : (
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
      <p className="text-sm text-gray-500 mb-8 leading-relaxed">
        {loading
          ? "Sedang mengalihkan ke detail transaksi..."
          : "Pesananmu sudah dikonfirmasi. Penjual akan segera memproses dan mengirimkan barangmu."}
      </p>

      <Link
        href={orderId ? `/pesanan/${orderId}` : "/pesanan"}
        className="block w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 mb-3 transition-opacity"
        style={{ background: "var(--primary)" }}
      >
        Lihat Detail Transaksi
      </Link>
      <Link
        href="/"
        className="block w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Lanjut Belanja
      </Link>
    </div>
  );
}

export default function PembayaranSuksesPage() {
  return (
    <div
      className="flex items-center justify-center px-4 py-16"
      style={{ background: "#F4F7F5", minHeight: "100vh" }}
    >
      <Suspense fallback={
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600 mb-4" />
          <p className="text-sm text-gray-500">Memuat status pembayaran...</p>
        </div>
      }>
        <PembayaranSuksesContent />
      </Suspense>
    </div>
  );
}
