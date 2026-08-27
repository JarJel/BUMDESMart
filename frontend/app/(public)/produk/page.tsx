"use client";

import Link from "next/link";
import { useState, useEffect, Suspense, useRef } from "react";
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
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // State untuk variant picker
  const [variantProduct, setVariantProduct] = useState<any | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({}); // variantId -> optionId
  const [variantQty, setVariantQty] = useState(1);
  const [addingVariant, setAddingVariant] = useState(false);
  
  // State untuk sticky bar keranjang
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartShopName, setCartShopName] = useState<string>("");

  const loadCartData = async () => {
    if (!localStorage.getItem('token')) return;
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

  // Tutup dropdown sort saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setLoading(true);
    setCurrentPage(1);
    productApi.list({ search: query || undefined, page: 1 }).then(res => {
      const paginated = res.data.data;
      setProducts(paginated?.data ?? []);
      setLastPage(paginated?.last_page ?? 1);
    }).catch(() => setProducts([])).finally(() => setLoading(false));
  }, [query]);

  const loadMore = async () => {
    if (loadingMore || currentPage >= lastPage) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const res = await productApi.list({ search: query || undefined, page: nextPage });
      const paginated = res.data.data;
      setProducts(prev => [...prev, ...(paginated?.data ?? [])]);
      setCurrentPage(nextPage);
      setLastPage(paginated?.last_page ?? nextPage);
    } catch {
      // fail silently
    } finally {
      setLoadingMore(false);
    }
  };

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
    const product = products.find(p => p.id === productId);
    // Produk bervariant → buka picker, jangan langsung add
    if (product?.has_variant && (product.variants ?? []).length > 0) {
      setVariantProduct(product);
      setSelectedOptions({});
      setVariantQty(1);
      return;
    }
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

  // Dapatkan option yang dipilih dari variant picker
  const getSelectedOptionId = () => {
    if (!variantProduct) return null;
    const variants = variantProduct.variants ?? [];
    if (variants.length === 0) return null;
    // Semua variant harus dipilih
    for (const v of variants) {
      if (!selectedOptions[v.id]) return null;
    }
    // Untuk sekarang ambil option dari variant pertama
    return selectedOptions[variants[0].id] ?? null;
  };

  const getSelectedStock = () => {
    if (!variantProduct) return 0;
    const variants = variantProduct.variants ?? [];
    if (variants.length === 0) return 0;
    const firstVariant = variants[0];
    const optId = selectedOptions[firstVariant.id];
    if (!optId) return 0;
    const opt = (firstVariant.options ?? []).find((o: any) => o.id === optId);
    return opt?.stock ?? 0;
  };

  const getSelectedPrice = () => {
    if (!variantProduct) return 0;
    const variants = variantProduct.variants ?? [];
    if (variants.length === 0) return Number(variantProduct.price ?? 0);
    const firstVariant = variants[0];
    const optId = selectedOptions[firstVariant.id];
    if (!optId) {
      const allOpts = variants.flatMap((v: any) => v.options ?? []);
      return allOpts.length > 0 ? Math.min(...allOpts.map((o: any) => Number(o.price ?? 0))) : 0;
    }
    const opt = (firstVariant.options ?? []).find((o: any) => o.id === optId);
    return Number(opt?.price ?? 0);
  };

  const handleAddVariantToCart = async () => {
    if (!variantProduct) return;
    const optionId = getSelectedOptionId();
    if (!optionId) {
      toast.error("Pilih varian terlebih dahulu.");
      return;
    }
    setAddingVariant(true);
    try {
      const res = await cartApi.add(variantProduct.id, variantQty, optionId);
      if (res.data?.success) {
        toast.success(`${variantProduct.name} ditambahkan ke keranjang!`);
        window.dispatchEvent(new Event("cart-updated"));
        loadCartData();
        setVariantProduct(null);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setVariantProduct(null);
        setShowLoginAlert(true);
      } else if (
        err.response?.data?.message?.toLowerCase().includes("toko lain") ||
        err.response?.data?.message?.toLowerCase().includes("beda toko")
      ) {
        setPendingProductId(variantProduct.id);
        setVariantProduct(null);
        setShowConflictAlert(true);
      } else {
        toast.error(err.response?.data?.message || "Gagal menambahkan ke keranjang.");
      }
    } finally {
      setAddingVariant(false);
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

      {/* ── Modal Pilih Variant ── */}
      {variantProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setVariantProduct(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="min-w-0 pr-2">
                <p className="text-xs text-gray-400 truncate">{variantProduct.umkm_profile?.shop_name}</p>
                <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{variantProduct.name}</h3>
              </div>
              <button onClick={() => setVariantProduct(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-500 hover:bg-gray-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Harga tampil */}
              <p className="text-lg font-bold" style={{ color: "var(--primary)" }}>
                Rp {getSelectedPrice().toLocaleString("id-ID")}
                {getSelectedOptionId() && (
                  <span className="text-xs font-normal text-gray-400 ml-2">Stok: {getSelectedStock()}</span>
                )}
              </p>

              {/* Pilih setiap variant */}
              {(variantProduct.variants ?? []).map((variant: any) => (
                <div key={variant.id}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{variant.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {(variant.options ?? []).filter((o: any) => o.is_active !== false).map((opt: any) => {
                      const selected = selectedOptions[variant.id] === opt.id;
                      const outOfStock = (opt.stock ?? 0) <= 0;
                      return (
                        <button
                          key={opt.id}
                          disabled={outOfStock}
                          onClick={() => setSelectedOptions(prev => ({ ...prev, [variant.id]: opt.id }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            outOfStock
                              ? "border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed"
                              : selected
                              ? "border-green-600 text-white"
                              : "border-gray-200 text-gray-700 hover:border-green-400"
                          }`}
                          style={selected && !outOfStock ? { background: "var(--primary)" } : {}}
                        >
                          {opt.value}
                          {outOfStock && <span className="ml-1 text-[10px]">(habis)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Jumlah */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jumlah</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setVariantQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  >−</button>
                  <span className="text-sm font-bold w-5 text-center">{variantQty}</span>
                  <button
                    onClick={() => setVariantQty(q => Math.min(getSelectedStock() || 99, q + 1))}
                    disabled={getSelectedOptionId() !== null && variantQty >= getSelectedStock()}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40"
                  >+</button>
                </div>
              </div>
            </div>

            {/* Tombol Tambah */}
            <div className="px-5 pb-5">
              <button
                onClick={handleAddVariantToCart}
                disabled={!getSelectedOptionId() || addingVariant}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "var(--primary)" }}
              >
                {addingVariant ? "Menambahkan..." : "+ Tambah ke Keranjang"}
              </button>
            </div>
          </div>
        </div>
      )}
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
              <div className="relative" ref={sortDropdownRef}>
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="flex items-center gap-2 text-sm border border-gray-200 rounded-xl px-3.5 py-2 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                >
                  <span className="font-medium">
                    {sort === "terlaris" && "Terlaris"}
                    {sort === "harga_asc" && "Harga Terendah"}
                    {sort === "harga_desc" && "Harga Tertinggi"}
                    {sort === "terbaru" && "Terbaru"}
                  </span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {sortDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {[
                      { value: 'terlaris', label: 'Terlaris' },
                      { value: 'harga_asc', label: 'Harga Terendah' },
                      { value: 'harga_desc', label: 'Harga Tertinggi' },
                      { value: 'terbaru', label: 'Terbaru' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSort(option.value);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sort === option.value 
                            ? 'bg-primary/5 text-primary font-semibold' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {filtered.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      compact
                      onAddToCart={handleQuickAdd}
                    />
                  ))}
                </div>
                {currentPage < lastPage && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                      style={{ background: "var(--primary)" }}
                    >
                      {loadingMore ? "Memuat..." : `Muat Lebih Banyak (${currentPage}/${lastPage})`}
                    </button>
                  </div>
                )}
              </>
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
