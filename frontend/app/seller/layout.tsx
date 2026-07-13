"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { clearAuthCookies } from "@/lib/utils/auth";
import api from "@/lib/api/axios";
import { SellerProfileContext, SellerProfileData } from "@/lib/context/sellerProfile";

const navItems = [
  {
    href: "/seller",
    label: "Ringkasan",
    icon: (
      <svg className="w-4.5 h-4.5" style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: "/seller/produk",
    label: "Produk Saya",
    icon: (
      <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: "/seller/diskon",
    label: "Diskon",
    icon: (
      <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    href: "/seller/promosi",
    label: "Promosi",
    icon: (
      <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    href: "/seller/pesanan",
    label: "Pesanan",
    icon: (
      <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: "/seller/ulasan",
    label: "Ulasan",
    icon: (
      <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    href: "/seller/pendapatan",
    label: "Pendapatan",
    icon: (
      <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/seller/dokumen",
    label: "Dokumen",
    icon: (
      <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: "/seller/pengaturan",
    label: "Pengaturan Toko",
    icon: (
      <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// Halaman yang boleh diakses meski belum aktif
const ALLOWED_WHEN_INACTIVE = ["/seller/pengaturan", "/seller/dokumen"];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<SellerProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    api.get('/profile')
      .then(res => {
        const user = res.data.data ?? res.data;
        // Profile umkm ada di nested umkm_profile
        const umkm = user.umkm_profile ?? user;
        setProfile({
          id: umkm.id,
          shop_name: umkm.shop_name ?? user.name ?? "Toko Saya",
          owner_name: umkm.owner_name ?? user.name ?? "-",
          status: umkm.status ?? "pending",
          description: umkm.description,
          logo: umkm.logo,
        });
      })
      .catch(() => { router.push("/login"); })
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch {}
    localStorage.removeItem("token");
    clearAuthCookies();
    router.push("/login");
  };

  const isActive = profile?.status === "active";
  const isAllowed = ALLOWED_WHEN_INACTIVE.some(p => pathname.startsWith(p));

  // Kalau belum aktif dan coba akses halaman selain pengaturan → redirect
  useEffect(() => {
    if (!loadingProfile && profile && !isActive && !isAllowed) {
      router.replace("/seller/pengaturan");
    }
  }, [loadingProfile, profile, isActive, isAllowed, pathname]);

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Memuat dashboard...</p>
      </div>
    );
  }

  const initials = profile?.shop_name?.slice(0, 2).toUpperCase() ?? "TK";

  return (
    <SellerProfileContext.Provider value={profile}>
      <div className="flex h-screen bg-gray-50 overflow-hidden relative">
        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-100 flex flex-col h-full transition-transform duration-300 ease-in-out lg:static lg:h-full lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="BUMDESMart" className="h-8 w-auto" />
                <span className="font-bold text-sm" style={{ color: "var(--primary-dark)" }}>BUMDESMart</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Portal Penjual</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 lg:hidden shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Banner belum aktif */}
          {!isActive && (
            <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-yellow-50 border border-yellow-200">
              <p className="text-xs font-semibold text-yellow-700">Akun Belum Aktif</p>
              <p className="text-xs text-yellow-600 mt-0.5">
                {profile?.status === "rejected" ? "Ditolak oleh BUMDes." : "Menunggu verifikasi BUMDes."}
              </p>
            </div>
          )}

          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/seller" && pathname.startsWith(item.href));
              const locked = !isActive && !ALLOWED_WHEN_INACTIVE.some(p => item.href.startsWith(p));
              return locked ? (
                <div
                  key={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 cursor-not-allowed select-none"
                >
                  <span className="text-gray-300">{item.icon}</span>
                  {item.label}
                  <svg className="w-3 h-3 ml-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? "text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
                  style={active ? { background: "var(--primary)" } : {}}
                >
                  <span className={active ? "text-white" : "text-gray-400"}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {isActive && (
            <div className="px-3 pb-3">
              <Link href="/seller/produk/tambah" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ background: "var(--primary)" }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Produk
              </Link>
            </div>
          )}

          <div className="border-t border-gray-100 px-4 py-4 space-y-1">
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-600 py-1 w-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>

          <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "var(--primary)" }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{profile?.owner_name ?? "-"}</p>
              <p className="text-xs text-gray-400 truncate">{profile?.shop_name ?? "-"}</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 bg-white border-b border-gray-100 flex items-center gap-4 px-5 shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-50 lg:hidden shrink-0"
              aria-label="Toggle Sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input type="text" placeholder="Cari pesanan atau produk..." className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-400" />
            </div>
            <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 relative shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto">
            {/* Banner peringatan jika halaman ini bukan pengaturan tapi status bukan aktif */}
            {!isActive && isAllowed && (
              <div className="mx-6 mt-5 px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 flex items-start gap-3">
                <svg className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div>
                  <p className="text-sm font-semibold text-yellow-800">
                    {profile?.status === "rejected" ? "Pendaftaran kamu ditolak oleh BUMDes." : "Akun kamu sedang menunggu verifikasi BUMDes."}
                  </p>
                  <p className="text-xs text-yellow-600 mt-0.5">Lengkapi profil toko kamu terlebih dahulu. Fitur lain akan terbuka setelah diverifikasi.</p>
                </div>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </SellerProfileContext.Provider>
  );
}
