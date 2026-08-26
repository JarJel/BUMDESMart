"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/api/axios";

interface BumdesProfile {
  id: number;
  name: string;
  slug: string;
  village: string;
  city: string;
  province: string;
  phone: string | null;
  email: string | null;
  status: "active" | "inactive";
  user: { name: string; email: string };
}

export default function AdminBumdesPage() {
  const [list, setList] = useState<BumdesProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/super-admin/bumdes")
      .then((res) => setList(res.data.data?.data ?? res.data.data ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kelola BUMDes</h1>
        <p className="text-sm text-gray-500 mt-0.5">BUMDes Nukita — Desa Lengkong</p>
      </div>

      {/* List BUMDes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Informasi BUMDes</p>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Memuat data...</div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">Data BUMDes tidak ditemukan.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {list.map((b) => (
              <Link
                key={b.id}
                href={`/admin/bumdes/${b.id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{b.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.village}, {b.city}, {b.province}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Admin: {b.user?.name} · {b.user?.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${b.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {b.status === "active" ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
