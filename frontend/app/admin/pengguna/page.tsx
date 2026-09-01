"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
}

const ROLE_LABEL: Record<string, string> = {
  super_admin:  "Super Admin",
  admin_bumdes: "Admin BUMDes",
  umkm:         "Penjual (UMKM)",
  customer:     "Pembeli",
  pengirim:     "Kurir",
};

const ROLE_COLOR: Record<string, string> = {
  super_admin:  "bg-purple-100 text-purple-700",
  admin_bumdes: "bg-indigo-100 text-indigo-700",
  umkm:         "bg-green-100 text-green-700",
  customer:     "bg-blue-100 text-blue-700",
  pengirim:     "bg-orange-100 text-orange-700",
};

const STATUS_COLOR: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  inactive:  "bg-gray-100 text-gray-500",
  suspended: "bg-red-100 text-red-600",
};

export default function AdminPenggunaPage() {
  const toast = useToast();

  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage]             = useState(1);
  const [lastPage, setLastPage]     = useState(1);
  const [total, setTotal]           = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const handleSuspend = async (user: User) => {
    const isSuspending = user.status !== "suspended";
    
    if (isSuspending && !suspendReason.trim()) {
      toast.error("Alasan penangguhan wajib diisi.");
      return;
    }

    const actionText = isSuspending ? "suspend" : "aktifkan kembali";
    if (!confirm(`Apakah Anda yakin ingin me-${actionText} pengguna "${user.name}"?`)) return;
    try {
      if (isSuspending) {
        await api.post(`/super-admin/users/${user.id}/suspend`, { reason: suspendReason });
      } else {
        await api.post(`/super-admin/users/${user.id}/unsuspend`);
      }
      toast.success(`Pengguna berhasil di-${actionText}.`);
      setSelectedUser(null);
      setSuspendReason("");
      fetchUsers(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? `Gagal me-${actionText} pengguna.`);
    }
  };

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(p) };
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;

      const res = await api.get("/super-admin/users", { params });
      const pagination = res.data.data;
      setUsers(pagination?.data ?? []);
      setLastPage(pagination?.last_page ?? 1);
      setTotal(pagination?.total ?? 0);
      setPage(p);
    } catch {
      toast.error("Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchUsers(1); }, [search, roleFilter]);

  const handleDelete = async (user: User) => {
    if (!confirm(`Hapus akun "${user.name}"?\n\nAksi ini tidak bisa dibatalkan. Lanjutkan?`)) return;
    try {
      await api.delete(`/super-admin/users/${user.id}`);
      toast.success("Akun berhasil dihapus.");
      setSelectedUser(null);
      fetchUsers(page);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Gagal menghapus akun.";
      toast.error(msg);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Manajemen Pengguna</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Daftar seluruh pengguna yang terdaftar di platform ({total} pengguna)
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400"
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 min-w-[160px]"
        >
          <option value="">Semua Role</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin_bumdes">Admin BUMDes</option>
          <option value="umkm">Penjual (UMKM)</option>
          <option value="customer">Pembeli</option>
          <option value="pengirim">Kurir</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Memuat data...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm text-gray-400">Tidak ada pengguna ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Nama</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Telepon</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Terdaftar</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user, i) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {(page - 1) * 20 + i + 1}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{user.name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{user.email}</td>
                    <td className="px-5 py-3.5 text-gray-500">{user.phone ?? "-"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[user.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {new Date(user.created_at).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      {user.role !== "super_admin" && (
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg"
                        >
                          Tinjau
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Halaman {page} dari {lastPage}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => fetchUsers(page - 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Sebelumnya
            </button>
            <button
              disabled={page >= lastPage}
              onClick={() => fetchUsers(page + 1)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Detail Pengguna</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none">
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Nama Lengkap</p>
                <p className="text-sm font-semibold text-gray-900">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Alamat Email</p>
                <p className="text-sm font-semibold text-gray-900">{selectedUser.email}</p>
              </div>
              {selectedUser.phone && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nomor Telepon</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedUser.phone}</p>
                </div>
              )}
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Role</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[selectedUser.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {ROLE_LABEL[selectedUser.role] ?? selectedUser.role}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[selectedUser.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Tanggal Terdaftar</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(selectedUser.created_at).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
            </div>
            <div className="p-5 bg-gray-50 border-t border-gray-100 space-y-4">
              {selectedUser.role !== 'super_admin' && selectedUser.role !== 'admin_bumdes' && selectedUser.status !== 'suspended' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Alasan Penangguhan (Wajib jika ingin Suspend)</label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Masukkan alasan..."
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-red-400 resize-none"
                  />
                </div>
              )}
              
              <div className="flex gap-3">
                <button onClick={() => {
                  setSelectedUser(null);
                  setSuspendReason("");
                }} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                  Tutup
                </button>
                {(selectedUser.role === 'customer' || selectedUser.role === 'umkm') && (
                  <button onClick={() => handleSuspend(selectedUser)} className="flex-1 py-2.5 text-sm font-semibold bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-colors cursor-pointer">
                    {selectedUser.status === 'suspended' ? 'Buka Suspend' : 'Suspend'}
                  </button>
                )}
                <button onClick={() => handleDelete(selectedUser)} className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors cursor-pointer">
                  Hapus Akun
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
