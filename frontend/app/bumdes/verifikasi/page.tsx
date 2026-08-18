"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { getFileUrl as _getFileUrl } from "@/lib/storage";

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
  business_category: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  logo: string | null;
  nib: string | null;
  npwp: string | null;
  halal_cert: string | null;
  halal_number: string | null;
  rating: number | null;
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
  return _getFileUrl(path) ?? "";
}

function isPdf(path: string) {
  return path.toLowerCase().endsWith(".pdf");
}

export default function VerifikasiPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "rejected">("pending");
  const [list, setList] = useState<Umkm[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Modal review
  const [reviewTarget, setReviewTarget] = useState<Umkm | null>(null);
  const [reviewTab, setReviewTab] = useState<"profil" | "dokumen">("profil");
  const [docIdx, setDocIdx] = useState(0);
  const [imgError, setImgError] = useState(false);

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
      setReviewTarget(null);
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
      setReviewTarget(null);
      fetchList(filter);
    } catch {}
    finally { setRejectLoading(false); }
  };

  const openReview = (u: Umkm) => {
    setReviewTarget(u);
    setReviewTab("profil");
    setDocIdx(0);
    setImgError(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const pending = list.filter(u => u.status === "pending").length;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Verifikasi Mitra</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tinjau dokumen dan verifikasi pendaftaran mitra baru</p>
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
          {list.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {u.logo ? (
                      <img src={getFileUrl(u.logo)} alt={u.shop_name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: "#2D6A4F" }}
                      >
                        {u.shop_name[0]}
                      </div>
                    )}
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
                    <button
                      onClick={() => openReview(u)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-200 text-green-700 hover:bg-green-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Tinjau Mitra {u.documents.length > 0 && `(${u.documents.length} dok)`}
                    </button>

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
                  </div>
                </div>

                {u.status === "rejected" && u.rejection_reason && (
                  <div className="mt-3 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-xs font-semibold text-red-700 mb-0.5">Alasan Penolakan:</p>
                    <p className="text-xs text-red-600">{u.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Review ── */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {reviewTarget.logo ? (
                  <img src={getFileUrl(reviewTarget.logo)} alt="logo" className="w-9 h-9 rounded-xl object-cover shrink-0 border border-gray-100" />
                ) : (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "#2D6A4F" }}>
                    {reviewTarget.shop_name[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{reviewTarget.shop_name}</p>
                  <p className="text-xs text-gray-400">{reviewTarget.owner_name}</p>
                </div>
              </div>
              <button onClick={() => setReviewTarget(null)} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs utama */}
            <div className="flex border-b border-gray-100 px-5 shrink-0">
              <button
                onClick={() => setReviewTab("profil")}
                className={`py-2.5 px-1 mr-5 text-xs font-semibold border-b-2 transition ${reviewTab === "profil" ? "border-green-700 text-green-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >Profil Usaha</button>
              <button
                onClick={() => setReviewTab("dokumen")}
                className={`py-2.5 px-1 text-xs font-semibold border-b-2 transition ${reviewTab === "dokumen" ? "border-green-700 text-green-700" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >
                Dokumen ({reviewTarget.documents.length})
              </button>
            </div>

            {/* Tab: Profil Usaha */}
            {reviewTab === "profil" && (
              <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0 space-y-4">
                {/* Info kontak */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Nama Pemilik", value: reviewTarget.owner_name },
                    { label: "No. HP", value: reviewTarget.phone ?? "—" },
                    { label: "Email", value: reviewTarget.email ?? "—" },
                    { label: "Kategori Usaha", value: reviewTarget.business_category ?? "—" },
                    { label: "Kota", value: reviewTarget.city ?? "—" },
                    { label: "Provinsi", value: reviewTarget.province ?? "—" },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">{item.label}</p>
                      <p className="text-xs font-semibold text-gray-800 break-all">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Alamat */}
                {reviewTarget.address && (
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Alamat</p>
                    <p className="text-xs text-gray-800">{reviewTarget.address}</p>
                  </div>
                )}

                {/* Deskripsi */}
                {reviewTarget.description && (
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Deskripsi Usaha</p>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{reviewTarget.description}</p>
                  </div>
                )}

                {/* Legalitas */}
                {(reviewTarget.nib || reviewTarget.npwp || reviewTarget.halal_number) && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-2">Legalitas</p>
                    <div className="space-y-2">
                      {reviewTarget.nib && (
                        <div className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-xl">
                          <span className="text-xs font-semibold text-green-700">NIB</span>
                          <span className="text-xs text-gray-700 font-mono">{reviewTarget.nib}</span>
                        </div>
                      )}
                      {reviewTarget.npwp && (
                        <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-xl">
                          <span className="text-xs font-semibold text-blue-700">NPWP</span>
                          <span className="text-xs text-gray-700 font-mono">{reviewTarget.npwp}</span>
                        </div>
                      )}
                      {reviewTarget.halal_number && (
                        <div className="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-xl">
                          <span className="text-xs font-semibold text-amber-700">Sertifikat Halal</span>
                          <span className="text-xs text-gray-700 font-mono">{reviewTarget.halal_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rating kalau sudah aktif sebelumnya */}
                {reviewTarget.rating !== null && reviewTarget.rating > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 rounded-xl">
                    <span className="text-amber-500 text-sm">★</span>
                    <span className="text-xs font-semibold text-amber-700">{Number(reviewTarget.rating).toFixed(1)}</span>
                    <span className="text-xs text-gray-400">rating toko</span>
                  </div>
                )}

                {/* Tanggal */}
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>Daftar: {formatDate(reviewTarget.created_at)}</span>
                  {reviewTarget.verified_at && <span>· Diverifikasi: {formatDate(reviewTarget.verified_at)}</span>}
                </div>
              </div>
            )}

            {/* Tab: Dokumen */}
            {reviewTab === "dokumen" && (
              <>
                {reviewTarget.documents.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-gray-400 py-16">
                    Belum ada dokumen yang diunggah.
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Navigasi Dokumen Atas */}
                    {reviewTarget.documents.length > 1 && (
                      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
                        <button
                          onClick={() => { setDocIdx(i => Math.max(0, i - 1)); setImgError(false); }}
                          disabled={docIdx === 0}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 bg-white disabled:opacity-30 disabled:hover:bg-white hover:bg-gray-50 transition-colors shrink-0"
                        >
                          Sebelumnya
                        </button>
                        <span className="text-xs font-bold text-gray-700">
                          Dokumen {docIdx + 1} dari {reviewTarget.documents.length}
                        </span>
                        <button
                          onClick={() => { setDocIdx(i => Math.min(reviewTarget.documents.length - 1, i + 1)); setImgError(false); }}
                          disabled={docIdx === reviewTarget.documents.length - 1}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 bg-white disabled:opacity-30 disabled:hover:bg-white hover:bg-gray-50 transition-colors shrink-0"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    )}

                    {/* Preview area */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
                      {(() => {
                        const doc = reviewTarget.documents[docIdx];
                        if (!doc) return null;
                        const url = getFileUrl(doc.file_path);
                        const pdf = isPdf(doc.file_path);
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between bg-green-50/50 border border-green-100 rounded-xl px-4 py-2.5">
                              <p className="text-xs font-bold text-green-800">{DOC_LABEL[doc.document_type] ?? doc.document_type}</p>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-green-700 hover:underline font-semibold">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                Buka
                              </a>
                            </div>
                            {pdf ? (
                              <div className="w-full rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                                <iframe src={url} className="w-full" style={{ height: "380px" }} title={DOC_LABEL[doc.document_type] ?? doc.document_type} />
                              </div>
                            ) : imgError ? (
                              <div className="w-full rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center py-12 gap-3">
                                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <p className="text-xs text-gray-400 text-center">Gambar tidak dapat dimuat.</p>
                                <a href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: "#2D6A4F" }}>Buka Dokumen</a>
                              </div>
                            ) : (
                              <div className="w-full rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                                <img src={url} alt={DOC_LABEL[doc.document_type] ?? doc.document_type} className="max-w-full max-h-[380px] object-contain" onError={() => setImgError(true)} />
                              </div>
                            )}
                            {doc.notes && (
                              <div className="px-3 py-2 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-700">
                                <span className="font-semibold">Catatan: </span>{doc.notes}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Footer aksi */}
            {reviewTarget.status === "pending" && (
              <div className="px-5 py-4 border-t border-gray-100 flex gap-3 shrink-0">
                <button
                  onClick={() => { setRejectTarget(reviewTarget); setRejectReason(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                >
                  Tolak Pendaftaran
                </button>
                <button
                  onClick={() => handleVerify(reviewTarget.id)}
                  disabled={actionLoading === reviewTarget.id}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                  style={{ background: "#2D6A4F" }}
                >
                  {actionLoading === reviewTarget.id ? "Memproses..." : "Verifikasi & Aktifkan"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Tolak ── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}>
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
