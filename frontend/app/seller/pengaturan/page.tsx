"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

const IMG_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace("/api/v1", "");

const CATEGORY_OPTIONS = [
  { value: "makanan_minuman",      label: "Makanan & Minuman" },
  { value: "kerajinan_tangan",     label: "Kerajinan Tangan" },
  { value: "tekstil_fashion",      label: "Tekstil & Fashion" },
  { value: "pertanian_peternakan", label: "Pertanian & Peternakan" },
  { value: "elektronik",           label: "Elektronik" },
  { value: "kesehatan_kecantikan", label: "Kesehatan & Kecantikan" },
  { value: "jasa",                 label: "Jasa" },
  { value: "lainnya",              label: "Lainnya" },
];

interface ProfileForm {
  shop_name: string;
  owner_name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  business_category: string;
}

interface UmkmStatus {
  id: number;
  status: "pending" | "active" | "rejected";
  rejection_reason: string | null;
  logo: string | null;
  banner: string | null;
}

const EMPTY_FORM: ProfileForm = {
  shop_name: "", owner_name: "", description: "", phone: "",
  email: "", address: "", city: "", province: "", postal_code: "",
  business_category: "",
};

const DAYS = [
  { key: "senin",   label: "Senin" },
  { key: "selasa",  label: "Selasa" },
  { key: "rabu",    label: "Rabu" },
  { key: "kamis",   label: "Kamis" },
  { key: "jumat",   label: "Jumat" },
  { key: "sabtu",   label: "Sabtu" },
  { key: "minggu",  label: "Minggu" },
];

const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map(d => [d.key, { open: "08:00", close: "17:00", closed: d.key === "minggu" }])
);

function MediaUpload({
  label, hint, current, endpoint, onDone,
}: {
  label: string; hint: string; current: string | null;
  endpoint: string; onDone: (path: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displaySrc = preview
    ? preview
    : current
    ? (current.startsWith("http") ? current : `${IMG_BASE}${current}`)
    : null;

  const handleFile = async (file: File) => {
    setErr("");
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(endpoint, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onDone(res.data.path);
    } catch (e: any) {
      setErr(e.response?.data?.message ?? "Gagal mengunggah.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-gray-700 mb-1.5 block">{label}</label>
      <p className="text-xs text-gray-400 mb-2">{hint}</p>
      <div
        className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-green-400 transition-colors"
        style={{ minHeight: 80 }}
        onClick={() => inputRef.current?.click()}
      >
        {displaySrc ? (
          <img src={displaySrc} alt={label} className="w-full h-32 object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-24 text-gray-400">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Klik untuk upload</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent" />
          </div>
        )}
      </div>
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}

export default function PengaturanPage() {
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [passForm, setPassForm] = useState({ current_password: "", new_password: "", new_password_confirmation: "" });
  const [savingPass, setSavingPass] = useState(false);
  const [umkmStatus, setUmkmStatus] = useState<UmkmStatus | null>(null);
  const [reapplying, setReapplying] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  // Shop hours state
  const [shopIsOpen, setShopIsOpen] = useState(true);
  const [closedUntil, setClosedUntil] = useState("");
  const [openHours, setOpenHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(DEFAULT_HOURS);
  const [togglingShop, setTogglingShop] = useState(false);
  const [savingHours, setSavingHours] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchProfile = useCallback(async () => {
    const res = await api.get("/profile");
    const user = res.data.data ?? res.data;
    const umkm = user.umkm_profile ?? {};
    setForm({
      shop_name: umkm.shop_name ?? "",
      owner_name: umkm.owner_name ?? user.name ?? "",
      description: umkm.description ?? "",
      phone: umkm.phone ?? user.phone ?? "",
      email: umkm.email ?? user.email ?? "",
      address: umkm.address ?? "",
      city: umkm.city ?? "",
      province: umkm.province ?? "",
      postal_code: umkm.postal_code ?? "",
      business_category: umkm.business_category ?? "",
    });
    setShopIsOpen(umkm.is_open ?? true);
    setClosedUntil(umkm.closed_until ? umkm.closed_until.slice(0, 16) : "");
    setOpenHours(umkm.open_hours ?? DEFAULT_HOURS);
    if (umkm.id) {
      if (prevStatusRef.current && prevStatusRef.current !== umkm.status) {
        if (umkm.status === "active") toast.success("Selamat! Toko kamu sudah diverifikasi dan aktif.");
        else if (umkm.status === "rejected") toast.error("Pendaftaranmu ditolak. Lihat alasan di bawah.");
      }
      prevStatusRef.current = umkm.status;
      setUmkmStatus({
        id: umkm.id,
        status: umkm.status,
        rejection_reason: umkm.rejection_reason ?? null,
        logo: umkm.logo ?? null,
        banner: umkm.banner ?? null,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProfile().catch(() => {}).finally(() => setLoading(false));
  }, [fetchProfile]);

  useEffect(() => {
    if (!umkmStatus || umkmStatus.status !== "pending") return;
    const interval = setInterval(() => fetchProfile().catch(() => {}), 30_000);
    return () => clearInterval(interval);
  }, [umkmStatus?.status, fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/profile", form);
      toast.success("Profil berhasil disimpan!");
      fetchProfile().catch(() => {});
    } catch (e: any) {
      const err = e.response?.data?.message ?? e.response?.data?.error ?? "Gagal menyimpan profil.";
      toast.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePass = async () => {
    if (passForm.new_password !== passForm.new_password_confirmation) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }
    setSavingPass(true);
    try {
      await api.put("/profile/password", passForm);
      toast.success("Password berhasil diubah!");
      setPassForm({ current_password: "", new_password: "", new_password_confirmation: "" });
    } catch (e: any) {
      const err = e.response?.data?.message ?? e.response?.data?.errors?.current_password?.[0] ?? "Gagal mengubah password.";
      toast.error(err);
    } finally {
      setSavingPass(false);
    }
  };

  const handleReapply = async () => {
    if (!umkmStatus) return;
    setReapplying(true);
    try {
      await api.put('/seller/reapply', {});
      setUmkmStatus(prev => prev ? { ...prev, status: "pending", rejection_reason: null } : prev);
      prevStatusRef.current = "pending";
    } catch {}
    finally { setReapplying(false); }
  };

  const set = (field: keyof ProfileForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleToggleShop = async () => {
    setTogglingShop(true);
    try {
      const res = await api.patch("/seller/shop/toggle");
      setShopIsOpen(res.data.is_open);
      if (res.data.is_open) setClosedUntil("");
      toast.success(res.data.message);
    } catch {
      toast.error("Gagal mengubah status toko.");
    } finally {
      setTogglingShop(false);
    }
  };

  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      await api.put("/seller/shop/hours", {
        open_hours:   openHours,
        closed_until: closedUntil || null,
      });
      toast.success("Jam toko berhasil disimpan.");
      if (closedUntil) setShopIsOpen(false);
    } catch {
      toast.error("Gagal menyimpan jam toko.");
    } finally {
      setSavingHours(false);
    }
  };

  const setHour = (day: string, field: "open" | "close" | "closed", val: string | boolean) =>
    setOpenHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: val } }));

  if (loading) return <div className="p-6 text-sm text-gray-400">Memuat data profil...</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pengaturan Toko</h1>
        <p className="text-sm text-gray-500 mt-0.5">Lengkapi profil agar pembeli lebih percaya</p>
      </div>

      {/* Status verifikasi */}
      {umkmStatus && (
        <>
          {umkmStatus.status === "pending" && (
            <div className="flex items-center gap-3 px-4 py-3.5 bg-yellow-50 border border-yellow-200 rounded-2xl">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Pendaftaran sedang ditinjau</p>
                <p className="text-xs text-yellow-700 mt-0.5">Admin BUMDes sedang memverifikasi data tokomu.</p>
              </div>
            </div>
          )}
          {umkmStatus.status === "active" && (
            <div className="flex items-center gap-3 px-4 py-3.5 bg-green-50 border border-green-200 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">Toko kamu sudah aktif</p>
                <p className="text-xs text-green-700 mt-0.5">Lengkapi profil untuk meningkatkan kepercayaan pembeli.</p>
              </div>
            </div>
          )}
          {umkmStatus.status === "rejected" && (
            <div className="px-4 py-4 bg-red-50 border border-red-200 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-800">Pendaftaran ditolak</p>
                  <p className="text-xs text-red-700 mt-1">{umkmStatus.rejection_reason ?? "Hubungi admin BUMDes untuk informasi lebih lanjut."}</p>
                </div>
              </div>
              <button onClick={handleReapply} disabled={reapplying}
                className="w-full py-2 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50">
                {reapplying ? "Mengirim..." : "Ajukan Ulang Pendaftaran"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Media Toko */}
      {umkmStatus && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-3">Media Toko</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <MediaUpload
              label="Logo Toko"
              hint="Rasio 1:1 (kotak) · Ideal 400×400px · Maks. 3MB · JPG/PNG/WEBP"
              current={umkmStatus.logo}
              endpoint="/profile/shop/logo"
              onDone={(path) => setUmkmStatus(prev => prev ? { ...prev, logo: path } : prev)}
            />
            <MediaUpload
              label="Banner Toko"
              hint="Rasio 3:1 (landscape) · Ideal 1200×400px · Maks. 3MB · JPG/PNG/WEBP"
              current={umkmStatus.banner}
              endpoint="/profile/shop/banner"
              onDone={(path) => setUmkmStatus(prev => prev ? { ...prev, banner: path } : prev)}
            />
          </div>
        </div>
      )}

      {/* Status & Jam Toko */}
      {umkmStatus?.status === "active" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-3">Status &amp; Jam Toko</h2>

          {/* Toggle buka/tutup */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Status Toko</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {shopIsOpen ? "Toko sedang buka, pembeli bisa pesan." : "Toko sedang tutup, pesanan baru ditahan."}
              </p>
            </div>
            <button
              onClick={handleToggleShop}
              disabled={togglingShop}
              className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${shopIsOpen ? "bg-green-500" : "bg-gray-200"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${shopIsOpen ? "right-1" : "left-1"}`} />
            </button>
          </div>

          {/* Tutup sementara */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Tutup Sementara Sampai</label>
            <p className="text-xs text-gray-400 mb-2">Kosongkan jika tidak ada rencana tutup sementara.</p>
            <input
              type="datetime-local"
              value={closedUntil}
              onChange={e => setClosedUntil(e.target.value)}
              className="w-full sm:w-64 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400"
            />
          </div>

          {/* Jam operasional per hari */}
          <div>
            <p className="text-xs font-medium text-gray-700 mb-3">Jam Operasional</p>
            <div className="space-y-2">
              {DAYS.map(d => {
                const h = openHours[d.key] ?? { open: "08:00", close: "17:00", closed: false };
                return (
                  <div key={d.key} className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 w-24">
                      <button
                        type="button"
                        onClick={() => setHour(d.key, "closed", !h.closed)}
                        className={`relative w-8 h-4 rounded-full transition-colors ${!h.closed ? "bg-green-500" : "bg-gray-200"}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${!h.closed ? "right-0.5" : "left-0.5"}`} />
                      </button>
                      <span className={`text-xs font-medium ${h.closed ? "text-gray-400" : "text-gray-700"}`}>{d.label}</span>
                    </div>
                    {!h.closed ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={h.open}
                          onChange={e => setHour(d.key, "open", e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-400"
                        />
                        <span className="text-xs text-gray-400">–</span>
                        <input
                          type="time"
                          value={h.close}
                          onChange={e => setHour(d.key, "close", e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-green-400"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Tutup</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={handleSaveHours} disabled={savingHours}
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--primary)" }}>
            {savingHours ? "Menyimpan..." : "Simpan Jam Toko"}
          </button>
        </div>
      )}

      {/* Informasi Toko */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-3">Informasi Toko</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nama Toko — terkunci setelah aktif */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">
              Nama Toko <span className="text-red-400">*</span>
            </label>
            {umkmStatus?.status === "active" ? (
              <div>
                <input value={form.shop_name} readOnly
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed" />
                <p className="text-[11px] text-amber-600 mt-1">Nama toko terkunci setelah verifikasi. Hubungi admin BUMDes untuk mengubahnya.</p>
              </div>
            ) : (
              <input value={form.shop_name} onChange={set("shop_name")} placeholder="Nama toko kamu"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
            )}
          </div>

          {[
            { label: "Nama Pemilik", field: "owner_name" as const, placeholder: "Nama lengkap pemilik" },
            { label: "Nomor HP", field: "phone" as const, placeholder: "08xxxxxxxxxx" },
            { label: "Email Toko", field: "email" as const, placeholder: "email@toko.com" },
            { label: "Kota / Kabupaten", field: "city" as const, placeholder: "Bandung" },
            { label: "Provinsi", field: "province" as const, placeholder: "Jawa Barat" },
            { label: "Kode Pos", field: "postal_code" as const, placeholder: "40123" },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">{label}</label>
              <input value={form[field]} onChange={set(field)} placeholder={placeholder}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
            </div>
          ))}

          {/* Kategori Usaha — terkunci setelah aktif */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Kategori Usaha</label>
            {umkmStatus?.status === "active" ? (
              <div>
                <input
                  value={CATEGORY_OPTIONS.find(c => c.value === form.business_category)?.label ?? form.business_category}
                  readOnly
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed" />
                <p className="text-[11px] text-amber-600 mt-1">Kategori terkunci setelah verifikasi karena mempengaruhi dokumen izin. Hubungi admin BUMDes.</p>
              </div>
            ) : (
              <select value={form.business_category} onChange={set("business_category")}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400 bg-white">
                <option value="">Pilih kategori</option>
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Alamat Lengkap</label>
            <input value={form.address} onChange={set("address")} placeholder="Jl. ..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Deskripsi Toko</label>
            <textarea value={form.description} onChange={set("description")} rows={3}
              placeholder="Ceritakan tentang produk dan keunggulan tokomu..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400 resize-none" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--primary)" }}>
          {saving ? "Menyimpan..." : "Simpan Profil"}
        </button>
      </div>

      {/* Link ke Dokumen */}
      <Link href="/seller/dokumen"
        className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-300 hover:shadow-sm transition-all group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Dokumen Legalitas</p>
            <p className="text-xs text-gray-400 mt-0.5">KTP, NIB, NPWP, dan dokumen lain yang diminta BUMDes</p>
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Ubah Password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-3">Ubah Password</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Password Lama", field: "current_password" },
            { label: "Password Baru", field: "new_password" },
            { label: "Konfirmasi Password Baru", field: "new_password_confirmation" },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">{label}</label>
              <input type="password" value={passForm[field as keyof typeof passForm]}
                onChange={e => setPassForm(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder="••••••••"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
            </div>
          ))}
        </div>
        <button onClick={handleSavePass} disabled={savingPass}
          className="px-5 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--primary)" }}>
          {savingPass ? "Menyimpan..." : "Ubah Password"}
        </button>
      </div>
    </div>
  );
}
