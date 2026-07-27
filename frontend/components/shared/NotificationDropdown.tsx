"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api/axios";

// AudioContext shared — dibuat sekali, di-resume setelah user gesture
let sharedCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (!sharedCtx) {
      sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (sharedCtx.state === "suspended") {
      sharedCtx.resume();
    }
    return sharedCtx;
  } catch (e) {
    console.warn("[Notif] AudioContext gagal dibuat:", e);
    return null;
  }
}

// Dipanggil sekali saat user pertama kali klik — "membuka kunci" AudioContext
export function unlockAudio() {
  getAudioCtx();
}

function playNotifSound(type: string) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "order_new") {
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.setValueAtTime(780, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === "stock_warning") {
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(260, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
    console.log("[Notif] Suara diputar, tipe:", type);
  } catch (e) {
    console.warn("[Notif] Gagal putar suara:", e);
  }
}

interface Notif {
  id: number;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
  reference_type?: string;
  reference_id?: number;
}

const TYPE_ICON: Record<string, string> = {
  order_new: "🛍️",
  order_confirmed: "✅",
  order_cancelled: "❌",
  order_shipped: "🚚",
  order_delivered: "📦",
  stock_warning: "⚠️",
  info: "ℹ️",
  promo: "🏷️",
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef<number | null>(null);

  const fetchNotifs = useCallback(() => {
    setLoading(true);
    api.get("/notifications")
      .then(res => {
        const data = res.data.data?.data ?? res.data.data ?? [];
        const items: Notif[] = Array.isArray(data) ? data : [];
        const newUnread: number = res.data.unread_count ?? 0;

        // Bunyikan suara kalau unread bertambah sejak fetch terakhir
        if (prevUnreadRef.current !== null && newUnread > prevUnreadRef.current) {
          playNotifSound(items[0]?.type ?? "info");
        }
        prevUnreadRef.current = newUnread;

        setNotifs(items);
        setUnread(newUnread);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNotifs();
    const timer = setInterval(fetchNotifs, 15_000);
    return () => clearInterval(timer);
  }, [fetchNotifs]);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = (id: number) => {
    api.put(`/notifications/${id}/read`).catch(() => { });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllRead = () => {
    api.put("/notifications/read-all").catch(() => { });
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Bell Button */}
      <button
        onClick={() => { unlockAudio(); setOpen(!open); }}
        className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 relative"
        aria-label="Notifikasi"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Notifikasi</h3>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600">{unread} baru</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] font-medium text-gray-400 hover:text-gray-700">
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifs.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">Memuat...</div>
            ) : notifs.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-xs text-gray-400">Belum ada notifikasi</p>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${n.is_read ? "bg-white" : "bg-blue-50/40 hover:bg-blue-50"
                    }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                    {TYPE_ICON[n.type] ?? "🔔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${n.is_read ? "text-gray-700" : "text-gray-900 font-semibold"}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
