"use client";
import { useState } from "react";

export function QtyButtons({
  stok,
  onAddToCart,
  onBuyNow,  // tetap dipertahankan untuk kompatibilitas mundur, tidak dirender
  isPreOrder = false,
  preOrderDays,
  sellerPhone,
  productName,
}: {
  stok: number;
  onAddToCart?: (qty: number) => void;
  onBuyNow?: (qty: number) => void;
  isPreOrder?: boolean;
  preOrderDays?: number;
  sellerPhone?: string;
  productName?: string;
}) {
  const [qty, setQty] = useState(1);
  const maxQty = isPreOrder ? 99 : stok;

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
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <span className="text-xs text-gray-400">
          {isPreOrder ? `Pre-Order (Estimasi ${preOrderDays ?? 7} hari)` : `Stok: ${stok}`}
        </span>
      </div>

      {/* Satu tombol tambah ke keranjang */}
      <button
        onClick={() => onAddToCart && onAddToCart(qty)}
        disabled={stok === 0 && !isPreOrder}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 cursor-pointer border-0 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: isPreOrder ? "var(--accent, #D97706)" : "var(--primary)" }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {stok === 0 && !isPreOrder ? "Stok Habis" : isPreOrder ? "+ Keranjang Pre-Order" : "+ Keranjang"}
      </button>

      {/* Tombol Diskusi PO via WA jika produk Pre-Order */}
      {isPreOrder && sellerPhone && (
        <button
          type="button"
          onClick={() => {
            let phone = sellerPhone || "";
            if (phone.startsWith("0")) phone = "62" + phone.slice(1);
            const text = encodeURIComponent(`Halo, saya tertarik dengan produk Pre-Order "${productName || 'ini'}". Bisa tolong infokan estimasi pengerjaan dan detailnya?`);
            window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer"
        >
          <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Chat Seller via WA
        </button>
      )}
    </div>
  );
}
