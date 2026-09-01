"use client";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { useVisitTracker } from "@/hooks/useVisitTracker";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api/axios";

function VisitTrackerMount() {
  useVisitTracker();
  return null;
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Halaman maintenance sendiri tidak perlu dicek
    if (pathname === "/maintenance") {
      setReady(true);
      return;
    }

    api.get("/platform-status")
      .then(res => {
        if (res.data.maintenance) {
          router.replace("/maintenance");
        } else {
          setReady(true);
        }
      })
      .catch(() => {
        // Jika gagal cek (network error), tetap tampilkan konten
        setReady(true);
      });
  }, [pathname, router]);

  if (!ready && pathname !== "/maintenance") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <VisitTrackerMount />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
