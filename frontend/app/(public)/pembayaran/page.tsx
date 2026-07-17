"use client";

import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { checkoutApi } from "@/lib/api/checkout";
import { useToast } from "@/components/ui/Toast";

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function PembayaranContent() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [step, setStep] = useState<"loading" | "redirect" | "polling" | "success" | "expired" | "error">("loading");
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
   const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
   const isFinishedRef = useRef(false);
 
   const stopPolling = () => {
     if (pollIntervalRef.current) {
       clearInterval(pollIntervalRef.current);
       pollIntervalRef.current = null;
     }
   };
 
   const startPolling = (id: number) => {
     const poll = async () => {
       if (isFinishedRef.current) return;
 
       try {
         const res = await checkoutApi.checkPaymentStatus(id);
         const data = res.data;
         const payStatus = data?.status;
 
         if (payStatus === "paid") {
           isFinishedRef.current = true;
           stopPolling();
           toast.success("Pembayaran berhasil!");
           router.replace(`/pesanan/${id}`);
         } else if (payStatus === "expired" || payStatus === "failed") {
           isFinishedRef.current = true;
           stopPolling();
           setStep("expired");
         }
       } catch {
         // Tetap polling jika ada error sementara
       }
     };
 
     poll(); // Langsung cek sekali
     if (!isFinishedRef.current) {
       pollIntervalRef.current = setInterval(poll, 3000);
     }
   };

  useEffect(() => {
    if (!orderId) {
      setErrorMsg("ID pesanan tidak ditemukan.");
      setStep("error");
      return;
    }

    const init = async () => {
      try {
        const res = await checkoutApi.createPayment(Number(orderId));
        const data = res.data;

        if (data.status === "paid") {
          router.replace(`/pesanan/${orderId}`);
          return;
        }

        const url = data.invoice_url;
        setInvoiceUrl(url);

        // Extract order code dari URL atau pakai orderId
        const code = url?.split("/").at(-1) || `ORD-${orderId}`;
        setOrderCode(code);

        setStep("redirect");

        // Buka Xendit invoice di tab yang sama
        if (url) {
          window.open(url, "_blank");
        }

        // Mulai polling setelah membuka invoice
        startPolling(Number(orderId));
      } catch (err: any) {
        const msg = err.response?.data?.message || "Gagal membuat invoice pembayaran.";
        setErrorMsg(msg);
        setStep("error");
      }
    };

    init();

    return () => stopPolling();
  }, [orderId]);

  // ---- STATE: Loading ----
  if (step === "loading") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600" />
        <p className="text-sm text-gray-500">Menyiapkan pembayaran...</p>
      </div>
    );
  }

  // ---- STATE: Error ----
  if (step === "error") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Pembayaran Gagal</h2>
          <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
          <Link href="/pesanan" className="inline-block px-6 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: "var(--primary)" }}>
            Lihat Pesanan
          </Link>
        </div>
      </div>
    );
  }

  // ---- STATE: Expired ----
  if (step === "expired") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Waktu Pembayaran Habis</h2>
          <p className="text-sm text-gray-500 mb-6">Invoice kamu sudah kadaluarsa. Silakan buat pesanan baru.</p>
          <Link href="/produk" className="inline-block px-6 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: "var(--primary)" }}>
            Belanja Lagi
          </Link>
        </div>
      </div>
    );
  }

  // ---- STATE: Success ----
  if (step === "success") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--primary-muted)" }}>
            <svg className="w-10 h-10" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
          <p className="text-sm text-gray-500 mb-1">No. Pesanan: <strong>{orderCode}</strong></p>
          <p className="text-sm text-gray-500 mb-6">Pesanan kamu sedang diproses oleh penjual.</p>
          <div className="flex flex-col gap-2">
            <Link href="/pesanan" className="py-2.5 rounded-xl text-sm font-semibold text-white text-center" style={{ background: "var(--primary)" }}>
              Lihat Status Pesanan
            </Link>
            <Link href="/" className="py-2.5 rounded-xl text-sm font-medium text-gray-600 text-center border border-gray-200 hover:bg-gray-50">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- STATE: Redirect + Polling ----
  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">Selesaikan Pembayaran</h1>
      <p className="text-sm text-gray-500 text-center mb-6">Halaman Xendit sudah dibuka di tab baru. Bayar di sana, halaman ini otomatis update.</p>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        {/* Indikator polling */}
        <div className="flex items-center justify-center gap-2 mb-6 py-4 bg-blue-50 rounded-xl">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </div>
          <span className="text-sm text-blue-700 font-medium">Menunggu konfirmasi pembayaran...</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-green-700">1</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Tab Xendit sudah terbuka</p>
              <p className="text-xs text-gray-500">Selesaikan pembayaran di tab tersebut</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-700">2</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Pilih metode & bayar</p>
              <p className="text-xs text-gray-500">QRIS, Transfer Bank, E-Wallet, dll</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-gray-500">3</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Halaman ini otomatis update</p>
              <p className="text-xs text-gray-400">Tidak perlu reload manual</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tombol buka ulang jika tab tertutup */}
      {invoiceUrl && (
        <button
          onClick={() => window.open(invoiceUrl, "_blank")}
          className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 mb-3"
          style={{ background: "var(--primary)" }}
        >
          Buka Ulang Halaman Pembayaran
        </button>
      )}

      <Link href="/pesanan" className="block w-full py-3 rounded-xl text-sm font-medium text-gray-600 text-center border border-gray-200 hover:bg-gray-50">
        Bayar Nanti — Lihat Pesanan
      </Link>
    </div>
  );
}

export default function PembayaranPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600" />
      </div>
    }>
      <PembayaranContent />
    </Suspense>
  );
}
