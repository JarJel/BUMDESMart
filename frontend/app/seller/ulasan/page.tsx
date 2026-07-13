"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className="text-sm" style={{ color: s <= rating ? "#F59E0B" : "#E5E7EB" }}>★</span>
      ))}
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function UlasanPage() {
  const toast = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<{ total: number; average: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/seller/reviews", { params: { page } });
      const payload = res.data;
      setReviews(payload.data?.data ?? payload.data ?? []);
      setMeta(payload.data?.meta ?? null);
      setStats(payload.stats ?? null);
    } catch {
      toast.error("Gagal memuat ulasan.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const filtered = filter ? reviews.filter(r => r.rating === filter) : reviews;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ulasan Pelanggan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pantau penilaian produk-produkmu</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Ulasan</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-2xl font-bold text-gray-900">
                {stats.average > 0 ? stats.average.toFixed(1) : "—"}
              </span>
              {stats.average > 0 && <span className="text-yellow-400 text-xl">★</span>}
            </div>
            <p className="text-xs text-gray-500">Rata-rata Rating</p>
          </div>
        </div>
      )}

      {/* Filter by star */}
      <div className="flex gap-2 flex-wrap">
        {[null, 5, 4, 3, 2, 1].map(v => (
          <button key={v ?? "all"} onClick={() => setFilter(v)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
            style={filter === v
              ? { borderColor: "var(--primary)", background: "#F0FDF4", color: "var(--primary)" }
              : { borderColor: "#E5E7EB", background: "white", color: "#6B7280" }}>
            {v === null ? "Semua" : `${v} ★`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: "var(--primary)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            {filter ? `Belum ada ulasan ${filter} bintang` : "Belum ada ulasan"}
          </p>
          <p className="text-xs text-gray-400 max-w-xs">
            Ulasan dari pelanggan akan muncul di sini setelah mereka menerima pesanan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                    {(review.customer?.user?.name ?? "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {review.customer?.user?.name ?? "Pelanggan"}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                <StarDisplay rating={review.rating} />
              </div>

              <p className="text-xs text-gray-500 mb-2">
                Produk: <span className="font-medium text-gray-700">{review.product?.name ?? "—"}</span>
              </p>

              {review.comment && (
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          ))}

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50">
                ← Prev
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">{page} / {meta.last_page}</span>
              <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50">
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
