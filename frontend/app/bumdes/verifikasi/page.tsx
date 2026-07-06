"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const DOC_LABEL: Record<string, string> = {
  ktp: "KTP", npwp: "NPWP", nib: "NIB", kk: "Kartu Keluarga",
  siup: "SIUP", situ: "SITU", tdp: "TDP", other: "Dokumen Lainnya",
};

interface Document {
  id: number;
  document_type: string;
  file_path: string;
  notes: string | null;
  status: string;
}

interface Umkm {
  id: number;
  shop_name: string;
  owner_name: string;
  phone: string | null;
  email: string | null;
  status: "pending" | "active" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  verified_at: string | null;
  documents: Document[];
}

const STATUS_COLOR: Record<string, string> = {
  pending:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  active:   "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu", active: "Aktif", rejected: "Ditolak",
};

function getFileUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `http://localhost:8000/storage/${path.replace(/^\/?(storage\/)?/, "")}`;
}

function isPdf(path: string) {
  return path.toLowerCase().endsWith(".pdf");
}

export default function VerifikasiPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "rejected">("pending");
  const [list, setList] = useState<Umkm[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Modal tolak
  const [rejectTarget, setRejectTarget] = useState<Umkm | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { Authorization: `Bearer ${token}` };

  const fetchList = async (status?: string) => {
    setLoading(true);
    try {
      const params = status && status !== "all" ? `?status=${status}` : "";
      const res = await axios.get(`${API}/admin/umkm${params}`, { headers });
      setList(res.data.data ?? []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(filter); }, [filter]);

  const handleVerify = async (id: number) => {
    setActionLoading(id);
    try {
      await axios.put(`${API}/admin/umkm/${id}/verify`, {}, { headers });
      fetchList(filter);
    } catch {}
    finally { setActionLoading(null); }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await axios.put(`${API}/admin/umkm/${rejectTarget.id}/reject`, { reason: rejectReason }, { headers });
      setRejectTarget(null);
      setRejectReason("");
      fetchList(filter);
    } catch {}
    finally { setRejectLoading(false); }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const pending = list.filter(u => u.status === "pending").length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Verifikasi Mitra</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tinjau dan verifikasi pendaftaran mitra baru</p>
        </div>
        {pending > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-semibold text-yellow-700">{pending} menunggu</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "active", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
              filter === f
                ? "text-white bg-green-700 border-green-700"
                : "text-gray-500 bg-white border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "Semua" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-sm text-gray-400">Memuat data...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-400">Tidak ada data mitra.</div>
      ) : (
        <div className="space-y-3">
          {list.map((u) => {
            const expanded = expandedId === u.id;
            return (
              <div key={u.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Header row */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: "#2D6A4F" }}
                      >
                        {u.shop_name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{u.shop_name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[u.status]}`}>
                            {STATUS_LABEL[u.status]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Pemilik: {u.owner_name}</p>
                        <p className="text-xs text-gray-400">{u.phone} · {u.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Daftar: {formatDate(u.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {u.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerify(u.id)}
                            disabled={actionLoading === u.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                            style={{ background: "#2D6A4F" }}
                          >
                            {actionLoading === u.id ? "..." : "Verifikasi"}
                          </button>
                          <button
                            onClick={() => { setRejectTarget(u); setRejectReason(""); }}
                            disabled={actionLoading === u.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50"
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                      {u.status === "active" && (
                        <span className="text-xs text-gray-400">
                          Diverifikasi {u.verified_at ? formatDate(u.verified_at) : "-"}
                        </span>
                      )}
                      {u.status === "rejected" && (
                        <button
                          onClick={() => handleVerify(u.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          Aktifkan
                        </button>
                      )}

                      {/* Toggle dokumen */}
                      {u.documents.length > 0 && (
                        <button
                          onClick={() => setExpandedId(expanded ? null : u.id)}
                          className="flex items-center gap-1 text-xs text-green-700 font-medium hover:underline"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {u.documents.length} Dokumen {expanded ? "▲" : "▼"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Alasan penolakan */}
                  {u.status === "rejected" && u.rejection_reason && (
                    <div className="mt-3 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-xs font-semibold text-red-700 mb-0.5">Alasan Penolakan:</p>
                      <p className="text-xs text-red-600">{u.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {/* Dokumen preview */}
                {expanded && u.documents.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                    <p className="text-xs font-semibold text-gray-700 mb-3">Dokumen yang Diupload</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {u.documents.map((doc) => {
                        const url = getFileUrl(doc.file_path);
                        const pdf = isPdf(doc.file_path);
                        return (
                          <a
                            key={doc.id}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-green-300 hover:shadow-sm transition-all group"
                          >
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-green-50 text-green-700 group-hover:bg-green-100">
                              {pdf ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">
                                {DOC_LABEL[doc.document_type] ?? doc.document_type}
                              </p>
                              <p className="text-xs text-green-600 group-hover:underline">Klik untuk buka</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tolak */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">Tolak Pendaftaran</h3>
            <p className="text-sm text-gray-500 mb-4">
              Toko <strong>{rejectTarget.shop_name}</strong> akan ditolak. Berikan alasan agar seller dapat memperbaiki.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Contoh: Dokumen KTP tidak jelas / tidak valid..."
              rows={4}
              className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:border-red-300"
            />
            <p className="text-xs text-gray-400 mt-1">Alasan akan ditampilkan kepada seller.</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={submitReject}
                disabled={rejectLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
              >
                {rejectLoading ? "Mengirim..." : "Tolak Pendaftaran"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
