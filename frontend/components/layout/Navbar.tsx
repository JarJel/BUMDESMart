'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export const Navbar = () => {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-green-600 font-bold text-xl">
          BUMDesMart
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/produk" className="hover:text-green-600">Produk</Link>
          <Link href="/umkm" className="hover:text-green-600">UMKM</Link>
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-600">Halo, {user.name}</span>
              <button
                onClick={logout}
                className="text-sm text-red-500 hover:underline"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-green-600">
                Masuk
              </Link>
              <Link
                href="/register"
                className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
