"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Broadcast {
  id: number;
  title: string;
  category: string;
  content: string;
  photos: string[] | null;
  target: string;
  umkm_category: string | null;
  recipient_count: number;
  sent_at: string;
  created_at: string;
}

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace("/api/v1", "");

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
  { value: "all",           label: "Semua (UMKM & Kurir)" },
  { value: "umkm",          label: "Hanya UMKM" },
  { value: "driver",        label: "Hanya Kurir" },
  { value: "umkm_category", label: "Kategori UMKM Tertentu" },
];

function getPhotoUrl(path: string): string {
  if (!path) return "";
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
}

function PhotoSlider({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0);
  const urls = photos.map(getPhotoUrl);
  if (urls.length === 0) return null;
  return (
    <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden">
      <img src={urls[idx]} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover transition-opacity duration-300" />
      {urls.length > 1 && (
        <>
          <button onClick={() => setIdx((i) => (i - 1 + urls.length) % urls.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => setIdx((i) => (i + 1) % urls.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {urls.map((_, i) => (<button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full transition ${i === idx ? "bg-white" : "bg-white/50"}`} />))}
          </div>
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 text-white text-[10px] font-semibold">{idx + 1}/{urls.length}</span>
        </>
      )}
    </div>
  );
}

const categoryColor: Record<string, string> = {
  pengumuman: "bg-blue-50 text-blue-700", pelatihan: "bg-purple-50 text-purple-700",
  info_bantuan: "bg-yellow-50 text-yellow-700", jadwal: "bg-orange-50 text-orange-700",
  acara: "bg-pink-50 text-pink-700", promosi: "bg-green-50 text-green-700",
  sistem: "bg-gray-100 text-gray-600", undangan: "bg-indigo-50 text-indigo-700",
};

export default function KelolaBeritaPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [list, setList] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Broadcast | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("pengumuman");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("all");
  const [umkmCategory, setUmkmCategory] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try { const res = await api.get("/admin/broadcasts"); setList(res.data.data?.data ?? []); }
    catch { setList([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchList(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length + photoFiles.length > 5) { toast.error("Maksimal 5 foto per berita."); return; }
    const newFiles = [...photoFiles, ...files].slice(0, 5);
    setPhotoFiles(newFiles);
    setPreviewUrls(newFiles.map((f) => URL.createObjectURL(f)));
  };
  const removePhoto = (idx: number) => {
    const newFiles = photoFiles.filter((_, i) => i !== idx);
    setPhotoFiles(newFiles);
    setPreviewUrls(newFiles.map((f) => URL.createObjectURL(f)));
  };
  const resetForm = () => {
    setTitle(""); setCategory("pengumuman"); setContent(""); setTarget("all"); setUmkmCategory("");
    setPhotoFiles([]); setPreviewUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { toast.error("Judul dan isi berita wajib diisi."); return; }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("title", title); fd.append("category", category);
    fd.append("content", content); fd.append("target", target);
    if (target === "umkm_category") fd.append("umkm_category", umkmCategory);
    photoFiles.forEach((f, i) => fd.append(`photos[${i}]`, f));
    try {
      await api.post("/admin/broadcasts", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Berita berhasil diterbitkan!"); resetForm(); setShowForm(false); fetchList();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? "Gagal menerbitkan berita."); }
    finally { setSubmitting(false); }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/broadcasts/${deleteId}`);
      toast.success("Berita berhasil dihapus.");
      setSelected(null);
      setDeleteId(null);
      fetchList();
    } catch {
      toast.error("Gagal menghapus berita.");
    } finally {
      setDeleting(false);
    }
  };
  const catLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? v;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kelola Berita</h1>
          <p className="text-sm text-gray-500 mt-0.5">Publikasikan pengumuman untuk UMKM & kurir BUMDes</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95" style={{ background: "#2D6A4F" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tulis Berita
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Tulis Berita Baru</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="px-6 py-5 space-y-5">
                {/* Upload Foto */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Foto Berita <span className="text-gray-400 font-normal">(maks. 5 foto — jika lebih dari 1 tampil sebagai galeri slider)</span>
                  </label>
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-all">
                    <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-xs text-gray-500">Klik untuk pilih foto <span className="text-gray-400">(JPEG, PNG, WebP · maks 3 MB/foto)</span></p>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg,image/webp" multiple className="hidden" onChange={handleFileChange} />
                  </div>
                  {previewUrls.length > 0 && (
                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {previewUrls.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                          {i === 0 && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-green-600 text-white text-[8px] font-bold">COVER</span>}
                        </div>
                      ))}
                      {photoFiles.length < 5 && (
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-green-400 hover:text-green-400 transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {/* Judul */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Judul Berita <span className="text-red-500">*</span></label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Pelatihan Packaging Produk UMKM 2026" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition" />
                </div>
                {/* Kategori & Target */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kategori</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition bg-white">
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Target Penerima</label>
                    <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition bg-white">
                      {TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                {target === "umkm_category" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kategori UMKM Spesifik</label>
                    <input type="text" value={umkmCategory} onChange={(e) => setUmkmCategory(e.target.value)} placeholder="Contoh: makanan, kerajinan, tekstil..." className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition" />
                  </div>
                )}
                {/* Isi Berita */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Isi Berita <span className="text-red-500">*</span></label>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Tulis isi berita di sini..." className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition resize-none" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Batal</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 flex items-center gap-2" style={{ background: "#2D6A4F" }}>
                  {submitting ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Menerbitkan...</>) : "Terbitkan Berita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Detail Berita</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition shrink-0">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {selected.photos && selected.photos.length > 0 && <PhotoSlider photos={selected.photos} />}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${categoryColor[selected.category] ?? "bg-gray-100 text-gray-600"}`}>{catLabel(selected.category)}</span>
                  <span className="text-[10px] text-gray-400">{TARGETS.find((t) => t.value === selected.target)?.label ?? selected.target}</span>
                </div>
                <h1 className="text-base font-bold text-gray-900 leading-snug">{selected.title}</h1>
                <p className="text-[10px] text-gray-400">{new Date(selected.sent_at ?? selected.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} · {selected.recipient_count} penerima</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pt-2">{selected.content}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
              <button onClick={() => setDeleteId(selected.id)} className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Hapus
              </button>
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* List Berita */}
      {loading ? (
        <div className="text-center py-16 text-sm text-gray-400">Memuat berita...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">Belum ada berita yang diterbitkan</p>
          <p className="text-xs text-gray-400">Klik "Tulis Berita" untuk mulai</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((b) => (
            <div key={b.id} onClick={() => setSelected(b)} className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col sm:flex-row">
              <div className="sm:w-44 shrink-0 aspect-video sm:aspect-auto sm:h-auto bg-gray-50">
                {b.photos && b.photos.length > 0 ? (
                  <img src={getPhotoUrl(b.photos[0])} alt={b.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full min-h-[100px] flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 01-2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${categoryColor[b.category] ?? "bg-gray-100 text-gray-600"}`}>{catLabel(b.category)}</span>
                    {b.photos && b.photos.length > 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 text-gray-500 flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 01-2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {b.photos.length} foto
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">{b.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{b.content}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px] text-gray-400">{new Date(b.sent_at ?? b.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} · {b.recipient_count} penerima</p>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(b.id); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reusable ConfirmDialog untuk hapus berita */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Berita"
        description="Apakah Anda yakin ingin menghapus berita ini secara permanen? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
