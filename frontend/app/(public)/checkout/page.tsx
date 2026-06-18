"use client";

import Link from "next/link";
import { useState } from "react";

function formatRupiah(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

const items = [
  { produk: "Keripik Singkong Original", toko: "Keripik Mang Asep", harga: 12000, qty: 2 },
  { produk: "Manisan Cangkaleng 250gr", toko: "Manisan & Catering Bu Lilis", harga: 25000, qty: 1 },
];

const ekspedisi = [
  { id: "jne-reg", nama: "JNE Regular", estimasi: "2-3 hari", harga: 12000 },
  { id: "jnt-reg", nama: "J&T Express", estimasi: "2-3 hari", harga: 11000 },
  { id: "sicepat", nama: "SiCepat REG", estimasi: "1-2 hari", harga: 14000 },
  { id: "pickup", nama: "Ambil Sendiri", estimasi: "Hari ini", harga: 0 },
];

export default function CheckoutPage() {
  const [kurir, setKurir] = useState("jne-reg");
  const [bayar, setBayar] = useState("qris");

  const selectedKurir = ekspedisi.find((e) => e.id === kurir)!;
  const subtotal = items.reduce((s, i) => s + i.harga * i.qty, 0);
  const total = subtotal + selectedKurir.harga;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/keranjang" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form */}
        <div className="flex-1 space-y-5">
          {/* Alamat */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>1</span>
              Alamat Pengiriman
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nama Penerima</label>
                  <input type="text" defaultValue="Andi Wijaya" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2" style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">No. Telepon</label>
                  <input type="tel" defaultValue="08123456789" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2" style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Alamat Lengkap</label>
                <textarea rows={2} defaultValue="Jl. Contoh No. 10, RT 03/RW 05, Desa Lengkong" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 resize-none" style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["Provinsi", "Kota", "Kec."].map((p, i) => (
                  <select key={p} className="px-2 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none">
                    <option>{["Jawa Barat", "Kab. Bandung", "Bojongsoang"][i]}</option>
                  </select>
                ))}
              </div>
            </div>
          </div>

          {/* Pengiriman */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>2</span>
              Metode Pengiriman
            </h2>
            <div className="space-y-2">
              {ekspedisi.map((e) => (
                <label key={e.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${kurir === e.id ? "border-green-500 bg-green-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="kurir" value={e.id} checked={kurir === e.id} onChange={() => setKurir(e.id)} className="accent-green-700" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{e.nama}</p>
                      <p className="text-xs text-gray-500">Estimasi {e.estimasi}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                    {e.harga === 0 ? "Gratis" : formatRupiah(e.harga)}
                  </p>
                </label>
              ))}
            </div>
          </div>

          {/* Pembayaran */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>3</span>
              Metode Pembayaran
            </h2>
            <div className="space-y-2">
              {[
                { id: "qris", label: "QRIS", desc: "Scan QR dari semua e-wallet & m-banking" },
                { id: "transfer", label: "Transfer Bank", desc: "BCA, BRI, BNI, Mandiri, BJB" },
                { id: "ewallet", label: "E-Wallet", desc: "GoPay, OVO, Dana, ShopeePay" },
              ].map((m) => (
                <label key={m.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${bayar === m.id ? "border-green-500 bg-green-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <input type="radio" name="bayar" value={m.id} checked={bayar === m.id} onChange={() => setBayar(m.id)} className="accent-green-700" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Ringkasan */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20">
            <h2 className="font-bold text-gray-900 mb-4">Ringkasan</h2>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.produk} className="flex justify-between text-xs text-gray-600">
                  <span className="line-clamp-1 flex-1 mr-2">{item.produk} ×{item.qty}</span>
                  <span className="shrink-0">{formatRupiah(item.harga * item.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs text-gray-600 pt-1 border-t border-gray-50">
                <span>Ongkir ({selectedKurir.nama})</span>
                <span>{selectedKurir.harga === 0 ? "Gratis" : formatRupiah(selectedKurir.harga)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span style={{ color: "var(--primary)" }}>{formatRupiah(total)}</span>
              </div>
            </div>
            <Link href="/pembayaran" className="block w-full text-center py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all" style={{ background: "var(--primary)" }}>
              Bayar Sekarang →
            </Link>
            <p className="text-xs text-gray-400 text-center mt-2">Pembayaran aman & terenkripsi</p>
          </div>
        </div>
      </div>
    </div>
  );
}
