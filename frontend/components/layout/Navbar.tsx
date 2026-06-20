'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export const Navbar = () => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Search input state
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [kategori, setKategori] = useState(searchParams.get('kategori') || '')

  // Sync search inputs with URL params
  useEffect(() => {
    setQ(searchParams.get('q') || '')
    setKategori(searchParams.get('kategori') || '')
  }, [searchParams])

  // Track window scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return
    const handleOutsideClick = () => {
      setDropdownOpen(false)
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [dropdownOpen])

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let url = '/produk'
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (kategori) params.set('kategori', kategori)
    
    const queryString = params.toString()
    if (queryString) {
      url += `?${queryString}`
    }
    
    router.push(url)
  }

  const currentKategori = searchParams.get('kategori')
  const firstLetter = user && user.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <>
      <nav className={`navbar navbar-expand-lg sticky top-0 ${scrolled ? 'scrolled' : ''}`} id="mainNavbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-1">
            
            {/* Top row in mobile: Logo and Toggle */}
            <div className="flex items-center justify-between w-full lg:w-auto">
              {/* BRAND */}
              <Link href="/" className="flex items-center gap-2 no-underline">
                <div className="brand-icon">
                  <i className="fa-solid fa-leaf"></i>
                </div>
                <span className="brand-text">
                  Batara<span className="brand-accent">Shop</span>
                </span>
              </Link>

              {/* TOGGLER */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 focus:outline-none cursor-pointer"
                type="button"
                aria-label="Toggle navigation"
              >
                <span className="toggler-icon">
                  <i className="fa-solid fa-bars"></i>
                </span>
              </button>
            </div>

            {/* Menu collapse items */}
            <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row items-center justify-between flex-1 w-full lg:w-auto gap-4`}>
              
              {/* SEARCH BAR (center) */}
              <div className="search-wrapper w-full lg:w-[480px]">
                <form onSubmit={handleSearchSubmit} className="search-form">
                  <select 
                    value={kategori} 
                    onChange={(e) => setKategori(e.target.value)} 
                    className="search-select"
                  >
                    <option value="">Semua</option>
                    <option value="makanan">Makanan</option>
                    <option value="minuman">Minuman</option>
                    <option value="kerajinan">Kerajinan</option>
                  </select>
                  <input 
                    type="text" 
                    value={q}
                    onChange={(e) => setQ(e.target.value)} 
                    className="search-input" 
                    placeholder="Cari produk desa..." 
                  />
                  <button type="submit" className="search-btn cursor-pointer">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </button>
                </form>
              </div>

              {/* RIGHT ICONS */}
              <div className="flex flex-row items-center justify-end w-full lg:w-auto gap-2 lg:gap-3">
                {!user ? (
                  <>
                    <Link href="/login" className="btn-nav-outline no-underline inline-flex items-center text-center">
                      <i className="fa-regular fa-user mr-1.5"></i> Masuk
                    </Link>
                    <Link href="/register" className="btn-nav-fill no-underline text-center">
                      Daftar
                    </Link>
                  </>
                ) : (
                  <>
                    {/* WISHLIST */}
                    <Link href="/wishlist" className="nav-icon-btn" title="Wishlist">
                      <i className="fa-regular fa-heart"></i>
                    </Link>

                    {/* KERANJANG */}
                    <Link href="/keranjang" className="nav-icon-btn relative" title="Keranjang">
                      <i className="fa-solid fa-bag-shopping"></i>
                      <span className="cart-badge" id="cart-count">3</span>
                    </Link>

                    {/* NOTIFIKASI */}
                    <Link href="/pesanan" className="nav-icon-btn relative" title="Notifikasi">
                      <i className="fa-regular fa-bell"></i>
                      <span className="notif-badge"></span>
                    </Link>

                    {/* USER DROPDOWN */}
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setDropdownOpen(!dropdownOpen)
                        }}
                        className="nav-user-btn cursor-pointer"
                      >
                        <div className="avatar-circle">
                          {firstLetter}
                        </div>
                        <span className="hidden lg:inline ml-1 user-name">{user.name}</span>
                      </button>
                      
                      {dropdownOpen && (
                        <div className="absolute right-0 mt-2 user-dropdown shadow z-[9999] bg-white border border-gray-100">
                          <div className="dropdown-header-info border-b border-gray-100">
                            <div className="avatar-circle-lg">
                              {firstLetter}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate text-gray-900">{user.name}</div>
                              <small className="text-gray-500 text-xs truncate block">{user.email}</small>
                            </div>
                          </div>
                          <div className="py-1">
                            <Link href="/profil" className="dropdown-item no-underline">
                              <i className="fa-regular fa-user mr-2"></i> Profil Saya
                            </Link>
                            <Link href="/pesanan" className="dropdown-item no-underline">
                              <i className="fa-regular fa-clipboard mr-2"></i> Pesanan Saya
                            </Link>
                            {user.role === 'umkm' ? (
                              <Link href="/dashboard" className="dropdown-item no-underline">
                                <i className="fa-solid fa-store mr-2"></i> Dashboard Toko
                              </Link>
                            ) : (
                              <Link href="/daftar/merchant" className="dropdown-item no-underline">
                                <i className="fa-solid fa-store mr-2"></i> Daftar Toko
                              </Link>
                            )}
                            <hr className="my-1 border-gray-100" />
                            <button 
                              onClick={() => {
                                logout()
                                setDropdownOpen(false)
                              }}
                              className="dropdown-item text-red-600 hover:text-red-700 w-full text-left"
                            >
                              <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i> Keluar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

            </div>

          </div>
        </div>
      </nav>

      {/* CATEGORY BAR */}
      <div className="category-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="category-scroll">
            <Link 
              href="/produk"
              className={`category-pill ${pathname === '/produk' && !currentKategori ? 'active' : ''}`}
            >
              <i className="fa-solid fa-border-all mr-1"></i> Semua
            </Link>
            <Link 
              href="/produk?kategori=makanan" 
              className={`category-pill ${currentKategori === 'makanan' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-utensils mr-1"></i> Makanan
            </Link>
            <Link 
              href="/produk?kategori=minuman" 
              className={`category-pill ${currentKategori === 'minuman' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-mug-hot mr-1"></i> Minuman
            </Link>
            <Link 
              href="/produk?kategori=kerajinan" 
              className={`category-pill ${currentKategori === 'kerajinan' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-paintbrush mr-1"></i> Kerajinan
            </Link>
            <Link 
              href="/produk?kategori=pertanian" 
              className={`category-pill ${currentKategori === 'pertanian' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-seedling mr-1"></i> Pertanian
            </Link>
            <Link 
              href="/produk?kategori=fashion" 
              className={`category-pill ${currentKategori === 'fashion' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-shirt mr-1"></i> Fashion
            </Link>
            <Link 
              href="/produk?kategori=oleholeh" 
              className={`category-pill ${currentKategori === 'oleholeh' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-gift mr-1"></i> Oleh-oleh
            </Link>
            <Link 
              href="/bumdes" 
              className={`category-pill ${pathname.startsWith('/bumdes') ? 'active' : ''}`}
            >
              <i className="fa-solid fa-building mr-1"></i> BUMDes
            </Link>
            <Link 
              href="/mitra" 
              className={`category-pill ${pathname.startsWith('/mitra') ? 'active' : ''}`} 
              style={{ background: "rgba(244, 162, 97, 0.1)", color: "var(--accent-dark)", borderColor: "var(--accent)" }}
            >
              <i className="fa-solid fa-handshake mr-1"></i> Bergabung dengan Mitra
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

