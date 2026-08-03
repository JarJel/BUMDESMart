"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api/axios";

interface BumdesDetail {
  id: number;
  name: string;
  slug: string;
  village: string;
  district?: string;
  city: string;
  province: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  description?: string;
  status: string;
  created_at: string;
  user: { id: number; name: string; email: string };
  umkm_profiles: UmkmRow[];
}

interface UmkmRow {
  id: number;
  shop_name: string;
  owner_name: string;
  business_category?: string;
  status: string;
  rating?: number;
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  active:   "bg-green-50 text-green-700",
  pending:  "bg-yellow-50 text-yellow-700",
  rejected: "bg-red-50 text-red-600",
  inactive: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif", pending: "Pending", rejected: "Ditolak", inactive: "Nonaktif",
};

export default function BumdesDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [bumdes, setBumdes] = useState<BumdesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"info" | "umkm">("info");

  useEffect(() => {
    if (!id) return;
    api.get(`/super-admin/bumdes/${id}`)
      .then(r => setBumdes(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="h-6 bg-gray-100 animate-pulse rounded-xl w-48 mb-4" />
        <div className="h-40 bg-gray-50 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!bumdes) {
    return (
      <div className="p-4 sm:p-6 text-center text-sm text-gray-400 py-16">
        BUMDes tidak ditemukan.
        <Link href="/admin/bumdes" className="block mt-2 text-indigo-600 hover:underline text-xs">← Kembali</Link>
      </div>
    );
  }

  const umkmList = bumdes.umkm_profiles ?? [];
  const activeCount  = umkmList.filter(u => u.status === "active").length;
  const pendingCount = umkmList.filter(u => u.status === "pending").length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/bumdes" className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 shrink-0 mt-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 truncate">{bumdes.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bumdes.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {bumdes.status === "active" ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{bumdes.village}, {bumdes.city}, {bumdes.province}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total UMKM",   value: umkmList.length },
          { label: "UMKM Aktif",   value: activeCount     },
          { label: "Menunggu",     value: pendingCount    },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
            <p className="text-xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl self-start w-fit">
        {([["info", "Info BUMDes"], ["umkm", "Daftar UMKM"]] as const).map(([key, lbl]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${tab === key ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {[
            { label: "Desa",         value: bumdes.village                     },
            { label: "Kecamatan",    value: bumdes.district ?? "—"             },
            { label: "Kota",         value: bumdes.city                        },
            { label: "Provinsi",     value: bumdes.province                    },
            { label: "Kode Pos",     value: bumdes.postal_code ?? "—"         },
            { label: "Telepon",      value: bumdes.phone ?? "—"               },
            { label: "Email",        value: bumdes.email ?? "—"               },
            { label: "Admin",        value: bumdes.user?.name ?? "—"          },
            { label: "Email Admin",  value: bumdes.user?.email ?? "—"         },
            { label: "Terdaftar",    value: new Date(bumdes.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) },
          ].map(row => (
            <div key={row.label} className="flex items-start justify-between px-5 py-3 gap-4">
              <span className="text-xs text-gray-500 shrink-0 w-28">{row.label}</span>
              <span className="text-xs font-medium text-gray-900 text-right break-all">{row.value}</span>
            </div>
          ))}
          {bumdes.description && (
            <div className="px-5 py-3">
              <p className="text-xs text-gray-500 mb-1">Deskripsi</p>
              <p className="text-xs text-gray-700 leading-relaxed">{bumdes.description}</p>
            </div>
          )}
        </div>
      )}

      {tab === "umkm" && (
        <div className="bg-white rounded-2xl border border-gray-100">
          {umkmList.length === 0 ? (
            <p className="px-5 py-8 text-xs text-center text-gray-400">Belum ada UMKM di BUMDes ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-50">
                    <th className="text-left px-5 py-3 font-medium">Toko</th>
                    <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Kategori</th>
                    <th className="text-center px-5 py-3 font-medium">Status</th>
                    <th className="text-right px-5 py-3 font-medium">Rating</th>
                    <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">Bergabung</th>
                  </tr>
                </thead>
                <tbody>
                  {umkmList.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{u.shop_name}</p>
                        <p className="text-gray-400 mt-0.5">{u.owner_name}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{u.business_category ?? "—"}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[u.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {STATUS_LABEL[u.status] ?? u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-amber-500 font-medium">
                          {u.rating && Number(u.rating) > 0 ? `${Number(u.rating).toFixed(1)}★` : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400 hidden sm:table-cell">
                        {new Date(u.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
