"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api/auth";

export default function DaftarPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [agreed, setAgreed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("Anda harus menyetujui Syarat dan Ketentuan terlebih dahulu.");
      return;
    }

    if (form.password !== form.password_confirmation) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        phone: "",
      });
      router.push("/login?registered=1");
    } catch (err: any) {
      const msg =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.password?.[0] ||
        err.response?.data?.error ||
        "Terjadi kesalahan. Silakan coba lagi.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ show }: { show: boolean }) =>
    show ? (
      <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    ) : (
      <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-4-8a9.953 9.953 0 014 0M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F7F4" }}>
      <div className="flex items-center px-6 py-4">
        <Link href="/" className="text-lg font-bold" style={{ color: "var(--primary-dark)" }}>BumdesMart</Link>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pb-12 pt-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Daftar di BumdesMart</h1>
          <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
            Bergabunglah untuk mendukung produk desa dan UMKM Indonesia.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email atau No. HP</label>
              <input
                type="text"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Contoh: 08123456789 atau email@domain.com"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-4 pr-12 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <EyeIcon show={showPass} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Kata Sandi</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="Ulangi kata sandi Anda"
                  className="w-full px-4 pr-12 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <EyeIcon show={showConfirm} />
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 accent-green-600"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                Saya menyetujui{" "}
                <Link href="#" className="font-medium" style={{ color: "var(--primary)" }}>Syarat dan Ketentuan</Link>
                {" "}serta{" "}
                <Link href="#" className="font-medium" style={{ color: "var(--primary)" }}>Kebijakan Privasi</Link>
                {" "}BumdesMart.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--primary)" }}
            >
              {loading ? "Memproses..." : "Daftar Sekarang"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 shrink-0 uppercase tracking-wide">Atau Daftar Dengan</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button type="button" onClick={() => alert("Fitur Google Login akan segera hadir")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>Masuk Sekarang</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
