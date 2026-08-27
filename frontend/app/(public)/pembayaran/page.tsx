"use client";

import Link from "next/link";
import Script from "next/script";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { checkoutApi } from "@/lib/api/checkout";
import { useToast } from "@/components/ui/Toast";
import api from "@/lib/api/axios";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

type Step = "loading" | "snap_pending" | "polling" | "redirect" | "success" | "expired" | "error";

const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";

function PembayaranContent({ onSnapReady }: { onSnapReady?: (cb: () => void) => void }) {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [step, setStep] = useState<Step>("loading");
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [bypassing, setBypassing] = useState(false);

  const pendingTokenRef = useRef<string | null>(null);
  const isFinishedRef   = useRef(false);
  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = useCallback((id: number) => {
    const check = async () => {
      if (isFinishedRef.current) return;
      try {
        const res = await checkoutApi.checkPaymentStatus(id);
        const status = res.data?.status;
        if (status === "paid") {
          isFinishedRef.current = true;
          stopPolling();
          toast.success("Pembayaran berhasil!");
          router.replace(`/pesanan/${id}`);
        } else if (status === "expired" || status === "failed") {
          isFinishedRef.current = true;
          stopPolling();
          setStep("expired");
        }
      } catch { /* Tetap polling jika error sementara */ }
    };
    check();
    if (!isFinishedRef.current) {
      pollRef.current = setInterval(check, 3000);
    }
  }, [router, toast]);

  const openSnap = useCallback((token: string) => {
    if (!window.snap) return;
    const id = Number(orderId);
    window.snap.pay(token, {
      onSuccess: () => {
        isFinishedRef.current = true;
        stopPolling();
        toast.success("Pembayaran berhasil!");
        router.replace(`/pesanan/${id}`);
      },
      onPending: () => {
        setStep("polling");
        startPolling(id);
      },
      onError: () => {
        setStep("error");
        setErrorMsg("Pembayaran gagal. Silakan coba lagi.");
      },
      onClose: () => {
        // User menutup popup — mulai polling, tampilkan UI "buka kembali"
        setStep("polling");
        startPolling(id);
      },
    });
  }, [orderId, router, toast, startPolling]);

<<<<<<< HEAD
  const handleSnapReady = useCallback(() => {
    snapReadyRef.current = true;
    if (pendingTokenRef.current) {
      openSnap(pendingTokenRef.current);
      setStep("snap_pending");
    }
  }, [openSnap]);

  useEffect(() => {
    onSnapReady?.(handleSnapReady);
  }, [onSnapReady, handleSnapReady]);

=======
>>>>>>> a5db4e073e8d377c7cfe3908c6873776d33a3539
  useEffect(() => {
    if (!orderId) { setErrorMsg("ID pesanan tidak ditemukan."); setStep("error"); return; }

    const init = async () => {
      try {
        const res  = await checkoutApi.createPayment(Number(orderId));
        const data = res.data;

        if (data.status === "paid") { router.replace(`/pesanan/${orderId}`); return; }

        const snapToken   = data.snap_token as string | null;
        const fallbackUrl = data.invoice_url as string | null;
        setInvoiceUrl(fallbackUrl);
        pendingTokenRef.current = snapToken;

        if (snapToken) {
          setStep("snap_pending");
          // Poll sampai window.snap tersedia (maks 10 detik)
          let tries = 0;
          const waitForSnap = setInterval(() => {
            tries++;
            if (window.snap) {
              clearInterval(waitForSnap);
              openSnap(snapToken);
            } else if (tries > 20) {
              clearInterval(waitForSnap);
              if (fallbackUrl) {
                window.open(fallbackUrl, "_blank");
                setStep("redirect");
                startPolling(Number(orderId));
              } else {
                setErrorMsg("Gagal memuat jendela pembayaran.");
                setStep("error");
              }
            }
          }, 500);
        } else if (fallbackUrl) {
          window.open(fallbackUrl, "_blank");
          setStep("redirect");
          startPolling(Number(orderId));
        } else {
          setErrorMsg("Gagal mendapatkan token pembayaran.");
          setStep("error");
        }
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? "Gagal membuat invoice pembayaran.";
        setErrorMsg(msg);
        setStep("error");
      }
    };

    init();
    return () => stopPolling();
  }, [orderId]);  // eslint-disable-line react-hooks/exhaustive-deps

  const simulatePayment = async () => {
    if (!orderId) return;
    setBypassing(true);
    try {
      await api.post(`/dev/simulate-payment/${orderId}`);
      isFinishedRef.current = true;
      stopPolling();
      toast.success("Simulasi pembayaran berhasil!");
      router.replace(`/pesanan/${orderId}`);
    } catch {
      toast.error("Gagal simulasi pembayaran.");
      setBypassing(false);
    }
  };

  // ── Loading ──
  if (step === "loading" || step === "snap_pending") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600" />
        <p className="text-sm text-gray-500">
          {step === "snap_pending" ? "Membuka jendela pembayaran..." : "Menyiapkan pembayaran..."}
        </p>
      </div>
    );
  }

  // ── Error ──
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

  // ── Expired ──
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
          <p className="text-sm text-gray-500 mb-6">Invoice sudah kadaluarsa. Silakan buat pesanan baru.</p>
          <Link href="/produk" className="inline-block px-6 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: "var(--primary)" }}>
            Belanja Lagi
          </Link>
        </div>
      </div>
    );
  }

  // ── Polling (popup ditutup, menunggu webhook) ──
  // ── Redirect fallback (tab baru) ──
  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">Selesaikan Pembayaran</h1>
      <p className="text-sm text-gray-500 text-center mb-6">
        {step === "redirect"
          ? "Halaman pembayaran sudah dibuka di tab baru. Bayar di sana, halaman ini otomatis update."
          : "Menunggu konfirmasi dari Midtrans. Jika jendela tertutup, buka kembali di bawah."}
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <div className="flex items-center justify-center gap-2 mb-6 py-4 bg-blue-50 rounded-xl">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
          </div>
          <span className="text-sm text-blue-700 font-medium">Menunggu konfirmasi pembayaran...</span>
        </div>

        <div className="space-y-3">
          {[
            {
              num: "1", color: "green",
              title: step === "redirect" ? "Tab pembayaran sudah terbuka" : "Jendela Midtrans Snap",
              sub:   step === "redirect" ? "Selesaikan di tab tersebut" : "Selesaikan pembayaran di jendela popup",
            },
            { num: "2", color: "blue",  title: "Pilih metode & bayar", sub: "QRIS, Transfer Bank, GoPay, OVO, dll" },
            { num: "3", color: "gray",  title: "Halaman ini otomatis update", sub: "Tidak perlu reload manual" },
          ].map(({ num, color, title, sub }) => (
            <div key={num} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className={`w-6 h-6 rounded-full bg-${color}-100 flex items-center justify-center shrink-0 mt-0.5`}>
                <span className={`text-xs font-bold text-${color}-700`}>{num}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buka kembali: Snap popup atau redirect URL */}
      {step === "polling" && pendingTokenRef.current && (
        <button
          onClick={() => openSnap(pendingTokenRef.current!)}
          className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 mb-3"
          style={{ background: "var(--primary)" }}
        >
          Buka Kembali Jendela Pembayaran
        </button>
      )}
      {step === "redirect" && invoiceUrl && (
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

      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
          <p className="text-xs text-yellow-700 font-semibold mb-2">🧪 Mode Testing (Dev Only)</p>
          <button
            onClick={simulatePayment}
            disabled={bypassing}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60"
          >
            {bypassing ? "Memproses..." : "Simulasi Bayar (Dev)"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PembayaranPage() {
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
  const snapReadyCallbackRef = useRef<(() => void) | null>(null);

  return (
    <>
      <Script
        src={snapUrl}
        data-client-key={clientKey}
        strategy="afterInteractive"
        id="midtrans-snap"
        onLoad={() => snapReadyCallbackRef.current?.()}
      />
      <Suspense fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600" />
        </div>
      }>
        <PembayaranContent onSnapReady={(cb) => { snapReadyCallbackRef.current = cb; }} />
      </Suspense>
    </>
  );
}
