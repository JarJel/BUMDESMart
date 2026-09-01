"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import api from "@/lib/api/axios";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  // Polling setiap 30 detik — kalau maintenance selesai, redirect ke beranda
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get("/platform-status");
        if (!res.data.maintenance) {
          router.replace("/");
        }
      } catch {
        // tetap di halaman maintenance
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [router]);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const res = await api.get("/platform-status");
      if (!res.data.maintenance) {
        router.replace("/");
      }
    } catch {
      // tetap
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-4 text-center">
      <div className="w-20 h-20 mb-6 relative">
        <Image src="/logo.png" alt="BumDesMartNukita" fill className="object-contain" />
      </div>

      <div className="w-14 h-14 mb-6 rounded-2xl bg-amber-50 flex items-center justify-center">
        <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sedang dalam Pemeliharaan</h1>
      <p className="text-gray-500 text-sm max-w-sm mb-8">
        Kami sedang melakukan pembaruan sistem untuk meningkatkan layanan.
        Mohon tunggu sebentar dan coba kembali.
      </p>

      <button
        onClick={handleRefresh}
        disabled={checking}
        className="px-6 py-2.5 rounded-xl bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition disabled:opacity-60"
      >
        {checking ? "Memeriksa..." : "Cek Kembali"}
      </button>

      <p className="mt-10 text-xs text-gray-400">
        BumDesMartNukita &mdash; bumdesmartnukita.com
      </p>
    </div>
  );
}
