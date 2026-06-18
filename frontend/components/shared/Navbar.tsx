"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/produk", label: "Produk UMKM" },
  { href: "/mitra", label: "Mitra" },
  { href: "/tentang", label: "Tentang Kami" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
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
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg text-gray-700 hover:text-green-700 transition-colors">
              Masuk
            </Link>
            <Link href="/daftar" className="text-sm font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90 transition-colors" style={{ background: "var(--primary)" }}>
              Daftar
            </Link>
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
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3 px-3">
              <Link href="/login" className="flex-1 text-center text-sm font-medium py-2.5 border border-gray-200 rounded-xl text-gray-700">Masuk</Link>
              <Link href="/daftar" className="flex-1 text-center text-sm font-semibold py-2.5 rounded-xl text-white" style={{ background: "var(--primary)" }}>Daftar</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}