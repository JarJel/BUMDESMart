"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

const VEHICLE_TYPES = [
  { value: "motor",   label: "Motor" },
  { value: "mobil",   label: "Mobil" },
  { value: "pickup",  label: "Pickup" },
  { value: "sepeda",  label: "Sepeda" },
];

const SIM_TYPES = [
  { value: "A",  label: "SIM A" },
  { value: "B",  label: "SIM B" },
  { value: "C",  label: "SIM C" },
  { value: "A1", label: "SIM A1" },
  { value: "B1", label: "SIM B1" },
];

export default function DaftarKurirPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    vehicle_type: "motor",
    vehicle_brand: "",
    vehicle_plate: "",
    vehicle_year: "",
    sim_type: "C",
  });

  const set = (field: string, val: string) =>
    setForm(prev => ({ ...prev, [field]: val }));

  const validateStep1 = () => {
    if (!form.name.trim()) { toast.error("Nama lengkap wajib diisi."); return false; }
    if (!form.email.includes("@")) { toast.error("Email tidak valid."); return false; }
    if (!form.phone.trim()) { toast.error("Nomor HP wajib diisi."); return false; }
    if (form.password.length < 8) { toast.error("Password minimal 8 karakter."); return false; }
    if (form.password !== form.password_confirmation) { toast.error("Password tidak cocok."); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!form.vehicle_brand.trim()) { toast.error("Merek kendaraan wajib diisi."); return false; }
    if (!form.vehicle_plate.trim()) { toast.error("Nomor plat wajib diisi."); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await api.post("/register/pengirim", {
        ...form,
        vehicle_year: form.vehicle_year ? Number(form.vehicle_year) : undefined,
      });
      toast.success("Pendaftaran berhasil! Silakan login.");
      router.push("/login?registered=kurir");
    } catch (err: any) {
      const errs = err.response?.data?.errors;
      if (errs) {
        const first = Object.values(errs)[0] as string[];
        toast.error(first[0]);
      } else {
        toast.error(err.response?.data?.error ?? "Pendaftaran gagal. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F7F4" }}>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-100 p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <Link href="/">
              <img src="/logo.png" alt="BUMDESmart" className="h-12 w-auto" />
            </Link>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#FFF7ED" }}>
                <svg className="w-4 h-4" style={{ color: "#EA580C" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">Daftar sebagai Pengirim</span>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-7">
            {[1, 2].map(s => (
              <div key={s} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={step >= s
                    ? { background: "#EA580C", color: "white" }
                    : { background: "#F3F4F6", color: "#9CA3AF" }}>
                  {step > s ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s}
                </div>
                <p className="text-[10px] text-gray-500">{s === 1 ? "Data Diri" : "Kendaraan"}</p>
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="Budi Santoso"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="budi@email.com"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor HP</label>
                <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={form.password}
                    onChange={e => set("password", e.target.value)} placeholder="Min. 8 karakter"
                    className="w-full px-4 pr-12 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPass
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-4-8a9.953 9.953 0 014 0M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      }
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
                <input type="password" value={form.password_confirmation}
                  onChange={e => set("password_confirmation", e.target.value)} placeholder="Ulangi password"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
              </div>
              <button onClick={() => { if (validateStep1()) setStep(2); }}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 mt-2"
                style={{ background: "#EA580C" }}>
                Lanjut
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Kendaraan</label>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_TYPES.map(v => (
                    <button key={v.value} onClick={() => set("vehicle_type", v.value)}
                      className="py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all"
                      style={form.vehicle_type === v.value
                        ? { borderColor: "#EA580C", background: "#FFF7ED", color: "#EA580C" }
                        : { borderColor: "#E5E7EB", background: "white", color: "#6B7280" }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Merek Kendaraan</label>
                <input value={form.vehicle_brand} onChange={e => set("vehicle_brand", e.target.value)}
                  placeholder="Honda, Yamaha, Toyota, dll"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Plat</label>
                  <input value={form.vehicle_plate} onChange={e => set("vehicle_plate", e.target.value)}
                    placeholder="B 1234 XYZ"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50 uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tahun</label>
                  <input type="number" value={form.vehicle_year} onChange={e => set("vehicle_year", e.target.value)}
                    placeholder="2020"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis SIM</label>
                <div className="flex gap-2 flex-wrap">
                  {SIM_TYPES.map(s => (
                    <button key={s.value} onClick={() => set("sim_type", s.value)}
                      className="px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all"
                      style={form.sim_type === s.value
                        ? { borderColor: "#EA580C", background: "#FFF7ED", color: "#EA580C" }
                        : { borderColor: "#E5E7EB", background: "white", color: "#6B7280" }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Kembali
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#EA580C" }}>
                  {loading ? "Mendaftar..." : "Daftar Sekarang"}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "#EA580C" }}>
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
