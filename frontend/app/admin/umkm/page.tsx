"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Umkm {
  id: number;
  shop_name: string;
  owner_name: string;
  status: string;
  created_at: string;
  bumdes_profile?: { name: string };
}

const STATUS_COLOR: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  pending:   "bg-yellow-100 text-yellow-700",
  rejected:  "bg-red-100 text-red-600",
  suspended: "bg-gray-100 text-gray-500",
};

export default function AdminUmkmPage() {
  const toast = useToast();
  const [list, setList]         = useState<Umkm[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]       = useState(0);

  const [deleting, setDeleting]           = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Umkm | null>(null);

  // Dialog kedua: muncul kalau toko punya transaksi
  const [blockedTarget, setBlockedTarget] = useState<Umkm | null>(null);
  const [blockMsg, setBlockMsg]           = useState("");
  const [suspending, setSuspending]       = useState(false);

  const handleDeleteShop = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/super-admin/umkm/${confirmTarget.id}`);
      toast.success(`Toko "${confirmTarget.shop_name}" berhasil dihapus.`);
      setConfirmTarget(null);
      fetchList(page);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Gagal menghapus toko.";
      // Kalau 422 karena ada transaksi → buka dialog alternatif
      if (err?.response?.status === 422) {
        setConfirmTarget(null);
        setBlockMsg(msg);
        setBlockedTarget(confirmTarget);
      } else {
        toast.error(msg);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleSuspendShop = async () => {
    if (!blockedTarget) return;
    setSuspending(true);
    try {
      await api.patch(`/super-admin/umkm/${blockedTarget.id}/status`, { status: "suspended" });
      toast.success(`Toko "${blockedTarget.shop_name}" berhasil dinonaktifkan.`);
      setBlockedTarget(null);
      fetchList(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Gagal menonaktifkan toko.");
    } finally {
      setSuspending(false);
    }
  };

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
                  <th className="px-5 py-3" />
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
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setConfirmTarget(u)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors bg-red-50 px-3 py-1.5 rounded-lg"
                      >
                        Hapus
                      </button>
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

      {/* Dialog konfirmasi hapus */}
      <ConfirmDialog
        open={!!confirmTarget}
        variant="danger"
        title="Hapus Toko?"
        description={confirmTarget ? `Toko "${confirmTarget.shop_name}" beserta semua produk dan dokumennya akan dihapus permanen. Akun pemilik tetap ada. Tindakan ini tidak bisa dibatalkan.` : ""}
        confirmLabel="Ya, Hapus Toko"
        loading={deleting}
        onConfirm={handleDeleteShop}
        onClose={() => !deleting && setConfirmTarget(null)}
      />

      {/* Dialog toko punya transaksi — tawarkan nonaktifkan */}
      {blockedTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => !suspending && setBlockedTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="h-1 w-full bg-amber-400" />
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-amber-50 text-amber-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 text-center mb-1">Toko Tidak Bisa Dihapus</h3>
              <p className="text-sm text-gray-500 text-center leading-relaxed mb-1">{blockMsg}</p>
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                Ingin menonaktifkan toko ini saja agar tidak bisa berjualan?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setBlockedTarget(null)}
                  disabled={suspending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSuspendShop}
                  disabled={suspending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {suspending && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Nonaktifkan Toko
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
