"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

const IMG_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace("/api/v1", "");

function getPhotoUrl(rawPath: string | null | undefined): string | null {
  if (!rawPath) return null;
  if (rawPath.startsWith("http")) return rawPath;
  return `${IMG_BASE}/storage/${rawPath}`;
}

const VEHICLE_TYPES = [
  { value: "motor",  label: "Motor" },
  { value: "mobil",  label: "Mobil" },
  { value: "pickup", label: "Pickup" },
  { value: "sepeda", label: "Sepeda" },
];

const SIM_TYPES = [
  { value: "A",  label: "SIM A" },
  { value: "B",  label: "SIM B" },
  { value: "C",  label: "SIM C" },
  { value: "A1", label: "SIM A1" },
  { value: "B1", label: "SIM B1" },
];

export default function PengirimProfilPage() {
  const toast = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/driver/profile");
      const data = res.data.data;
      setProfile(data);
      setForm({
        name:          data.name ?? "",
        phone:         data.phone ?? "",
        vehicle_type:  data.vehicle_type ?? "motor",
        vehicle_brand: data.vehicle_brand ?? "",
        vehicle_plate: data.vehicle_plate ?? "",
        vehicle_year:  data.vehicle_year ?? "",
        sim_type:      data.sim_type ?? "C",
      });
    } catch {
      toast.error("Gagal memuat profil.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/driver/profile", {
        ...form,
        vehicle_year: form.vehicle_year ? Number(form.vehicle_year) : undefined,
      });
      toast.success("Profil berhasil disimpan.");
      setEditing(false);
      fetchProfile();
    } catch (err: any) {
      const errs = err.response?.data?.errors;
      if (errs) {
        const first = Object.values(errs)[0] as string[];
        toast.error(first[0]);
      } else {
        toast.error("Gagal menyimpan profil.");
      }
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string, val: string) => setForm((p: any) => ({ ...p, [field]: val }));

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("photo_profile", file);
      await api.post("/driver/profile/photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Foto profil berhasil diperbarui.");
      fetchProfile();
    } catch {
      toast.error("Gagal upload foto. Pastikan ukuran ≤ 5MB.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Profil Saya</h1>
          <p className="text-sm text-gray-500 mt-0.5">Informasi akunmu sebagai pengirim</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)}
            className="w-full rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all sm:w-auto"
            style={{ borderColor: "#E76F51", color: "#E76F51" }}>
            Edit Profil
          </button>
        )}
      </div>

      {/* Status badge */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 min-[420px]:flex-row min-[420px]:items-center">
        {/* Avatar + upload button */}
        <div className="relative shrink-0 self-start min-[420px]:self-center">
          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #E76F51, #F4A261)" }}>
            {getPhotoUrl(profile.photo_profile) ? (
              <img
                src={getPhotoUrl(profile.photo_profile)!}
                alt={profile.name}
                className="w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              (profile.name ?? "?")[0].toUpperCase()
            )}
          </div>
          <label
            htmlFor="photo-profile-input"
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-orange-50 shadow-sm"
            title="Ganti foto profil"
          >
            {uploadingPhoto ? (
              <div className="w-3 h-3 rounded-full border-t-2 border-orange-500 animate-spin" />
            ) : (
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </label>
          <input
            id="photo-profile-input"
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="sr-only"
            onChange={e => { if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]); }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-bold text-gray-900">{profile.name}</p>
          <p className="break-all text-xs text-gray-500">{profile.email}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Klik ikon kamera untuk ganti foto profil</p>
        </div>
        <div className="min-[420px]:text-right">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${profile.is_verified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
            {profile.is_verified ? "Terverifikasi" : "Menunggu Verifikasi"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{profile.total_deliveries ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Pengiriman</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{profile.rating > 0 ? Number(profile.rating).toFixed(1) : "—"}</p>
          <p className="text-xs text-gray-500 mt-0.5">Rating</p>
        </div>
      </div>

      {/* Info / Edit Form */}
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
        <p className="text-sm font-semibold text-gray-900">Informasi Pribadi</p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            { label: "Nama Lengkap", field: "name", placeholder: "Nama lengkap" },
            { label: "Nomor HP", field: "phone", placeholder: "08xxxxxxxxxx" },
          ].map(f => (
            <div key={f.field}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
              {editing ? (
                <input value={form[f.field] ?? ""} onChange={e => set(f.field, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
              ) : (
                <p className="text-sm text-gray-900">{profile[f.field] || "—"}</p>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-50 pt-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">Informasi Kendaraan</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Jenis Kendaraan</label>
              {editing ? (
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                  {VEHICLE_TYPES.map(v => (
                    <button key={v.value} onClick={() => set("vehicle_type", v.value)}
                      className="py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all"
                      style={form.vehicle_type === v.value
                        ? { borderColor: "#E76F51", background: "#FEF3E8", color: "#E76F51" }
                        : { borderColor: "#E5E7EB", background: "white", color: "#6B7280" }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-900 capitalize">{profile.vehicle_type || "—"}</p>
              )}
            </div>

            {[
              { label: "Merek", field: "vehicle_brand", placeholder: "Honda, Yamaha, dll" },
              { label: "Nomor Plat", field: "vehicle_plate", placeholder: "B 1234 XYZ" },
              { label: "Tahun", field: "vehicle_year", placeholder: "2020" },
            ].map(f => (
              <div key={f.field}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                {editing ? (
                  <input value={form[f.field] ?? ""} onChange={e => set(f.field, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
                ) : (
                  <p className="text-sm text-gray-900">{profile[f.field] || "—"}</p>
                )}
              </div>
            ))}

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Jenis SIM</label>
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {SIM_TYPES.map(s => (
                    <button key={s.value} onClick={() => set("sim_type", s.value)}
                      className="px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-all"
                      style={form.sim_type === s.value
                        ? { borderColor: "#E76F51", background: "#FEF3E8", color: "#E76F51" }
                        : { borderColor: "#E5E7EB", background: "white", color: "#6B7280" }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-900">{profile.sim_type ? `SIM ${profile.sim_type}` : "—"}</p>
              )}
            </div>
          </div>
        </div>

        {editing && (
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button onClick={() => setEditing(false)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
              Batal
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              style={{ background: "#E76F51" }}>
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
