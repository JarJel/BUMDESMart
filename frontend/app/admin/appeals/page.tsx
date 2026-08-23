"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

interface Appeal {
  id: number;
  user_id: number | null;
  email: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
  };
}

export default function AppealsPage() {
  const toast = useToast();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchAppeals = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get("/super-admin/appeals", {
        params: {
          page: p,
          status: filterStatus !== "all" ? filterStatus : undefined,
        },
      });
      setAppeals(res.data.data.data);
      setPage(res.data.meta.page);
      setLastPage(res.data.data.last_page || 1);
      setTotal(res.data.meta.total);
    } catch (err: any) {
      toast.error("Gagal mengambil data pengajuan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals(1);
  }, [filterStatus]);

  const handleResolve = async (decision: 'approved' | 'rejected') => {
    if (!selectedAppeal) return;
    
    if (decision === 'rejected' && !adminNote.trim()) {
      toast.error("Catatan admin wajib diisi untuk penolakan.");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin ${decision === 'approved' ? 'menyetujui' : 'menolak'} pengajuan ini?`)) return;

    setResolving(true);
    try {
      await api.post(`/super-admin/appeals/${selectedAppeal.id}/resolve`, {
        decision,
        admin_note: adminNote
      });
      toast.success(`Pengajuan berhasil ${decision === 'approved' ? 'disetujui' : 'ditolak'}.`);
      setSelectedAppeal(null);
      setAdminNote("");
      fetchAppeals(page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Gagal memproses pengajuan.");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengajuan (Appeals)</h1>
          <p className="text-sm text-gray-500 mt-1">Tinjau dan kelola permohonan pengaktifan kembali akun.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-green-400"
            >
              <option value="pending">Menunggu (Pending)</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="all">Semua Status</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            Total data: <span className="font-semibold text-gray-900">{total}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tgl Pengajuan</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Pemohon</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Info Pengguna</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-green-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memuat data...
                  </td>
                </tr>
              ) : appeals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Tidak ada data pengajuan yang ditemukan.
                  </td>
                </tr>
              ) : (
                appeals.map((appeal) => (
                  <tr key={appeal.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(appeal.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{appeal.email}</div>
                    </td>
                    <td className="p-4">
                      {appeal.user ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{appeal.user.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{appeal.user.role.replace('_', ' ')}</div>
                          <div className={`text-xs mt-1 ${appeal.user.status === 'suspended' ? 'text-red-500' : 'text-green-500'}`}>
                            Status: {appeal.user.status}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Pengguna tidak ditemukan</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        appeal.status === 'approved' ? 'bg-green-100 text-green-800' :
                        appeal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {appeal.status === 'approved' ? 'Disetujui' :
                         appeal.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedAppeal(appeal)}
                        className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        Tinjau
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && total > 0 && lastPage > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => fetchAppeals(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
          >
            Sebelumnya
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl border border-gray-100">
            Halaman {page} dari {lastPage}
          </span>
          <button
            onClick={() => fetchAppeals(page + 1)}
            disabled={page === lastPage}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
          >
            Selanjutnya
          </button>
        </div>
      )}

      {/* Tinjau Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Tinjau Pengajuan</h3>
              <button
                onClick={() => {
                  setSelectedAppeal(null);
                  setAdminNote("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase">Informasi Pemohon</h4>
                <p className="text-sm font-medium mt-1">Email: {selectedAppeal.email}</p>
                {selectedAppeal.user && (
                  <p className="text-sm text-gray-600 mt-1">Nama: {selectedAppeal.user.name} | Peran: <span className="capitalize">{selectedAppeal.user.role.replace('_', ' ')}</span></p>
                )}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase">Alasan Pengajuan</h4>
                <div className="mt-2 p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedAppeal.reason}
                </div>
              </div>
              
              {selectedAppeal.status === 'pending' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Catatan Admin (Opsional untuk setuju, Wajib untuk tolak)</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Tambahkan catatan untuk pengguna..."
                    rows={3}
                    className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-green-400 resize-none"
                  />
                </div>
              )}
            </div>
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setSelectedAppeal(null);
                  setAdminNote("");
                }}
                className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 bg-white rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Tutup
              </button>
              
              {selectedAppeal.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleResolve('rejected')}
                    disabled={resolving}
                    className="flex-1 py-2.5 text-sm font-semibold bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    {resolving ? 'Memproses...' : 'Tolak'}
                  </button>
                  <button
                    onClick={() => handleResolve('approved')}
                    disabled={resolving}
                    className="flex-1 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {resolving ? 'Memproses...' : 'Setujui & Aktifkan'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
