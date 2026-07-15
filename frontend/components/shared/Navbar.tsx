"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { notificationApi } from "@/lib/api/notification";
import { wishlistApi, WishlistItemData } from "@/lib/api/wishlist";
import { cartApi, CartItemData } from "@/lib/api/cart";
import { NotificationData } from "@/lib/api/notification";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/produk", label: "Produk UMKM" },
  { href: "/mitra", label: "Mitra" },
  { href: "/tentang", label: "Tentang Kami" },
];

// Kelompokkan item keranjang berdasarkan tenant (toko UMKM)
function groupCartByTenant(items: CartItemData[]) {
  const groups: Record<string, { tenantId: number | null; tenantName: string; items: CartItemData[] }> = {};
  items.forEach((item) => {
    const tenantId = item.product?.umkm_profile?.id ?? null;
    const tenantName = item.product?.umkm_profile?.shop_name || item.product?.umkm_profile?.name_umkm || "Toko";
    const key = tenantId !== null ? String(tenantId) : "unknown";
    if (!groups[key]) {
      groups[key] = { tenantId, tenantName, items: [] };
    }
    groups[key].items.push(item);
  });
  return Object.values(groups);
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // States for dropdown content and active toggle
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItemData[]>([]);
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<'notification' | 'wishlist' | 'cart' | 'profile' | null>(null);

  useEffect(() => setMounted(true), []);

  const isLoggedIn = mounted && !loading && !!user;
  const isCustomer = isLoggedIn && user?.role === 'customer';

  const fetchNotifications = async () => {
    if (!isCustomer) return;
    try {
      const res = await notificationApi.list();
      if (res.data && res.data.success) {
        setNotifications(res.data.data);
        const unread = res.data.data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Failed to fetch notifications count in navbar:", err);
    }
  };

  const fetchWishlist = async () => {
    if (!isCustomer) return;
    try {
      const res = await wishlistApi.list();
      if (res.data && res.data.success) {
        setWishlistItems(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    }
  };

  const fetchCart = async () => {
    if (!isCustomer) return;
    try {
      const res = await cartApi.get();
      if (res.data && res.data.success && res.data.data) {
        setCartItems(res.data.data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  };

  useEffect(() => {
    if (!isCustomer) {
      setNotifications([]);
      setWishlistItems([]);
      setCartItems([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();
    fetchWishlist();
    fetchCart();

    window.addEventListener("notificationsUpdated", fetchNotifications);
    window.addEventListener("wishlistUpdated", fetchWishlist);
    window.addEventListener("cartUpdated", fetchCart);

    const interval = setInterval(fetchNotifications, 15000);

    return () => {
      window.removeEventListener("notificationsUpdated", fetchNotifications);
      window.removeEventListener("wishlistUpdated", fetchWishlist);
      window.removeEventListener("cartUpdated", fetchCart);
      clearInterval(interval);
    };
  }, [isCustomer, user]);

  // Click outside to close active dropdown
  useEffect(() => {
    if (!activeDropdown) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.nav-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [activeDropdown]);

  const toggleDropdown = (dropdown: 'notification' | 'wishlist' | 'cart' | 'profile') => {
    setActiveDropdown(prev => {
      const next = prev === dropdown ? null : dropdown;
      if (next === 'wishlist') {
        fetchWishlist();
      } else if (next === 'cart') {
        fetchCart();
      } else if (next === 'notification') {
        fetchNotifications();
      }
      return next;
    });
  };

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

  const formatPrice = (price: string | number | undefined) => {
    if (price === undefined) return "Rp 0";
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return "Rp " + num.toLocaleString("id-ID");
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await notificationApi.delete(id);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleRemoveWishlist = async (productId: number) => {
    try {
      await wishlistApi.remove(productId);
      fetchWishlist();
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
    }
  };

  const handleMoveToCart = async (productId: number) => {
    try {
      await cartApi.add(productId, 1);
      await wishlistApi.remove(productId);
      fetchWishlist();
      fetchCart();
      window.dispatchEvent(new Event("wishlistUpdated"));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Failed to move to cart:", err);
    }
  };

  const handleRemoveCart = async (cartItemId: number) => {
    try {
      await cartApi.remove(cartItemId);
      fetchCart();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Failed to remove from cart:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };


  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <img src="/logo.png" alt="BUMDESmart" className="h-9 w-auto" />
            <span className="text-base font-bold hidden sm:block" style={{ color: "var(--primary-dark)" }}>BUMDESmart</span>
          </Link>

          {/* Search Form (Desktop) */}
          <form action="/produk" method="GET" className="hidden md:flex items-center relative max-w-[180px] lg:max-w-xs xl:max-w-md w-full mx-4">
            <input
              type="text"
              name="q"
              placeholder="Cari produk desa..."
              className="w-full pl-4 pr-9 py-1.5 bg-gray-50 border-1 border-black-600 rounded-full text-xs font-medium focus:outline-none focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-600/10 transition-all text-gray-700 placeholder-gray-400"
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
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {isCustomer ? (
                  <>
                    {/* Pesanan Saya */}
                    <Link
                      href="/pesanan"
                      className="relative p-2 rounded-lg transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:text-green-600 hover:bg-green-50 flex items-center justify-center shrink-0 cursor-pointer"
                      title="Pesanan Saya"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </Link>

                    {/* Notifikasi */}
                    <div
                      className="relative nav-dropdown-container group"
                      onMouseEnter={fetchNotifications}
                    >
                      <button
                        onClick={() => router.push("/profil?tab=Notifikasi")}
                        className="relative p-2 rounded-lg transition-colors cursor-pointer text-gray-500 hover:text-gray-700 hover:bg-gray-50 group-hover:text-green-600 group-hover:bg-green-50"
                        title="Notifikasi"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {unreadCount > 0 && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      <div className="absolute right-0 mt-2 w-[320px] md:w-[380px] bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 overflow-hidden text-left opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out origin-top-right transform scale-95 group-hover:scale-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-50">
                          <h3 className="font-bold text-gray-900 text-sm">Notifikasi</h3>
                          {notifications.some(n => !n.is_read) && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-[11px] font-semibold text-green-600 hover:text-green-700 transition-colors cursor-pointer border-0 bg-transparent"
                            >
                              Tandai semua terbaca
                            </button>
                          )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                              <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                              <p className="text-xs font-medium">Tidak ada notifikasi baru</p>
                            </div>
                          ) : (
                            notifications.slice(0, 5).map((notif) => (
                              <div key={notif.id} className={`p-4 hover:bg-gray-50/50 transition-colors flex gap-3 items-start relative group ${!notif.is_read ? 'bg-green-50/10' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'order' ? 'bg-blue-50 text-blue-600' :
                                    notif.type === 'promo' ? 'bg-amber-50 text-amber-600' :
                                      notif.type === 'wishlist' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
                                  }`}>
                                  {notif.type === 'order'
                                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                    : notif.type === 'promo'
                                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/></svg>
                                    : notif.type === 'wishlist'
                                    ? <svg className="w-4 h-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>}
                                </div>
                                <div className="flex-1 min-w-0 pr-6">
                                  <h4 className="font-semibold text-xs text-gray-900 truncate mb-0.5">{notif.title}</h4>
                                  <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2">{notif.content}</p>
                                  <span className="text-[9px] text-gray-400 mt-1 block">
                                    {new Date(notif.created_at).toLocaleDateString("id-ID", {
                                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                    })}
                                  </span>
                                </div>

                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!notif.is_read && (
                                    <button
                                      onClick={() => handleMarkAsRead(notif.id)}
                                      className="p-1 rounded bg-white border border-gray-100 hover:bg-gray-50 shadow-sm text-gray-500 cursor-pointer"
                                      title="Tandai Terbaca"
                                    >
                                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteNotification(notif.id)}
                                    className="p-1 rounded bg-white border border-gray-100 hover:bg-gray-50 shadow-sm text-gray-500 cursor-pointer"
                                    title="Hapus"
                                  >
                                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>

                                {!notif.is_read && (
                                  <span className="absolute right-4 top-4 w-1.5 h-1.5 bg-green-600 rounded-full group-hover:opacity-0 transition-opacity" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                          <button
                            onClick={() => router.push("/profil?tab=Notifikasi")}
                            className="text-xs font-semibold text-gray-700 hover:text-green-600 transition-colors w-full cursor-pointer border-0 bg-transparent text-center"
                          >
                            Lihat Semua Notifikasi
                          </button>
                        </div>
                      </div>
                    </div>


                  </>
                ) : (
                  <>
                    {user?.role === 'umkm' && (
                      <Link
                        href="/seller"
                        className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700 no-underline"
                      >
                        Dashboard Toko
                      </Link>
                    )}
                    {(user?.role === 'admin_bumdes' || user?.role === 'super_admin') && (
                      <Link
                        href="/admin"
                        className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700 no-underline"
                      >
                        Dashboard Admin
                      </Link>
                    )}
                    {user?.role === 'pengirim' && (
                      <Link
                        href="/pengirim"
                        className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700 no-underline"
                      >
                        Dashboard Pengirim
                      </Link>
                    )}
                  </>
                )}


                {/* Profile */}
                <div className="relative nav-dropdown-container group">
                  <button
                    onClick={() => router.push("/profil")}
                    className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 hover:opacity-90 transition-all flex items-center justify-center shrink-0 ml-1 cursor-pointer group-hover:border-green-600 group-hover:ring-2 group-hover:ring-green-600/20"
                    title="Menu Profil"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:8000${user.avatar}`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "var(--primary)" }}>
                        {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                  </button>

                  <div className="absolute right-0 mt-2 w-[280px] bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 overflow-hidden text-left opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out origin-top-right transform scale-95 group-hover:scale-100">
                    <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center shrink-0 bg-gray-50">
                        {user.avatar ? (
                          <img
                            src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:8000${user.avatar}`}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "var(--primary)" }}>
                            {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-xs truncate">{user.name}</h3>
                        <p className="text-gray-400 text-[10px] truncate mb-1">{user.email}</p>
                        <span className="inline-block text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize text-green-700 bg-green-50">
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 space-y-0.5">
                      <button
                        onClick={() => router.push("/profil")}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border-0 bg-transparent"
                      >
                        Profil Saya
                      </button>

                      {isCustomer && (
                        <button
                          onClick={() => router.push("/profil?tab=Notifikasi")}
                          className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border-0 bg-transparent"
                        >
                          Notifikasi Saya
                        </button>
                      )}


                      {user?.role === 'umkm' && (
                        <button
                          onClick={() => router.push("/seller")}
                          className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border-0 bg-transparent"
                        >
                          Dashboard Toko
                        </button>
                      )}

                      {(user?.role === 'admin_bumdes' || user?.role === 'super_admin') && (
                        <button
                          onClick={() => router.push("/admin")}
                          className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border-0 bg-transparent"
                        >
                          Dashboard Admin
                        </button>
                      )}

                      {user?.role === 'pengirim' && (
                        <button
                          onClick={() => router.push("/pengirim")}
                          className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border-0 bg-transparent"
                        >
                          Dashboard Pengirim
                        </button>
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-50">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border-0 bg-transparent"
                      >
                        Keluar
                      </button>
                    </div>
                  </div>
                </div>
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
                  className="w-full pl-4 pr-10 py-2 bg-gray-50 border-2 border-gray-200 rounded-full text-sm focus:outline-none focus:border-green-600 focus:bg-white transition-all text-gray-700 placeholder-gray-400"
                  style={{ borderWidth: '2px' }}
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
                  <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 shrink-0 border border-gray-200">
                    {user.avatar ? (
                      <img
                        src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:8000${user.avatar}`}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm" style={{ background: "var(--primary)" }}>
                        {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Link href="/profil" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setOpen(false)}>
                  Profil Saya
                </Link>
                {isCustomer ? (
                  <>
                    <Link href="/profil?tab=Notifikasi" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setOpen(false)}>
                      <div className="flex items-center justify-between">
                        <span>Notifikasi</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-[10px] font-bold text-white rounded-full">
                            {unreadCount} Baru
                          </span>
                        )}
                      </div>
                    </Link>
                    <Link href="/pesanan" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setOpen(false)}>
                      Pesanan Saya
                    </Link>
                  </>
                ) : (
                  <>
                    {user?.role === 'umkm' && (
                      <Link href="/seller" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg no-underline" onClick={() => setOpen(false)}>
                        Dashboard Toko (UMKM)
                      </Link>
                    )}
                    {(user?.role === 'admin_bumdes' || user?.role === 'super_admin') && (
                      <Link href="/admin" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg no-underline" onClick={() => setOpen(false)}>
                        Dashboard Admin
                      </Link>
                    )}
                    {user?.role === 'pengirim' && (
                      <Link href="/pengirim" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg no-underline" onClick={() => setOpen(false)}>
                        Dashboard Pengirim
                      </Link>
                    )}
                  </>
                )}
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