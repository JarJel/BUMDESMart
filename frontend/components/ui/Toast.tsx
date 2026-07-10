"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms, 0 = manual dismiss only
}

interface ToastContextValue {
  showToast: (opts: Omit<Toast, "id">) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  dismiss: (id: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ─── Config per type ──────────────────────────────────────────────────────────

const CONFIG: Record<
  ToastType,
  { icon: React.ReactElement; bar: string; bg: string; border: string; title: string; titleColor: string; msgColor: string }
> = {
  success: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bar: "bg-emerald-500",
    bg: "bg-white",
    border: "border-emerald-100",
    title: "Berhasil",
    titleColor: "text-emerald-700",
    msgColor: "text-gray-600",
  },
  error: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bar: "bg-red-500",
    bg: "bg-white",
    border: "border-red-100",
    title: "Gagal",
    titleColor: "text-red-600",
    msgColor: "text-gray-600",
  },
  warning: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    bar: "bg-amber-400",
    bg: "bg-white",
    border: "border-amber-100",
    title: "Perhatian",
    titleColor: "text-amber-700",
    msgColor: "text-gray-600",
  },
  info: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bar: "bg-blue-500",
    bg: "bg-white",
    border: "border-blue-100",
    title: "Info",
    titleColor: "text-blue-700",
    msgColor: "text-gray-600",
  },
};

const ICON_BG: Record<ToastType, string> = {
  success: "bg-emerald-50 text-emerald-600",
  error:   "bg-red-50 text-red-500",
  warning: "bg-amber-50 text-amber-500",
  info:    "bg-blue-50 text-blue-600",
};

// ─── Single Toast Item ─────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const cfg = CONFIG[toast.type];
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 4000;
  const startRef = useRef<number>(Date.now());
  const rafRef = useRef<number | undefined>(undefined);

  // Animate in
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Progress bar + auto dismiss
  useEffect(() => {
    if (duration === 0) return;

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        handleDismiss();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [duration]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`
        relative w-full max-w-sm overflow-hidden rounded-2xl border shadow-lg
        transition-all duration-300 ease-out
        ${cfg.bg} ${cfg.border}
        ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"}
      `}
    >
      {/* Accent bar kiri */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${cfg.bar}`} />

      <div className="flex items-start gap-3 pl-4 pr-3 pt-3.5 pb-3">
        {/* Icon */}
        <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${ICON_BG[toast.type]}`}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className={`text-sm font-bold leading-tight ${cfg.titleColor}`}>
            {toast.title ?? cfg.title}
          </p>
          <p className={`text-xs mt-0.5 leading-relaxed ${cfg.msgColor}`}>
            {toast.message}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="shrink-0 mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Tutup notifikasi"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar bawah */}
      {duration > 0 && (
        <div className="h-0.5 w-full bg-gray-100">
          <div
            className={`h-full transition-none ${cfg.bar} opacity-40`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Toast Container ───────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-[99999] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>,
    document.body
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((opts: Omit<Toast, "id">): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...opts, id }]);
    return id;
  }, []);

  const success = useCallback((message: string, title?: string) =>
    showToast({ type: "success", message, title }), [showToast]);

  const error = useCallback((message: string, title?: string) =>
    showToast({ type: "error", message, title }), [showToast]);

  const warning = useCallback((message: string, title?: string) =>
    showToast({ type: "warning", message, title }), [showToast]);

  const info = useCallback((message: string, title?: string) =>
    showToast({ type: "info", message, title }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
