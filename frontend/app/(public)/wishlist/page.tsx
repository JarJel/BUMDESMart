"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { wishlistApi, WishlistItemData } from "@/lib/api/wishlist";
import { cartApi } from "@/lib/api/cart";

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

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await wishlistApi.list();
      if (response.data.success && response.data.data) {
        setItems(response.data.data);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuat daftar wishlist. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: number) => {
    try {
      const response = await wishlistApi.remove(productId);
      if (response.data.success) {
        setItems((prev) => prev.filter((item) => item.product_id !== productId));
      }
    } catch (err: any) {
      console.error(err);
      alert("Gagal menghapus produk dari wishlist.");
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      const response = await cartApi.add(productId, 1);
      if (response.data.success) {
        alert("Produk berhasil ditambahkan ke keranjang.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal menambahkan produk ke keranjang.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" style={{ borderColor: "var(--primary) transparent" }}></div>
        <p className="text-sm text-gray-500">Memuat wishlist favorit...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4 mx-auto">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button onClick={fetchWishlist} className="px-6 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "var(--primary)" }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Wishlist Kosong</h2>
        <p className="text-sm text-gray-500 mb-6">Kamu belum menambahkan produk apa pun ke daftar wishlist.</p>
        <Link href="/" className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: "var(--primary)" }}>
          Cari Produk Menarik
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <svg className="w-5.5 h-5.5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        Produk Favorit (Wishlist)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const product = item.product;
          if (!product) return null;

          const price = Number(product.price);
          const isOutOfStock = product.stock <= 0;
          const storeName = product.umkm_profile?.name_umkm || "Toko BUMDES";
          const storeSlug = slugify(storeName);
          const imagePath = product.images?.[0]?.image_path;
          const imageUrl = getAssetUrl(imagePath);

          return (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 items-start relative hover:shadow-sm transition-shadow">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center text-3xl shrink-0 bg-gray-50 border border-gray-100 relative">
                {imageUrl ? (
                  <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                )}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white uppercase bg-red-600 px-1.5 py-0.5 rounded">
                      Habis
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/${storeSlug}`} className="text-xs text-gray-500 hover:underline block">{storeName}</Link>
                <Link href={`/produk/${product.slug}`} className="text-sm font-semibold text-gray-900 hover:underline block line-clamp-1 mt-0.5">
                  {product.name}
                </Link>
                <p className="text-sm font-bold mt-1" style={{ color: "var(--primary)" }}>{formatRupiah(price)}</p>
                
                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={isOutOfStock}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-all ${
                      isOutOfStock
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "text-white hover:opacity-90"
                    }`}
                    style={{ background: isOutOfStock ? undefined : "var(--primary)" }}
                  >
                    {isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleRemove(product.id)}
                className="text-gray-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-50 transition-colors absolute top-2 right-2"
                title="Hapus dari Wishlist"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
