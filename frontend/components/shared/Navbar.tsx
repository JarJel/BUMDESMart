"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/produk", label: "Produk UMKM" },
  { href: "/mitra", label: "Mitra" },
  { href: "/tentang", label: "Tentang Kami" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isLoggedIn = mounted && !loading && !!user;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--primary)" }}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2s-2-5-8-5c-4 0-7 2-7 2s4 2 8 4c-1.5 1-3 3-3 5s1.5 4 5 4c2 0 3.5-1 4-2" />
              </svg>
            </div>
            <span className="text-lg font-bold" style={{ color: "var(--primary-dark)" }}>BumdesMart</span>
          </Link>

          {/* Search Form (Desktop) */}
          <form action="/produk" method="GET" className="hidden md:flex items-center relative max-w-[180px] lg:max-w-xs xl:max-w-md w-full mx-4">
            <input
              type="text"
              name="q"
              placeholder="Cari produk desa..."
              className="w-full pl-4 pr-9 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium focus:outline-none focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-600/10 transition-all text-gray-700 placeholder-gray-400"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 cursor-pointer transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium transition-colors ${pathname === l.href ? "font-semibold" : "text-gray-600 hover:text-green-700"}`}
                style={pathname === l.href ? { color: "var(--primary)" } : {}}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {/* Notifikasi */}
                <button
                  onClick={() => router.push("/profil")}
                  className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>

                {/* Keranjang */}
                <button
                  onClick={() => router.push("/keranjang")}
                  className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </button>

                {/* Profile */}
                <button
                  onClick={() => router.push("/profil")}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg text-gray-700 hover:text-green-700 transition-colors">
                  Masuk
                </Link>
                <Link href="/daftar" className="text-sm font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90 transition-colors" style={{ background: "var(--primary)" }}>
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50" onClick={() => setOpen(!open)}>
            {open ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1">
            {/* Search Input for Mobile */}
            <div className="px-3 pb-3">
              <form action="/produk" method="GET" className="relative">
                <input
                  type="text"
                  name="q"
                  placeholder="Cari produk desa..."
                  className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-all text-gray-700 placeholder-gray-400"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <div className="pt-3 px-3 space-y-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 shrink-0">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Link href="/profil" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setOpen(false)}>
                  Profil Saya
                </Link>
                <Link href="/keranjang" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setOpen(false)}>
                  Keranjang
                </Link>
                <Link href="/pesanan" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setOpen(false)}>
                  Pesanan Saya
                </Link>
                <button onClick={() => { setOpen(false); handleLogout(); }} className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg">
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-3 px-3">
                <Link href="/login" className="flex-1 text-center text-sm font-medium py-2.5 border border-gray-200 rounded-xl text-gray-700">Masuk</Link>
                <Link href="/daftar" className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl text-white" style={{ background: "var(--primary)" }}>Daftar</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}