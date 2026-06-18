"use client";

import Link from "next/link";
import { useState } from "react";

const cartItems = [
  { id: 1, toko: "Keripik Mang Asep", tokoSlug: "keripik-mang-asep", produk: "Keripik Singkong Original", harga: 12000, qty: 2, stok: 150 },
  { id: 2, toko: "Manisan & Catering Bu Lilis", tokoSlug: "manisan-bu-lilis", produk: "Manisan Cangkaleng 250gr", harga: 25000, qty: 1, stok: 60 },
  { id: 3, toko: "MomeeRa Bakery", tokoSlug: "momeera-bakery", produk: "Roti Tawar Gandum Loaf", harga: 22000, qty: 1, stok: 30 },
];

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function KeranjangPage() {
  const [items, setItems] = useState(cartItems);

  const updateQty = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, Math.min(item.stok, item.qty + delta)) } : item
      )
    );
  };

  const remove = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.harga * i.qty, 0);
  const ongkir = 15000;
  const total = subtotal + ongkir;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Keranjang Kosong</h2>
        <p className="text-sm text-gray-500 mb-6">Belum ada produk di keranjang kamu.</p>
        <Link href="/" className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Keranjang Belanja</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Items */}
        <div className="flex-1 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 items-start">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl shrink-0" style={{ background: "var(--surface)" }}>
                🛍️
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/${item.tokoSlug}`} className="text-xs text-gray-500 hover:underline">{item.toko}</Link>
                <p className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{item.produk}</p>
                <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>{formatRupiah(item.harga)}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button onClick={() => remove(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm font-bold">−</button>
                  <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm font-bold">+</button>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatRupiah(item.harga * item.qty)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Ringkasan */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20">
            <h2 className="font-bold text-gray-900 mb-4">Ringkasan Pesanan</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} item)</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Estimasi Ongkir</span>
                <span>{formatRupiah(ongkir)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span style={{ color: "var(--primary)" }}>{formatRupiah(total)}</span>
              </div>
            </div>
            <Link href="/checkout" className="block w-full text-center py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all" style={{ background: "var(--primary)" }}>
              Lanjut ke Pembayaran →
            </Link>
            <Link href="/" className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-3">
              Lanjut belanja
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
