"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  variasi?: string[];
  stok: number;
};

export function ProductActions({ variasi, stok }: Props) {
  const [selected, setSelected] = useState<string>(variasi?.[0] ?? "");
  const [qty, setQty] = useState(1);

  return (
    <>
      {/* Varian — hanya tampil jika ada */}
      {variasi && variasi.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-600 mb-1.5">Pilih Varian</p>
          <div className="flex flex-wrap gap-1.5">
            {variasi.map((v) => (
              <button
                key={v}
                onClick={() => setSelected(v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  selected === v
                    ? "text-white border-transparent"
                    : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                }`}
                style={selected === v ? { background: "var(--primary)", borderColor: "var(--primary)" } : {}}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Qty */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-gray-500 shrink-0 hidden sm:block">Jumlah</span>
        <div className="flex items-center border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-7 sm:w-9 text-center text-xs sm:text-sm font-semibold">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(stok, q + 1))}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <span className="text-xs text-gray-400">Stok: {stok}</span>
      </div>

      {/* Tombol aksi */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <Link
          href="/keranjang"
          className="flex-1 text-center py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-semibold border-2 transition-colors hover:bg-gray-50 bg-white"
          style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
        >
          + Keranjang
        </Link>
        <Link
          href="/checkout"
          className="flex-1 text-center py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-semibold text-white transition-colors hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          Beli Sekarang
        </Link>
      </div>
    </>
  );
}
