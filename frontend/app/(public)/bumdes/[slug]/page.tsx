"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { sellerApi, SellerData } from "@/lib/api/seller";
import { ProductCard } from "@/components/shared/ProductCard";
import { productApi, ProductData } from "@/lib/api/product";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface BumdesProfile {
  id: number;
  name: string;
  slug: string;
  village: string;
  district: string;
  city: string;
  province: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
  description: string | null;
  status: string;
}

export default function BumdesProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [bumdes, setBumdes] = useState<BumdesProfile | null>(null);
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"toko" | "produk">("toko");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    axios.get(`${API}/bumdes`).then(res => {
      const list: BumdesProfile[] = res.data.data ?? [];
      const found = list.find(b => b.slug === slug);
      if (!found) { setLoading(false); return; }
      setBumdes(found);

      // Fetch sellers yang terdaftar di BUMDes ini
      sellerApi.list().then(sellerRes => {
        setSellers(sellerRes.data.data ?? []);
      });

      // Fetch produk dari semua seller di BUMDes ini
      productApi.list().then(prodRes => {
        setProducts(prodRes.data.data?.data ?? []);
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const getLogoUrl = (logo: string | null) => {
    if (!logo) return null;
    if (logo.startsWith("http") || logo.startsWith("/")) return logo;
    return `http://localhost:8000/${logo}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F4F7F5" }}>
        <p className="text-sm text-gray-400">Memuat profil BUMDes...</p>
      </div>
    );
  }

  if (!bumdes) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#F4F7F5" }}>
        <p className="text-gray-500 font-medium">BUMDes tidak ditemukan</p>
        <Link href="/" className="text-sm text-green-700 hover:underline">Kembali ke Beranda</Link>
      </div>
    );
  }

  const logoUrl = getLogoUrl(bumdes.logo);

  return (
    <div style={{ background: "#F4F7F5", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-green-700">Beranda</Link>
          <span>/</span>
          <span className="text-gray-700">{bumdes.name}</span>
        </div>
      </div>

      {/* Hero BUMDes */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start gap-5">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-green-50 flex items-center justify-center shrink-0 border border-gray-100">
              {logoUrl ? (
                <img src={logoUrl} alt={bumdes.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
              ) : (
                <svg className="w-10 h-10 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-gray-900">{bumdes.name}</h1>
                {bumdes.status === "active" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Aktif</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-2">{bumdes.village}, Kec. {bumdes.district}, {bumdes.city}</p>
              {bumdes.description && (
                <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">{bumdes.description}</p>
              )}

              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                {bumdes.phone && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {bumdes.phone}
                  </span>
                )}
                {bumdes.email && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {bumdes.email}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{sellers.length}</p>
                <p className="text-xs text-gray-500">Toko UMKM</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-xs text-gray-500">Produk</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {(["toko", "produk"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-green-700 text-green-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "toko" ? `Toko (${sellers.length})` : `Produk (${products.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "toko" && (
          sellers.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-sm">Belum ada toko terdaftar</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sellers.map(toko => (
                <Link key={toko.id} href={`/${toko.slug}`} className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-100">
                  <div className="h-36 relative overflow-hidden bg-gray-100">
                    {toko.banner ? (
                      <img src={toko.banner.startsWith("http") ? toko.banner : `http://localhost:8000/${toko.banner}`} alt={toko.shop_name} className="w-full h-full object-cover" onError={e => { e.currentTarget.src = "https://placehold.co/600x300?text=No+Banner"; }} />
                    ) : (
                      <div className="w-full h-full" style={{ background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))" }} />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-green-700">{toko.shop_name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{toko.description || "Toko UMKM"}</p>
                    <p className="text-xs text-gray-400 mt-2">{toko.owner_name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {activeTab === "produk" && (
          products.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-sm">Belum ada produk</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {products.map(p => (
                <ProductCard key={p.id} product={p} compact />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
