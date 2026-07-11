"use client";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api/axios";

const IMG_BASE = "http://localhost:8000";

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
  nib: string;
  npwp: string;
}

interface UmkmStatus {
  id: number;
  status: "pending" | "active" | "rejected";
  rejection_reason: string | null;
  logo: string | null;
  banner: string | null;
  halal_cert: string | null;
}

const EMPTY_FORM: ProfileForm = {
  shop_name: "", owner_name: "", description: "", phone: "",
  email: "", address: "", city: "", province: "", postal_code: "",
  business_category: "", nib: "", npwp: "",
};

function MediaUpload({
  label, hint, current, endpoint, accept = "image/*", onDone,
}: {
  label: string; hint: string; current: string | null;
  endpoint: string; accept?: string; onDone: (path: string) => void;
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
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}

function Badge({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
      active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-400 border-gray-100"
    }`}>
      <span>{icon}</span>
      <span>{label}</span>
      {active && (
        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  );
}

export default function PengaturanPage() {
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passForm, setPassForm] = useState({ current_password: "", new_password: "", new_password_confirmation: "" });
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [umkmStatus, setUmkmStatus] = useState<UmkmStatus | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [reapplying, setReapplying] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  const fetchProfile = async () => {
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
      nib: umkm.nib ?? "",
      npwp: umkm.npwp ?? "",
    });
    if (umkm.id) {
      if (prevStatusRef.current && prevStatusRef.current !== umkm.status) {
        if (umkm.status === "active") setStatusToast("Selamat! Toko kamu sudah diverifikasi dan aktif.");
        else if (umkm.status === "rejected") setStatusToast("Pendaftaranmu ditolak. Lihat alasan di bawah.");
      }
      prevStatusRef.current = umkm.status;
      setUmkmStatus({
        id: umkm.id,
        status: umkm.status,
        rejection_reason: umkm.rejection_reason ?? null,
        logo: umkm.logo ?? null,
        banner: umkm.banner ?? null,
        halal_cert: umkm.halal_cert ?? null,
      });
    }
  };

  useEffect(() => {
    fetchProfile().catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!umkmStatus || umkmStatus.status !== "pending") return;
    const interval = setInterval(() => fetchProfile().catch(() => {}), 30_000);
    return () => clearInterval(interval);
  }, [umkmStatus?.status]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await api.put("/profile", form);
      setMsg({ type: "success", text: "Profil berhasil disimpan!" });
      fetchProfile().catch(() => {});
    } catch (e: any) {
      const err = e.response?.data?.message ?? e.response?.data?.error ?? "Gagal menyimpan profil.";
      setMsg({ type: "error", text: err });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePass = async () => {
    if (passForm.new_password !== passForm.new_password_confirmation) {
      setPassMsg({ type: "error", text: "Konfirmasi password tidak cocok." });
      return;
    }
    setSavingPass(true);
    setPassMsg(null);
    try {
      await api.put("/profile/password", passForm);
      setPassMsg({ type: "success", text: "Password berhasil diubah!" });
      setPassForm({ current_password: "", new_password: "", new_password_confirmation: "" });
    } catch (e: any) {
      const err = e.response?.data?.message ?? e.response?.data?.errors?.current_password?.[0] ?? "Gagal mengubah password.";
      setPassMsg({ type: "error", text: err });
    } finally {
      setSavingPass(false);
    }
  };

  const handleReapply = async () => {
    if (!umkmStatus) return;
    setReapplying(true);
    try {
      await api.put(`/admin/umkm/${umkmStatus.id}/reapply`, {});
      setUmkmStatus(prev => prev ? { ...prev, status: "pending", rejection_reason: null } : prev);
      prevStatusRef.current = "pending";
    } catch {}
    finally { setReapplying(false); }
  };

  const set = (field: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  if (loading) return <div className="p-6 text-sm text-gray-400">Memuat data profil...</div>;

  const hasNib = form.nib.trim().length > 0;
  const hasNpwp = form.npwp.trim().length > 0;
  const hasHalalCert = !!(umkmStatus?.halal_cert);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Toast */}
      {statusToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-2xl px-4 py-3 max-w-xs">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-800 flex-1">{statusToast}</p>
          <button onClick={() => setStatusToast(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

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
              hint="Gambar persegi, maks. 3 MB (jpg/png/webp)"
              current={umkmStatus.logo}
              endpoint="/profile/shop/logo"
              onDone={(path) => setUmkmStatus(prev => prev ? { ...prev, logo: path } : prev)}
            />
            <MediaUpload
              label="Banner Toko"
              hint="Gambar landscape 3:1, maks. 3 MB"
              current={umkmStatus.banner}
              endpoint="/profile/shop/banner"
              onDone={(path) => setUmkmStatus(prev => prev ? { ...prev, banner: path } : prev)}
            />
          </div>
        </div>
      )}

      {/* Profil Toko */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-3">Informasi Toko</h2>

        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Nama Toko", field: "shop_name" as const, required: true, placeholder: "Nama toko kamu" },
            { label: "Nama Pemilik", field: "owner_name" as const, placeholder: "Nama lengkap pemilik" },
            { label: "Nomor HP", field: "phone" as const, placeholder: "08xxxxxxxxxx" },
            { label: "Email Toko", field: "email" as const, placeholder: "email@toko.com" },
            { label: "Kota / Kabupaten", field: "city" as const, placeholder: "Bandung" },
            { label: "Provinsi", field: "province" as const, placeholder: "Jawa Barat" },
            { label: "Kode Pos", field: "postal_code" as const, placeholder: "40123" },
          ].map(({ label, field, required, placeholder }) => (
            <div key={field}>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                {label} {required && <span className="text-red-400">*</span>}
              </label>
              <input value={form[field]} onChange={set(field)} placeholder={placeholder}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
            </div>
          ))}

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Kategori Usaha</label>
            <select value={form.business_category} onChange={set("business_category")}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400 bg-white">
              <option value="">Pilih kategori</option>
              {["Makanan & Minuman", "Kerajinan Tangan", "Tekstil & Fashion", "Pertanian & Peternakan",
                "Elektronik", "Kesehatan & Kecantikan", "Jasa", "Lainnya"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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

      {/* Dokumen Legalitas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="border-b border-gray-50 pb-3">
          <h2 className="text-sm font-semibold text-gray-900">Dokumen Legalitas</h2>
          <p className="text-xs text-gray-400 mt-0.5">Dokumen ini bersifat privat — hanya admin yang bisa melihat isinya. Pembeli hanya melihat label badge.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">NIB (Nomor Induk Berusaha)</label>
            <input value={form.nib} onChange={set("nib")} placeholder="Masukkan nomor NIB"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
            <p className="text-xs text-gray-400 mt-1">Dari sistem OSS · daftarkan di oss.go.id</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">NPWP</label>
            <input value={form.npwp} onChange={set("npwp")} placeholder="xx.xxx.xxx.x-xxx.xxx"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
            <p className="text-xs text-gray-400 mt-1">Opsional untuk usaha mikro perorangan</p>
          </div>
        </div>

        {/* Sertifikat Halal */}
        {umkmStatus && (
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Sertifikat Halal</label>
            <p className="text-xs text-gray-400 mb-2">Upload sertifikat halal dari MUI/BPJPH (PDF/gambar, maks. 5 MB)</p>
            <div className="flex items-center gap-3">
              {umkmStatus.halal_cert ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Sertifikat sudah diunggah
                </div>
              ) : (
                <span className="text-xs text-gray-400">Belum ada sertifikat</span>
              )}
              <MediaUpload
                label=""
                hint=""
                current={null}
                endpoint="/profile/shop/halal-cert"
                accept="image/*,.pdf"
                onDone={(path) => setUmkmStatus(prev => prev ? { ...prev, halal_cert: path } : prev)}
              />
            </div>
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--primary)" }}>
          {saving ? "Menyimpan..." : "Simpan Dokumen"}
        </button>
      </div>

      {/* Preview Badge Publik */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="border-b border-gray-50 pb-3">
          <h2 className="text-sm font-semibold text-gray-900">Preview Badge Publik</h2>
          <p className="text-xs text-gray-400 mt-0.5">Badge ini tampil di halaman toko kamu dan dilihat oleh calon pembeli.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge icon="📋" label="NIB Terdaftar" active={hasNib} />
          <Badge icon="🧾" label="NPWP Terdaftar" active={hasNpwp} />
          <Badge icon="✅" label="Halal Certified" active={hasHalalCert} />
        </div>
        <p className="text-xs text-gray-400">
          {!hasNib && !hasNpwp && !hasHalalCert
            ? "Lengkapi dokumen di atas untuk menampilkan badge kepercayaan di halaman toko."
            : "Badge aktif akan muncul di halaman toko kamu."}
        </p>
      </div>

      {/* Ubah Password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-3">Ubah Password</h2>
        {passMsg && (
          <div className={`px-4 py-3 rounded-xl text-sm ${passMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
            {passMsg.text}
          </div>
        )}
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
