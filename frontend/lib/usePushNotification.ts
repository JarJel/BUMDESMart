"use client";
import { useEffect } from "react";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase";
import api from "@/lib/api/axios";

export function usePushNotification() {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    requestNotificationPermission(async (token) => {
      try {
        await api.post("/user/fcm-token", { token });
      } catch {
        // token sudah tersimpan atau gagal simpan — abaikan
      }
    });

    let unsubscribe: (() => void) | undefined;
    onForegroundMessage((payload) => {
      const title = payload.notification?.title ?? "BumDesMartNukita";
      const body  = payload.notification?.body ?? "";
      // Tampilkan notif saat app terbuka via Notification API
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/icon-192x192.png" });
      }
    }).then((unsub) => { unsubscribe = unsub; });

    return () => { unsubscribe?.(); };
  }, []);
}
