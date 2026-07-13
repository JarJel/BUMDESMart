"use client";
import { useState } from "react";

export function QtyButtons({ 
  stok, 
  onAddToCart,
  onBuyNow  // tetap dipertahankan untuk kompatibilitas mundur, tidak dirender
}: { 
  stok: number; 
  onAddToCart?: (qty: number) => void;
  onBuyNow?: (qty: number) => void;
}) {
  const [qty, setQty] = useState(1);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Label + Qty Control */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-gray-500 shrink-0 hidden sm:block">Jumlah</span>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-8 sm:w-10 text-center text-sm font-semibold">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(stok, q + 1))}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <span className="text-xs text-gray-400">Stok: {stok}</span>
      </div>

      {/* Satu tombol tambah ke keranjang */}
      <button
        onClick={() => onAddToCart && onAddToCart(qty)}
        disabled={stok === 0}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 cursor-pointer border-0 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: "var(--primary)" }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {stok === 0 ? "Stok Habis" : "+ Keranjang"}
      </button>
    </div>
  );
}
