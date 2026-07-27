"use client";

import { useEffect } from "react";
import api from "@/lib/api/axios";

const ONESIGNAL_APP_ID = "580a335a-9296-4eb8-b0f0-f20f62b71048";

async function savePlayerId(id: string) {
  try {
    await api.post("/device-token", {
      token: id,
      device_id: navigator.userAgent.slice(0, 100),
    });
  } catch { }
}

export default function OneSignalInit() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (typeof window === "undefined") return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: true,
      });

      // Minta izin
      await OneSignal.Notifications.requestPermission();

      // Simpan ID yang sudah ada
      const currentId = OneSignal.User?.PushSubscription?.id;
      if (currentId) {
        await savePlayerId(currentId);
        return;
      }

      // Tunggu subscribe berhasil lalu simpan
      OneSignal.User?.PushSubscription?.addEventListener("change", async (event: any) => {
        const id = event.current?.id;
        if (id) await savePlayerId(id);
      });
    });

    // Load SDK kalau belum ada
    if (!document.getElementById("onesignal-sdk")) {
      const script = document.createElement("script");
      script.id = "onesignal-sdk";
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  return null;
}
