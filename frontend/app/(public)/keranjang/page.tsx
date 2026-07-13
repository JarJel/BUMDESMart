"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KeranjangPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/checkout");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#F4F7F5" }}>
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
    </div>
  );
}
