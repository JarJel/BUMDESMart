"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect } from "react";

function formatRupiah(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

export default function PembayaranPage() {
  const [detik, setDetik] = useState(900); // 15 menit
  const [status, setStatus] = useState<"pending" | "success">("pending");

  useEffect(() => {
    if (status !== "pending") return;
    const t = setInterval(() => setDetik((d) => Math.max(0, d - 1)), 1000);
    return () => clearInterval(t);
  }, [status]);

  const menit = Math.floor(detik / 60).toString().padStart(2, "0");
  const detikStr = (detik % 60).toString().padStart(2, "0");

  if (status === "success") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4" style={{ background: "var(--primary-muted)" }}>
            ✅
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
          <p className="text-sm text-gray-500 mb-1">No. Pesanan: <strong>ORD-20240622-005</strong></p>
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

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">Selesaikan Pembayaran</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        {/* Timer */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500 mb-1">Bayar sebelum waktu habis</p>
          <div className="text-3xl font-black tabular-nums" style={{ color: detik < 60 ? "#DC2626" : "var(--primary)" }}>
            {menit}:{detikStr}
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(detik / 900) * 100}%`, background: detik < 60 ? "#DC2626" : "var(--primary)" }} />
          </div>
        </div>

        {/* Ringkasan order */}
        <div className="p-3 rounded-xl mb-5" style={{ background: "var(--surface)" }}>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>No. Pesanan</span>
            <span className="font-medium">ORD-20240622-005</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Keripik Singkong Original ×2</span>
            <span>Rp 24.000</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Manisan Cangkaleng 250gr ×1</span>
            <span>Rp 25.000</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Ongkir JNE Regular</span>
            <span>Rp 12.000</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-gray-900 border-t border-gray-200 mt-2 pt-2">
            <span>Total Bayar</span>
            <span style={{ color: "var(--primary)" }}>Rp 61.000</span>
          </div>
        </div>

        {/* QRIS */}
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700 mb-3">Scan QRIS untuk Membayar</p>
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-xl border-2 border-gray-100 inline-block">
              <QRCodeSVG
                value="https://payment.bumdesmart.id/pay/ORD-20240622-005"
                size={180}
                bgColor="#ffffff"
                fgColor="#1B4332"
                level="H"
                includeMargin={false}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">Dapat dibayar melalui semua aplikasi e-wallet</p>
          <p className="text-xs text-gray-400">GoPay · OVO · Dana · ShopeePay · m-Banking</p>
        </div>
      </div>

      {/* Simulasi tombol (untuk demo) */}
      <button
        onClick={() => setStatus("success")}
        className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
        style={{ background: "var(--primary)" }}
      >
        Simulasi Pembayaran Berhasil ✓
      </button>
      <p className="text-xs text-center text-gray-400 mt-2">Tombol ini hanya untuk demo</p>
    </div>
  );
}
