"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

interface Broadcast {
  id: number;
  title: string;
  category: string;
  content: string;
  target: string;
  umkm_category: string | null;
  recipient_count: number;
  sent_at: string;
  created_at: string;
}

const CATEGORIES = [
  { value: "pengumuman",   label: "Pengumuman" },
  { value: "pelatihan",    label: "Pelatihan & Workshop" },
  { value: "info_bantuan", label: "Info Bantuan / Subsidi" },
  { value: "jadwal",       label: "Jadwal Pengiriman" },
  { value: "acara",        label: "Acara Desa" },
  { value: "promosi",      label: "Promosi Platform" },
  { value: "sistem",       label: "Pemberitahuan Sistem" },
  { value: "undangan",     label: "Undangan Rapat" },
];

const TARGETS = [
  { value: "all",           label: "Semua (UMKM + Kurir)" },
  { value: "umkm",          label: "Semua UMKM" },
  { value: "driver",        label: "Semua Kurir" },
  { value: "umkm_category", label: "UMKM per Kategori Usaha" },
];

const CATEGORY_BADGE: Record<string, string> = {
  pengumuman:   "bg-blue-50 text-blue-700",
  pelatihan:    "bg-purple-50 text-purple-700",
  info_bantuan: "bg-green-50 text-green-700",
  jadwal:       "bg-yellow-50 text-yellow-700",
  acara:        "bg-orange-50 text-orange-700",
  promosi:      "bg-pink-50 text-pink-700",
  sistem:       "bg-gray-100 text-gray-600",
  undangan:     "bg-teal-50 text-teal-700",
};

const TARGET_LABEL: Record<string, string> = {
  all:           "Semua",
  umkm:          "UMKM",
  driver:        "Kurir",
  umkm_category: "UMKM Kategori",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function BroadcastPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [detail, setDetail] = useState<Broadcast | null>(null);
  const toast = useToast();

  const [form, setForm] = useState({
    title: "",
    category: "pengumuman",
    content: "",
    target: "all",
    umkm_category: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const r = await api.get("/admin/broadcasts");
      setBroadcasts(r.data.data?.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Judul wajib diisi.";
    if (!form.content.trim()) e.content = "Isi pesan wajib diisi.";
    if (form.target === "umkm_category" && !form.umkm_category.trim()) {
      e.umkm_category = "Kategori UMKM wajib diisi jika target per kategori.";
    }
    return e;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSending(true);
    try {
      const payload: Record<string, string> = {
        title: form.title,
        category: form.category,
        content: form.content,
        target: form.target,
      };
      if (form.target === "umkm_category") payload.umkm_category = form.umkm_category;
      const r = await api.post("/admin/broadcasts", payload);
      toast.success(r.data.message ?? "Broadcast berhasil dikirim.");
      setShowForm(false);
      setForm({ title: "", category: "pengumuman", content: "", target: "all", umkm_category: "" });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Gagal mengirim broadcast.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Broadcast</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kirim pengumuman atau informasi ke UMKM dan kurir via email.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setDetail(null); }}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
          style={{ background: "#2D6A4F" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Kirim Broadcast
        </button>
      </div>

      {/* Form kirim */}
      {showForm && (
        <form onSubmit={handleSend} className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Broadcast Baru</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-gray-400 hover:text-gray-600">Tutup</button>
          </div>

          {/* Judul */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Judul</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Contoh: Pelatihan Packaging Produk UMKM"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 ${errors.title ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Kategori + Target */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Kategori</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Target Penerima</label>
              <select
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              >
                {TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Kategori UMKM (jika umkm_category) */}
          {form.target === "umkm_category" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Kategori Usaha UMKM</label>
              <input
                value={form.umkm_category}
                onChange={e => setForm(f => ({ ...f, umkm_category: e.target.value }))}
                placeholder="Contoh: kuliner, fashion, kerajinan"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 ${errors.umkm_category ? "border-red-300" : "border-gray-200"}`}
              />
              {errors.umkm_category && <p className="text-xs text-red-500 mt-1">{errors.umkm_category}</p>}
            </div>
          )}

          {/* Isi pesan */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Isi Pesan</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={6}
              placeholder="Tulis isi pengumuman, jadwal, atau informasi di sini..."
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 resize-none ${errors.content ? "border-red-300" : "border-gray-200"}`}
            />
            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50">
              Batal
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#2D6A4F" }}
            >
              {sending ? "Mengirim..." : "Kirim Sekarang"}
            </button>
          </div>
        </form>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_BADGE[detail.category] ?? "bg-gray-100 text-gray-500"}`}>
                  {CATEGORIES.find(c => c.value === detail.category)?.label ?? detail.category}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-2">{detail.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{fmtDate(detail.created_at)} · {detail.recipient_count} penerima · {TARGET_LABEL[detail.target] ?? detail.target}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 ml-4 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {detail.content}
            </div>
          </div>
        </div>
      )}

      {/* Riwayat broadcast */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Riwayat Broadcast</h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Memuat...</div>
        ) : broadcasts.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Belum ada broadcast yang dikirim.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {broadcasts.map(b => (
              <div
                key={b.id}
                className="px-5 py-4 hover:bg-gray-50/50 cursor-pointer transition-colors"
                onClick={() => setDetail(b)}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 mt-0.5 ${CATEGORY_BADGE[b.category] ?? "bg-gray-100 text-gray-500"}`}>
                    {CATEGORIES.find(c => c.value === b.category)?.label ?? b.category}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{b.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {fmtDate(b.created_at)} · {b.recipient_count} penerima · {TARGET_LABEL[b.target] ?? b.target}
                      {b.umkm_category ? ` (${b.umkm_category})` : ""}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{b.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
