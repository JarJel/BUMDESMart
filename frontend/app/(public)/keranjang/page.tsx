"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cartApi, CartItemData } from "@/lib/api/cart";

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const getAssetUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  try {
    const origin = new URL(apiUrl).origin;
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
  } catch (e) {
    return `http://localhost:8000/${path.startsWith('/') ? path.substring(1) : path}`;
  }
};

const slugify = (text: string | undefined) => {
  if (!text) return 'toko';
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

export default function KeranjangPage() {
  const [items, setItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cartApi.get();
      if (response.data.success && response.data.data) {
        setItems(response.data.data.items || []);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuat keranjang belanja. Silakan coba beberapa saat lagi.");
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (cartItemId: number, currentQty: number, delta: number, maxStock: number) => {
    const targetQty = currentQty + delta;
    if (targetQty < 1 || targetQty > maxStock) return;

    try {
      const response = await cartApi.update(cartItemId, targetQty);
      if (response.data.success && response.data.data) {
        setItems(response.data.data.items || []);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal memperbarui kuantitas.");
    }
  };

  const remove = async (cartItemId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini dari keranjang?")) return;
    try {
      const response = await cartApi.remove(cartItemId);
      if (response.data.success && response.data.data) {
        setItems(response.data.data.items || []);
      }
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus item dari keranjang.");
    }
  };

  const subtotal = items.reduce((s, i) => {
    const price = i.variant ? Number(i.variant.price) : Number(i.product?.price || 0);
    return s + price * i.quantity;
  }, 0);
  
  const ongkir = 15000;
  const total = subtotal + ongkir;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" style={{ borderColor: "var(--primary) transparent" }}></div>
        <p className="text-sm text-gray-500">Memuat keranjang belanja...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button onClick={fetchCart} className="px-6 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "var(--primary)" }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Keranjang Kosong</h2>
        <p className="text-sm text-gray-500 mb-6">Belum ada produk di keranjang kamu.</p>
        <Link href="/" className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: "var(--primary)" }}>
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
          {items.map((item) => {
            const productPrice = item.variant ? Number(item.variant.price) : Number(item.product?.price || 0);
            const maxStock = item.variant ? item.variant.stock : (item.product?.stock || 0);
            const storeName = item.product?.umkm_profile?.name_umkm || "Toko BUMDES";
            const storeSlug = slugify(storeName);
            const imagePath = item.product?.images?.[0]?.image_path;
            const imageUrl = getAssetUrl(imagePath);

            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 items-start">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center text-2xl shrink-0 bg-gray-50 border border-gray-100">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.product?.name} className="w-full h-full object-cover" />
                  ) : (
                    "🛍️"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/${storeSlug}`} className="text-xs text-gray-500 hover:underline">{storeName}</Link>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5 line-clamp-1">{item.product?.name}</p>
                  {item.variant && (
                    <span className="inline-block text-[11px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100 mb-1">
                      Varian: {item.variant.name}
                    </span>
                  )}
                  <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>{formatRupiah(productPrice)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button onClick={() => remove(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => updateQty(item.id, item.quantity, -1, maxStock)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm font-bold">−</button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity, 1, maxStock)} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm font-bold">+</button>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatRupiah(productPrice * item.quantity)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ringkasan */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20">
            <h2 className="font-bold text-gray-900 mb-4">Ringkasan Pesanan</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} item)</span>
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
