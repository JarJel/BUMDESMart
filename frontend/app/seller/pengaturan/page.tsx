"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface ProfileForm {
  shop_name: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
}

interface UmkmStatus {
  id: number;
  status: "pending" | "active" | "rejected";
  rejection_reason: string | null;
}

export default function PengaturanPage() {
  const [form, setForm] = useState<ProfileForm>({
    shop_name: "",
    description: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form
  const [passForm, setPassForm] = useState({ current_password: "", new_password: "", new_password_confirmation: "" });
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // UMKM verification status
  const [umkmStatus, setUmkmStatus] = useState<UmkmStatus | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [reapplying, setReapplying] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } });
    const user = res.data.data ?? res.data;
    const umkm = user.umkm_profile ?? {};
    setForm({
      shop_name: umkm.shop_name ?? "",
      description: umkm.description ?? "",
      phone: umkm.phone ?? user.phone ?? "",
      address: umkm.address ?? "",
      city: umkm.city ?? "",
      province: umkm.province ?? "",
      postal_code: umkm.postal_code ?? "",
    });
    if (umkm.id) {
      const newStatus: UmkmStatus = {
        id: umkm.id,
        status: umkm.status,
        rejection_reason: umkm.rejection_reason ?? null,
      };
      // detect status change while polling
      if (prevStatusRef.current && prevStatusRef.current !== umkm.status) {
        if (umkm.status === "active") setStatusToast("Selamat! Toko kamu sudah diverifikasi dan aktif.");
        else if (umkm.status === "rejected") setStatusToast("Pendaftaranmu ditolak. Lihat alasan di bawah.");
      }
      prevStatusRef.current = umkm.status;
      setUmkmStatus(newStatus);
    }
    return umkm.status as string | undefined;
  };

  useEffect(() => {
    fetchProfile().catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Poll every 30 seconds when status is pending
  useEffect(() => {
    if (!umkmStatus || umkmStatus.status !== "pending") return;
    const interval = setInterval(() => {
      fetchProfile().catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [umkmStatus?.status]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${API}/profile`, form, { headers: { Authorization: `Bearer ${token}` } });
      setMsg({ type: "success", text: "Profil berhasil disimpan!" });
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
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${API}/profile/password`, {
        current_password: passForm.current_password,
        new_password: passForm.new_password,
        new_password_confirmation: passForm.new_password_confirmation,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPassMsg({ type: "success", text: "Password berhasil diubah!" });
      setPassForm({ current_password: "", new_password: "", new_password_confirmation: "" });
    } catch (e: any) {
      const err = e.response?.data?.message ?? e.response?.data?.errors?.current_password?.[0] ?? e.response?.data?.error ?? "Gagal mengubah password.";
      setPassMsg({ type: "error", text: err });
    } finally {
      setSavingPass(false);
    }
  };

  const set = (field: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleReapply = async () => {
    if (!umkmStatus) return;
    setReapplying(true);
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${API}/admin/umkm/${umkmStatus.id}/reapply`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUmkmStatus(prev => prev ? { ...prev, status: "pending", rejection_reason: null } : prev);
      prevStatusRef.current = "pending";
    } catch {}
    finally { setReapplying(false); }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Memuat data profil...</div>;
  }

  return (
    <div className="p-6 space-y-6">
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
        <p className="text-sm text-gray-500 mt-0.5">Lengkapi profil toko kamu</p>
      </div>

      {/* Status verifikasi */}
      {umkmStatus && (
        <>
          {umkmStatus.status === "pending" && (
            <div className="flex items-center gap-3 px-4 py-3.5 bg-yellow-50 border border-yellow-200 rounded-2xl">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Pendaftaran sedang ditinjau</p>
                <p className="text-xs text-yellow-700 mt-0.5">Admin BUMDes sedang memverifikasi data tokomu. Halaman ini akan otomatis diperbarui.</p>
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
                <p className="text-xs text-green-700 mt-0.5">Pendaftaran telah diverifikasi. Kamu bisa mulai berjualan.</p>
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
                  {umkmStatus.rejection_reason ? (
                    <p className="text-xs text-red-700 mt-1">{umkmStatus.rejection_reason}</p>
                  ) : (
                    <p className="text-xs text-red-600 mt-1">Tidak ada alasan yang diberikan. Hubungi admin BUMDes untuk informasi lebih lanjut.</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleReapply}
                disabled={reapplying}
                className="w-full py-2 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {reapplying ? "Mengirim..." : "Ajukan Ulang Pendaftaran"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Profil Toko */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-3">Profil Toko</h2>

        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Nama Toko <span className="text-red-400">*</span></label>
            <input value={form.shop_name} onChange={set("shop_name")} placeholder="Nama toko kamu" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Nomor HP</label>
            <input value={form.phone} onChange={set("phone")} placeholder="08xxxxxxxxxx" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Deskripsi Toko</label>
            <textarea value={form.description} onChange={set("description")} rows={3} placeholder="Ceritakan tentang toko kamu..." className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400 resize-none" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Alamat</label>
            <input value={form.address} onChange={set("address")} placeholder="Jl. ..." className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Kota / Kabupaten</label>
            <input value={form.city} onChange={set("city")} placeholder="Bandung" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Provinsi</label>
            <input value={form.province} onChange={set("province")} placeholder="Jawa Barat" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Kode Pos</label>
            <input value={form.postal_code} onChange={set("postal_code")} placeholder="40123" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-50" style={{ background: "var(--primary)" }}>
          {saving ? "Menyimpan..." : "Simpan Profil"}
        </button>
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
              <input
                type="password"
                value={passForm[field as keyof typeof passForm]}
                onChange={e => setPassForm(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder="••••••••"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400"
              />
            </div>
          ))}
        </div>

        <button onClick={handleSavePass} disabled={savingPass} className="px-5 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-50" style={{ background: "var(--primary)" }}>
          {savingPass ? "Menyimpan..." : "Ubah Password"}
        </button>
      </div>
    </div>
  );
}
