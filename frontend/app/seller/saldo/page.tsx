"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SellerSaldoPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/seller/pengaturan");
  }, [router]);

  return (
    <div className="p-6 flex items-center justify-center min-h-[300px]">
      <p className="text-sm text-gray-400">Mengarahkan ke Pengaturan Toko...</p>
    </div>
  );
}

