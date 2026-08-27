"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { notificationApi, NotificationData } from "@/lib/api/notification";

type FilterType = "all" | "unread" | "order" | "promo" | "info";

export default function NotifikasiPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>("all");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await notificationApi.list(pageNum);
      if (res.data?.success) {
        const payload = res.data.data;
        const items = Array.isArray(payload) ? payload : (payload?.data ?? []);
        const totalPages = Array.isArray(payload) ? 1 : (payload?.last_page ?? 1);

        if (append) {
          setNotifications((prev) => [...prev, ...items]);
        } else {
          setNotifications(items);
        }

        setLastPage(totalPages);
        setPage(pageNum);
        setUnreadCount(res.data.unread_count ?? items.filter((n: any) => !n.is_read).length);
      }
    } catch (err) {
      console.error("Gagal memuat notifikasi:", err);
      toast.error("Gagal memuat daftar notifikasi");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchNotifications(1, false);
    }
  }, [user, fetchNotifications]);

  // Load more function
  const handleLoadMore = () => {
    if (page < lastPage && !loadingMore) {
      fetchNotifications(page + 1, true);
    }
  };

  // Mark single as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      
      // Dispatch event to sync with navbar
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (err) {
      console.error("Gagal menandai dibaca:", err);
      toast.error("Gagal memperbarui notifikasi");
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      // Dispatch event to sync with navbar
      window.dispatchEvent(new Event("notificationsUpdated"));
      toast.success("Semua notifikasi berhasil ditandai dibaca");
    } catch (err) {
      console.error("Gagal menandai semua dibaca:", err);
      toast.error("Gagal memperbarui notifikasi");
    }
  };

  // Delete notification
  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.delete(id);
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      
      // Dispatch event to sync with navbar
      window.dispatchEvent(new Event("notificationsUpdated"));
      toast.success("Notifikasi berhasil dihapus");
    } catch (err) {
      console.error("Gagal menghapus notifikasi:", err);
      toast.error("Gagal menghapus notifikasi");
    }
  };

  // Navigate when notification is clicked
  const handleNotifClick = async (notif: any) => {
    if (!notif.is_read) {
      await handleMarkAsRead(notif.id);
    }
    
    // Redirect if it has a reference to order
    const refId = notif.reference_id;
    const refType = notif.reference_type || notif.type;
    
    if (refType === "order" && refId) {
      router.push(`/pesanan/${refId}`);
    }
  };

  // Filter notifications on client side
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "order") return n.type === "order" || n.type?.startsWith("order_");
    if (filter === "promo") return n.type === "promo";
    if (filter === "info") return n.type === "info" || (n.type !== "order" && !n.type?.startsWith("order_") && n.type !== "promo" && n.type !== "wishlist");
    return true;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "order":
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
        );
      case "promo":
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>
            </svg>
          </div>
        );
      case "wishlist":
        return (
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
          </div>
        );
    }
  };

  const getFilterClass = (active: boolean) => {
    return `px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer ${
      active
        ? "bg-green-600 text-white shadow-sm shadow-green-100"
        : "bg-white text-gray-500 border border-gray-100 hover:border-gray-200 hover:text-gray-700"
    }`;
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Memuat halaman...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[60vh]">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-xs text-gray-400 flex items-center gap-1.5 font-medium">
        <Link href="/" className="hover:text-green-600 transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <span className="text-gray-600">Notifikasi</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Notifikasi Saya
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 animate-pulse">
                {unreadCount} Baru
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Lihat semua pemberitahuan dan status transaksi Anda di BumDesMartNukita
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all duration-200 cursor-pointer self-start sm:self-auto border-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setFilter("all")}
          className={getFilterClass(filter === "all")}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={getFilterClass(filter === "unread")}
        >
          Belum Dibaca
        </button>
        <button
          onClick={() => setFilter("order")}
          className={getFilterClass(filter === "order")}
        >
          Transaksi
        </button>
        <button
          onClick={() => setFilter("promo")}
          className={getFilterClass(filter === "promo")}
        >
          Promo
        </button>
        <button
          onClick={() => setFilter("info")}
          className={getFilterClass(filter === "info")}
        >
          Info & Sistem
        </button>
      </div>

      {/* List content */}
      <div className="space-y-4">
        {loading ? (
          // Skeleton Loader
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 flex gap-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100/50">
              <svg className="w-10 h-10 text-gray-300 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-700 mb-1">Tidak Ada Notifikasi</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto px-4">
              {filter === "unread"
                ? "Bagus sekali! Semua notifikasi Anda sudah dibaca."
                : "Saat ini Anda belum memiliki pemberitahuan di filter ini."}
            </p>
            <Link
              href="/produk"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 rounded-xl text-white bg-green-600 hover:bg-green-700 transition-colors mt-5 no-underline border-0 cursor-pointer"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          // List Cards
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const hasRef = !!notif.reference_id && (notif.reference_type === "order" || notif.type === "order" || notif.type?.startsWith("order_"));
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`p-5 bg-white rounded-2xl border transition-all duration-200 flex gap-4 relative group select-none ${
                    hasRef ? "cursor-pointer" : ""
                  } ${
                    notif.is_read
                      ? "border-gray-100 hover:border-gray-200"
                      : "border-green-500/25 bg-green-50/5 hover:border-green-500/40"
                  }`}
                >
                  {/* Icon */}
                  {getNotifIcon(notif.type?.startsWith("order_") ? "order" : notif.type)}

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm sm:text-base leading-snug truncate pr-6 ${
                        notif.is_read ? "text-gray-800 font-medium" : "text-gray-900 font-bold"
                      }`}>
                        {notif.title}
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed break-words">
                      {notif.content}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
                        {new Date(notif.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      
                      {hasRef && (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                          Pesanan #{notif.reference_id}
                          <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {!notif.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                        }}
                        className="p-2 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-green-600 shadow-sm transition-all duration-200 cursor-pointer"
                        title="Tandai Terbaca"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notif.id, e)}
                      className="p-2 rounded-xl bg-white border border-gray-100 hover:border-red-100 hover:bg-red-50 text-red-500 shadow-sm transition-all duration-200 cursor-pointer"
                      title="Hapus Notifikasi"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Unread indicator dot */}
                  {!notif.is_read && (
                    <span className="absolute right-4 top-4 w-2.5 h-2.5 bg-green-500 rounded-full group-hover:opacity-0 transition-opacity duration-200" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {page < lastPage && !loading && (
          <div className="text-center pt-6">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold px-6 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Memuat...
                </>
              ) : (
                "Muat Lebih Banyak"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
