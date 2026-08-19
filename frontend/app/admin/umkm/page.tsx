"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/axios";

interface Umkm {
  id: number;
  shop_name: string;
  owner_name: string;
  status: string;
  created_at: string;
  bumdes_profile?: { name: string };
}

const STATUS_COLOR: Record<string, string> = {
  active:   "bg-green-100 text-green-700",
  pending:  "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-600",
};

export default function AdminUmkmPage() {
  const [list, setList]       = useState<Umkm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]     = useState(0);

  const fetchList = async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(p) };
      if (search) params.search = search;
      const res = await api.get("/super-admin/umkm", { params });
      const pagination = res.data.data;
      setList(pagination?.data ?? []);
      setLastPage(pagination?.last_page ?? 1);
      setTotal(pagination?.total ?? 0);
      setPage(p);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(1); }, [search]); // eslint-disable-line

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Semua UMKM</h1>
        <p className="text-sm text-gray-500 mt-0.5">Daftar seluruh UMKM/penjual di platform ({total} UMKM)</p>
      </div>

      <div className="relative mb-5 max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text" placeholder="Cari nama toko..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400"
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Memuat data...</div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Tidak ada UMKM ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Nama Toko</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Pemilik</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">BUMDes</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Terdaftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map((u, i) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{(page - 1) * 20 + i + 1}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{u.shop_name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{u.owner_name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{u.bumdes_profile?.name ?? "-"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[u.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">Halaman {page} dari {lastPage}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => fetchList(page - 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
              ← Sebelumnya
            </button>
            <button disabled={page >= lastPage} onClick={() => fetchList(page + 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
              Berikutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
