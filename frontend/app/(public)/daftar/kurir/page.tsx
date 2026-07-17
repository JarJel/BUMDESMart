"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import {
  Bike, Car, Truck, Package,
  DollarSign, MapPin, Star,
  Eye, EyeOff, CreditCard,
  Camera, IdCard, CheckCircle,
  ChevronRight, ArrowLeft,
  Rocket, Building2,
} from "lucide-react";

const VEHICLES = [
  { value: "motor",      label: "Motor",      Icon: Bike,    desc: "maks 10 kg · Rp 2.000/km" },
  { value: "mobil",      label: "Mobil",      Icon: Car,     desc: "maks 50 kg · Rp 3.000/km" },
  { value: "pickup_box", label: "Pickup Box", Icon: Truck,   desc: "maks 200 kg · box tertutup · Rp 3.500/km" },
  { value: "pickup_bak", label: "Pickup Bak", Icon: Package, desc: "maks 500 kg · bak terbuka · Rp 3.500/km" },
];

const SIM_TYPES = ["A", "B", "C", "A1", "B1"];

const BENEFITS = [
  { Icon: DollarSign, title: "Penghasilan Fleksibel", desc: "Ambil order kapan saja, uang langsung masuk rekening" },
  { Icon: MapPin,     title: "Area Desa Sendiri",     desc: "Antar di sekitar desa, jarak dekat lebih hemat BBM" },
  { Icon: Star,       title: "Rating & Reputasi",     desc: "Rating tinggi = lebih sering dapat order pilihan" },
];

const STEPS = ["Data Diri", "Foto & Dokumen", "Kendaraan", "Rekening"];

// ─── Photo uploader ───────────────────────────────────────────────────────────
function PhotoPicker({
  label, hint, Icon: IconComp, value, onChange,
}: {
  label: string; hint: string;
  Icon: React.ElementType;
  value: File | null;
  onChange: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = value ? URL.createObjectURL(value) : null;

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:border-orange-400 hover:bg-orange-50"
        style={value ? { borderColor: "#EA580C", background: "#FFF7ED" } : { borderColor: "#D1D5DB" }}
      >
        {preview ? (
          <img src={preview} alt="preview" className="w-24 h-24 object-cover rounded-xl" />
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100">
              <IconComp className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-semibold text-gray-700">{hint}</p>
          </>
        )}
        {value && (
          <p className="text-xs text-orange-600 font-semibold">
            {value.name.length > 28 ? value.name.slice(0, 25) + "..." : value.name}
          </p>
        )}
        <p className="text-[10px] text-gray-400">Tap untuk {value ? "ganti" : "pilih"} foto · JPG/PNG maks 5MB</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) onChange(e.target.files[0]); }}
      />
    </div>
  );
}

interface BumdesOption {
  id: number;
  name: string;
  village: string;
  city: string;
}

export default function DaftarKurirPage() {
  const router = useRouter();
  const toast  = useToast();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [bumdesList, setBumdesList] = useState<BumdesOption[]>([]);

  const [photoProfile, setPhotoProfile] = useState<File | null>(null);
  const [photoKtp, setPhotoKtp]         = useState<File | null>(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", id_number: "",
    password: "", password_confirmation: "",
    bumdes_profile_id: "",
    vehicle_type: "motor", vehicle_brand: "", vehicle_plate: "", vehicle_year: "",
    sim_type: "C",
    bank_name: "", bank_account_number: "", bank_account_name: "",
  });

  useEffect(() => {
    api.get("/bumdes").then(res => {
      const data = res.data?.data ?? res.data ?? [];
      setBumdesList(Array.isArray(data) ? data : data.data ?? []);
    }).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = (s: number) => {
    if (s === 1) {
      if (!form.bumdes_profile_id)                             { toast.error("Pilih BUMDes tempat kamu mendaftar."); return false; }
      if (!form.name.trim())                                   { toast.error("Nama lengkap wajib diisi.");     return false; }
      if (!form.email.includes("@"))                           { toast.error("Email tidak valid.");            return false; }
      if (!form.phone.trim())                                  { toast.error("Nomor HP wajib diisi.");         return false; }
      if (!form.id_number.trim())                              { toast.error("Nomor KTP wajib diisi.");        return false; }
      if (form.id_number.length !== 16)                        { toast.error("Nomor KTP harus 16 digit.");     return false; }
      if (form.password.length < 8)                            { toast.error("Password minimal 8 karakter.");  return false; }
      if (form.password !== form.password_confirmation)        { toast.error("Password tidak cocok.");         return false; }
    }
    if (s === 2) {
      if (!photoProfile) { toast.error("Foto profil wajib diupload."); return false; }
      if (!photoKtp)     { toast.error("Foto selfie dengan KTP wajib diupload."); return false; }
    }
    if (s === 3) {
      if (!form.vehicle_brand.trim()) { toast.error("Merek kendaraan wajib diisi."); return false; }
      if (!form.vehicle_plate.trim()) { toast.error("Nomor plat wajib diisi.");      return false; }
    }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("bumdes_profile_id",     form.bumdes_profile_id);
      fd.append("name",                 form.name);
      fd.append("email",                form.email);
      fd.append("phone",                form.phone);
      fd.append("id_number",            form.id_number);
      fd.append("password",             form.password);
      fd.append("password_confirmation",form.password_confirmation);
      fd.append("vehicle_type",         form.vehicle_type);
      fd.append("vehicle_brand",        form.vehicle_brand);
      fd.append("vehicle_plate",        form.vehicle_plate.toUpperCase());
      if (form.vehicle_year)      fd.append("vehicle_year",         form.vehicle_year);
      fd.append("sim_type",             form.sim_type);
      if (form.bank_name)         fd.append("bank_name",            form.bank_name);
      if (form.bank_account_number) fd.append("bank_account_number", form.bank_account_number);
      if (form.bank_account_name) fd.append("bank_account_name",    form.bank_account_name);
      if (photoProfile)           fd.append("photo_profile",        photoProfile);
      if (photoKtp)               fd.append("photo_ktp",            photoKtp);

      await api.post("/register/pengirim", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Pendaftaran berhasil! Akun kamu sedang diverifikasi.");
      router.push("/login?registered=kurir");
    } catch (err: any) {
      const errs = err.response?.data?.errors;
      if (errs) {
        const first = Object.values(errs)[0] as string[];
        toast.error(first[0]);
      } else {
        toast.error(err.response?.data?.message ?? "Pendaftaran gagal. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#FFF7ED" }}>

      <div className="max-w-6xl mx-auto px-4 pb-16 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ── Kiri: Info & benefit ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero */}
            <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)" }}>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <Bike className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-bold leading-tight mb-2">Jadi Kurir<br />BUMDESmart</h1>
              <p className="text-orange-100 text-sm leading-relaxed">
                Antar produk UMKM desa, bantu warga, dan dapatkan penghasilan tambahan yang fleksibel.
              </p>

              {/* Estimasi pendapatan */}
              <div className="mt-5 p-4 bg-white/15 rounded-xl">
                <p className="text-xs text-orange-100 font-medium mb-2">Estimasi penghasilan</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "5 antar/hari", val: "Rp 75rb+" },
                    { label: "10 antar/hari", val: "Rp 150rb+" },
                    { label: "20 antar/hari", val: "Rp 300rb+" },
                  ].map(e => (
                    <div key={e.label} className="bg-white/10 rounded-lg p-2">
                      <p className="text-white font-bold text-sm">{e.val}</p>
                      <p className="text-[10px] text-orange-200 mt-0.5">{e.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-orange-200 mt-2">*estimasi berdasarkan jarak rata-rata 3 km</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              {BENEFITS.map(b => (
                <div key={b.title} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-orange-100">
                  <b.Icon className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" strokeWidth={1.8} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{b.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Alur kerja */}
            <div className="bg-white rounded-2xl border border-orange-100 p-5">
              <p className="text-sm font-bold text-gray-900 mb-4">Cara Kerja Kurir</p>
              <div className="space-y-3">
                {[
                  { n: "1", t: "Daftar & Verifikasi", d: "Isi data, tunggu konfirmasi admin BUMDes" },
                  { n: "2", t: "Set Online",           d: "Buka app, nyalakan status online" },
                  { n: "3", t: "Ambil Order",          d: "Pilih pesanan yang tersedia di area kamu" },
                  { n: "4", t: "Antar & Konfirmasi",   d: "Ambil barang dari seller, antar ke pembeli" },
                  { n: "5", t: "Terima Pembayaran",    d: "Ongkir langsung masuk rekening kamu" },
                ].map(s => (
                  <div key={s.n} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "#EA580C" }}>
                      {s.n}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.t}</p>
                      <p className="text-xs text-gray-500">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Kanan: Form ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-7">

              {/* Step indicator */}
              <div className="flex items-center gap-0 mb-8">
                {STEPS.map((label, i) => {
                  const s = i + 1;
                  const done   = step > s;
                  const active = step === s;
                  return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                          style={done   ? { background: "#EA580C", color: "white" }
                               : active ? { background: "#FFF7ED", color: "#EA580C", border: "2px solid #EA580C" }
                               :          { background: "#F3F4F6", color: "#9CA3AF" }}>
                          {done ? <CheckCircle className="w-4 h-4" /> : s}
                        </div>
                        <p className={`text-[10px] mt-1 font-medium whitespace-nowrap ${active ? "text-orange-600" : done ? "text-gray-600" : "text-gray-400"}`}>
                          {label}
                        </p>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all"
                          style={{ background: step > s ? "#EA580C" : "#E5E7EB" }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── STEP 1: Data Diri ── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Data Diri</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Informasi akun dan identitas kamu</p>
                  </div>

                  {/* BUMDes Selector */}
                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-orange-600" />
                      BUMDes Tempat Mendaftar <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.bumdes_profile_id}
                      onChange={e => set("bumdes_profile_id", e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 bg-white"
                    >
                      <option value="">-- Pilih BUMDes kamu --</option>
                      {bumdesList.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} — {b.village}{b.city ? `, ${b.city}` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-orange-600 mt-1.5">
                      Pilih BUMDes di desamu. Admin BUMDes yang akan memverifikasi pendaftaranmu.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Lengkap (sesuai KTP)</label>
                      <input value={form.name} onChange={e => set("name", e.target.value)}
                        placeholder="Budi Santoso"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                      <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                        placeholder="budi@email.com"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nomor HP (WhatsApp)</label>
                      <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nomor KTP (NIK)</label>
                      <input value={form.id_number} onChange={e => set("id_number", e.target.value.replace(/\D/g, "").slice(0, 16))}
                        placeholder="16 digit angka"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50 tracking-widest font-mono" />
                      <p className="text-[10px] text-gray-400 mt-1">{form.id_number.length}/16 digit</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                      <div className="relative">
                        <input type={showPass ? "text" : "password"} value={form.password}
                          onChange={e => set("password", e.target.value)} placeholder="Min. 8 karakter"
                          className="w-full px-4 pr-11 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPass ? <EyeOff className="w-4.5 h-4.5" style={{width:18,height:18}} /> : <Eye className="w-4.5 h-4.5" style={{width:18,height:18}} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Konfirmasi Password</label>
                      <input type="password" value={form.password_confirmation}
                        onChange={e => set("password_confirmation", e.target.value)} placeholder="Ulangi password"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
                    </div>
                  </div>

                  <button onClick={() => { if (validate(1)) setStep(2); }}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition mt-2 flex items-center justify-center gap-2"
                    style={{ background: "#EA580C" }}>
                    Lanjut ke Foto & Dokumen <ChevronRight className="w-4 h-4" />
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-3">
                    Sudah punya akun?{" "}
                    <Link href="/login" className="font-semibold text-orange-600 hover:underline">
                      Masuk di sini
                    </Link>
                  </p>
                </div>
              )}

              {/* ── STEP 2: Foto & Dokumen ── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Foto & Dokumen</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Digunakan untuk verifikasi identitas oleh admin BUMDes</p>
                  </div>

                  {/* Info box */}
                  <div className="flex gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <IdCard className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Kenapa perlu dua foto?</p>
                      <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                        <strong>Foto profil</strong> akan tampil di dashboard dan dilihat pembeli.
                        <strong> Foto selfie + KTP</strong> hanya untuk verifikasi admin — memastikan kamu adalah pemilik KTP tersebut.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PhotoPicker
                      label="Foto Profil"
                      hint="Upload foto wajah kamu"
                      Icon={Camera}
                      value={photoProfile}
                      onChange={setPhotoProfile}
                    />
                    <PhotoPicker
                      label="Selfie Sambil Pegang KTP"
                      hint="Foto kamu & KTP dalam satu frame"
                      Icon={IdCard}
                      value={photoKtp}
                      onChange={setPhotoKtp}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 space-y-1.5">
                    <p className="text-xs font-bold text-orange-800 mb-2">Tips foto yang diterima:</p>
                    {[
                      "Wajah terlihat jelas, tidak buram",
                      "Pencahayaan cukup, tidak gelap",
                      "KTP terbaca dengan jelas",
                      "Gunakan foto terbaru (bukan foto lama)",
                    ].map(t => (
                      <div key={t} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <p className="text-xs text-orange-700">{t}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                    <button onClick={() => { if (validate(2)) setStep(3); }}
                      className="flex-[2] py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ background: "#EA580C" }}>
                      Lanjut ke Kendaraan <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Kendaraan ── */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Data Kendaraan</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Informasi kendaraan yang kamu gunakan</p>
                  </div>

                  {/* Vehicle type cards */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Jenis Kendaraan</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {VEHICLES.map(v => (
                        <button key={v.value} onClick={() => set("vehicle_type", v.value)}
                          className="flex items-center gap-3 py-3 px-4 rounded-xl border-2 transition-all text-left"
                          style={form.vehicle_type === v.value
                            ? { borderColor: "#EA580C", background: "#FFF7ED" }
                            : { borderColor: "#E5E7EB", background: "white" }}>
                          <v.Icon className="w-5 h-5 shrink-0" strokeWidth={1.8}
                            style={{ color: form.vehicle_type === v.value ? "#EA580C" : "#9CA3AF" }} />
                          <div>
                            <p className="text-sm font-bold leading-none" style={{ color: form.vehicle_type === v.value ? "#EA580C" : "#374151" }}>
                              {v.label}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{v.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Merek & Model Kendaraan</label>
                      <input value={form.vehicle_brand} onChange={e => set("vehicle_brand", e.target.value)}
                        placeholder="Honda Beat, Toyota Avanza, dll"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nomor Plat</label>
                      <input value={form.vehicle_plate} onChange={e => set("vehicle_plate", e.target.value.toUpperCase())}
                        placeholder="D 1234 XYZ"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50 font-mono tracking-widest uppercase" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tahun Kendaraan</label>
                      <input type="number" value={form.vehicle_year} onChange={e => set("vehicle_year", e.target.value)}
                        placeholder="2020" min={1990} max={2025}
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
                    </div>
                  </div>

                  {/* SIM */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Jenis SIM yang Dimiliki</label>
                    <div className="flex gap-2 flex-wrap">
                      {SIM_TYPES.map(s => (
                        <button key={s} onClick={() => set("sim_type", s)}
                          className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                          style={form.sim_type === s
                            ? { borderColor: "#EA580C", background: "#FFF7ED", color: "#EA580C" }
                            : { borderColor: "#E5E7EB", background: "white", color: "#6B7280" }}>
                          SIM {s}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      Motor → SIM C &nbsp;|&nbsp; Mobil/Pickup → SIM A &nbsp;|&nbsp; Tidak punya SIM → tidak bisa daftar
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                    <button onClick={() => { if (validate(3)) setStep(4); }}
                      className="flex-[2] py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ background: "#EA580C" }}>
                      Lanjut ke Rekening <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Rekening ── */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Rekening Bank</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Untuk menerima pembayaran ongkir. Bisa dilengkapi nanti.</p>
                  </div>

                  <div className="flex gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100">
                    <CreditCard className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800">Pembayaran Ongkir</p>
                      <p className="text-xs text-orange-700 mt-0.5 leading-relaxed">
                        Setiap pesanan terkirim, ongkir langsung masuk ke rekening ini. Pastikan nama pemilik rekening sesuai nama pendaftaran.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Bank</label>
                      <select value={form.bank_name} onChange={e => set("bank_name", e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50">
                        <option value="">-- Pilih Bank --</option>
                        {["BRI", "BNI", "BCA", "Mandiri", "BSI", "BTN", "CIMB Niaga", "Permata", "Jenius/SMBC", "OVO", "GoPay", "Dana"].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nomor Rekening</label>
                      <input value={form.bank_account_number} onChange={e => set("bank_account_number", e.target.value.replace(/\D/g, ""))}
                        placeholder="Nomor rekening tanpa spasi"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50 font-mono" />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Pemilik Rekening</label>
                      <input value={form.bank_account_name} onChange={e => set("bank_account_name", e.target.value)}
                        placeholder="Harus sama persis dengan nama di buku tabungan"
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <p className="text-xs font-bold text-gray-700 mb-2">Sebelum mendaftar, pastikan:</p>
                    {[
                      "Nama yang diisi sesuai KTP",
                      "Nomor plat kendaraan aktif dan benar",
                      "Rekening bank aktif atas nama sendiri",
                      "Nomor HP bisa dihubungi via WhatsApp",
                    ].map(c => (
                      <div key={c} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                        <p className="text-xs text-gray-600">{c}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(3)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                      className="flex-[2] py-3.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2"
                      style={{ background: "#EA580C" }}>
                      <Rocket className="w-4 h-4" />
                      {loading ? "Mendaftar..." : "Daftar Sekarang"}
                    </button>
                  </div>

                  <p className="text-center text-xs text-gray-400">
                    Dengan mendaftar, kamu menyetujui syarat & ketentuan kurir BUMDESmart.
                    Akun aktif setelah diverifikasi admin BUMDes (1–2 hari kerja).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
