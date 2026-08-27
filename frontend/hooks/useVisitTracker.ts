"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import api from "@/lib/api/axios";

/**
 * Hook yang secara otomatis mencatat kunjungan halaman ke backend.
 * Menggunakan session_id yang disimpan di sessionStorage agar 1 sesi hanya dihitung 1x per hari.
 */
export function useVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Hanya jalankan di browser
    if (typeof window === "undefined") return;

    try {
      // Buat atau ambil session_id yang persisten selama tab terbuka
      let sessionId = sessionStorage.getItem("visit_session_id");
      if (!sessionId) {
        sessionId =
          crypto.randomUUID?.() ??
          Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("visit_session_id", sessionId);
      }

      // Kirim tracking ke backend (fire & forget, error diabaikan)
      api
        .post("/track-visit", {
          session_id: sessionId,
          page: pathname,
        })
        .catch(() => {
          // Abaikan error — tracking tidak boleh mengganggu UX
        });
    } catch {
      // ignore
    }
  }, [pathname]);
}
