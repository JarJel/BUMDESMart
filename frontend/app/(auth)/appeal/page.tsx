"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import api from "@/lib/api/axios";

export default function AppealPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    email: "",
    reason: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.reason) {
      toast.error("Email dan alasan pengajuan wajib diisi.");
      return;
    }

    if (form.reason.length < 10) {
      toast.error("Alasan pengajuan terlalu singkat (minimal 10 karakter).");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/appeal', {
        email: form.email,
        reason: form.reason,
        captcha_token: "dummy-token-for-now", // Implementasikan reCAPTCHA/hCaptcha sesungguhnya di sini
      });
      
      setSuccess(true);
      toast.success(res.data.message || "Pengajuan Anda telah diterima.");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || "Terjadi kesalahan saat mengirim pengajuan. Silakan coba lagi nanti.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F7F4" }}>
      <div className="flex-1 flex items-center justify-center px-4 pb-12 pt-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <div className="flex flex-col items-center mb-5">
            <Link href="/">
              <img src="/logo.png" alt="BumDesMartNukita" className="h-16 w-auto" />
            </Link>
            <span className="font-bold text-lg mt-1" style={{ color: "var(--primary-dark)" }}>BumDesMartNukita</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Pengajuan Pengaktifan Akun</h1>
          <p className="text-sm text-gray-500 text-center mb-7">Silakan isi formulir di bawah ini untuk memohon pengaktifan kembali akun Anda yang ditangguhkan.</p>

          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-5 rounded-xl text-center space-y-4">
              <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">Pengajuan Anda telah diterima dan akan segera ditinjau oleh Admin. Kami akan menginformasikan hasilnya melalui email.</p>
              <Link href="/" className="inline-block px-4 py-2 bg-white border border-green-300 rounded-lg text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors">
                Kembali ke Beranda
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email yang terdaftar di BumDesMartNukita"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Alasan Pengajuan</label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Jelaskan mengapa Anda merasa akun Anda harus diaktifkan kembali..."
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ background: "var(--primary)" }}
              >
                {loading ? "Mengirim..." : "Kirim Pengajuan"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
              &larr; Kembali ke halaman Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
