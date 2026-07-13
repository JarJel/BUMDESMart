"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { productApi, ProductData } from "@/lib/api/product";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ProductCard } from "@/components/shared/ProductCard";
import { FilterContent } from "@/components/produk/FilterContent";
import { cartApi } from "@/lib/api/cart";
import { useToast } from "@/components/ui/Toast";

const DEFAULT_FILTER = {
  kategori: "Semua Kategori",
  hargaMax: 10000000,
  minRating: 0,
};

function ProdukContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const query = searchParams?.get("q") || "";

  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [kategori, setKategori] = useState(DEFAULT_FILTER.kategori);
  const [sort, setSort] = useState("terlaris");
  const [hargaMax, setHargaMax] = useState(DEFAULT_FILTER.hargaMax);
  const [minRating, setMinRating] = useState(DEFAULT_FILTER.minRating);
  const [showFilter, setShowFilter] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<number | null>(null);
  
  // State untuk sticky bar keranjang
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartShopName, setCartShopName] = useState<string>("");

  const loadCartData = async () => {
    try {
      const res = await cartApi.get();
      if (res.data?.success && res.data?.data?.items) {
        const items = res.data.data.items;
        setCartItems(items);
        if (items.length > 0) {
          const firstItemShop = items[0].product?.umkm_profile?.shop_name || "Nama Toko";
          setCartShopName(firstItemShop);
        } else {
          setCartShopName("");
        }
      }
    } catch {
      // Belum login
    }
  };

  useEffect(() => {
    loadCartData();
  }, []);

  // Listen event update keranjang
  useEffect(() => {
    const handleCartUpdated = () => {
      loadCartData();
    };
    window.addEventListener("cart-updated", handleCartUpdated);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    productApi.list({ search: query || undefined }).then(res => {
      setProducts(res.data.data?.data ?? []);
    }).catch(() => setProducts([])).finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    const catParam = searchParams?.get("kategori");
    if (catParam) {
      setKategori(catParam);
    } else {
      setKategori(DEFAULT_FILTER.kategori);
    }
  }, [searchParams]);

  const resetFilter = () => {
    setKategori(DEFAULT_FILTER.kategori);
    setHargaMax(DEFAULT_FILTER.hargaMax);
    setMinRating(DEFAULT_FILTER.minRating);
  };

  const handleQuickAdd = async (productId: number) => {
    try {
      const res = await cartApi.add(productId, 1, null);
      if (res.data?.success) {
        const p = products.find(prod => prod.id === productId);
        toast.success(`${p?.name || "Produk"} ditambahkan ke keranjang!`);
        window.dispatchEvent(new Event("cart-updated"));
        loadCartData();
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setShowLoginAlert(true);
      } else if (
        err.response?.data?.message?.toLowerCase().includes("toko lain") ||
        err.response?.data?.message?.toLowerCase().includes("beda toko")
      ) {
        setPendingProductId(productId);
        setShowConflictAlert(true);
      } else {
        toast.error(err.response?.data?.message || "Gagal menambahkan ke keranjang.");
      }
    }
  };

  const handleReplaceCart = async () => {
    if (!pendingProductId) return;
    try {
      await cartApi.clear();
      const res = await cartApi.add(pendingProductId, 1, null);
      if (res.data?.success) {
        const p = products.find(prod => prod.id === pendingProductId);
        toast.success(`${p?.name || "Produk"} ditambahkan ke keranjang baru!`);
        window.dispatchEvent(new Event("cart-updated"));
        loadCartData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengganti keranjang.");
    } finally {
      setShowConflictAlert(false);
      setPendingProductId(null);
    }
  };

  const filtered = products
    .filter((p) => {
      if (kategori === "Semua Kategori") return true;
      return p.category?.name === kategori;
    })
    .filter((p) => Number(p.price) <= hargaMax)
    .sort((a, b) => {
      if (sort === "terlaris") return (b.sold_count ?? 0) - (a.sold_count ?? 0);
      if (sort === "harga_asc") return Number(a.price) - Number(b.price);
      if (sort === "harga_desc") return Number(b.price) - Number(a.price);
      if (sort === "terbaru") return b.id - a.id;
      return 0;
    });

  const activeFilterCount =
    (kategori !== DEFAULT_FILTER.kategori ? 1 : 0) +
    (hargaMax !== DEFAULT_FILTER.hargaMax ? 1 : 0);

  const uniqueCategories = [
    "Semua Kategori",
    ...Array.from(new Set(products.map(p => p.category?.name).filter(Boolean) as string[])),
  ];

  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh", paddingBottom: cartItems.length > 0 ? "96px" : "0" }}>
      {/* Alert Konflik Beda Toko */}
      {showConflictAlert && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowConflictAlert(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Ganti Keranjang?</h3>
            <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
              Keranjangmu berisi produk dari toko lain. Ingin menghapus keranjang lama dan mulai belanja di toko ini?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConflictAlert(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={handleReplaceCart}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
              >
                Hapus & Ganti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert login */}
      {showLoginAlert && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowLoginAlert(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Login Dulu, Yuk!</h3>
            <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
              Kamu perlu login untuk menambahkan produk ke keranjang.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowLoginAlert(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50">
                Nanti Saja
              </button>
              <button
                onClick={() => { setShowLoginAlert(false); router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--primary)" }}
              >
                Masuk Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filter — Desktop only */}
          <aside
            className="hidden lg:block w-56 shrink-0"
            style={{ alignSelf: "flex-start", position: "sticky", top: "88px" }}
          >
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <FilterContent
                kategori={kategori}
                onKategoriChange={setKategori}
                hargaMax={hargaMax}
                onHargaChange={setHargaMax}
                minRating={minRating}
                onRatingChange={setMinRating}
                onReset={resetFilter}
                categories={uniqueCategories}
              />
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                {query && (
                  <span className="text-xs text-gray-500">
                    Hasil untuk <span className="font-semibold text-gray-800">"{query}"</span> · {filtered.length} produk
                  </span>
                )}
                {/* Mobile filter button */}
                <button
                  onClick={() => setShowFilter(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {kategori !== "Semua Kategori" && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
                    style={{ background: "var(--primary-muted)", color: "var(--primary)" }}
                  >
                    {kategori}
                    <button onClick={() => setKategori("Semua Kategori")} className="ml-1 font-bold">
                      x
                    </button>
                  </span>
                )}
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none"
              >
                <option value="terlaris">Terlaris</option>
                <option value="harga_asc">Harga Terendah</option>
                <option value="harga_desc">Harga Tertinggi</option>
                <option value="terbaru">Terbaru</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-20 text-gray-400 text-sm">Memuat produk...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="font-medium text-sm">Tidak ada produk yang sesuai pencarian atau filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    compact
                    storeHref={p.umkm_profile?.slug ? `/${p.umkm_profile.slug}?p=${p.slug}` : undefined}
                    onAddToCart={handleQuickAdd}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <BottomSheet
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter"
        footer={
          <Button onClick={() => setShowFilter(false)} className="w-full">
            Terapkan ({filtered.length})
          </Button>
        }
      >
        <FilterContent
          kategori={kategori}
          onKategoriChange={setKategori}
          hargaMax={hargaMax}
          onHargaChange={setHargaMax}
          minRating={minRating}
          onRatingChange={setMinRating}
          onReset={resetFilter}
          categories={uniqueCategories}
        />
      </BottomSheet>

      {/* Sticky Bar GoFood-style */}
      {cartItems.length > 0 && cartShopName && (
        <StickyCartBar
          items={cartItems.map(i => ({
            cartItemId: i.id,
            productId: i.product_id,
            name: i.product?.name || "",
            price: i.variant ? Number(i.variant.price) : Number(i.product?.price || 0),
            quantity: i.quantity,
          }))}
          shopName={cartShopName}
          onViewCart={() => router.push("/checkout")}
        />
      )}
    </div>
  );
}

// ─── Sticky Bar GoFood Component ─────────────────────────────────────────────
function StickyCartBar({ items, shopName, onViewCart }: {
  items: any[];
  shopName: string;
  onViewCart: () => void;
}) {
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto max-w-2xl px-4 pb-4 sm:pb-6">
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl border border-white/20"
          style={{ background: "var(--primary)" }}
        >
          <div className="flex-shrink-0 w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">{totalQty}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-none truncate">{shopName}</p>
            <p className="text-white/70 text-xs mt-0.5">Rp {totalPrice.toLocaleString("id-ID")}</p>
          </div>

          <button
            onClick={onViewCart}
            className="flex-shrink-0 flex items-center gap-1.5 bg-white text-sm font-bold px-4 py-2 rounded-xl cursor-pointer border-0 transition-all hover:opacity-90 active:scale-95"
            style={{ color: "var(--primary)" }}
          >
            Lihat Pesanan
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProdukPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">Memuat produk...</div>}>
      <ProdukContent />
    </Suspense>
  );
}
