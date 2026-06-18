"use client";

import Link from "next/link";
import { useState } from "react";

const steps = ["Informasi Akun", "Profil Toko", "Verifikasi Dokumen", "Tinjau Pendaftaran"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i < current ? "text-white" : i === current ? "text-white" : "bg-gray-100 text-gray-400"}`}
              style={i <= current ? { background: "var(--primary)" } : {}}>
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-xs mt-1 hidden sm:block ${i === current ? "font-semibold text-green-700" : "text-gray-400"}`}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-10 sm:w-16 h-0.5 mx-1 ${i < current ? "" : "bg-gray-200"}`} style={i < current ? { background: "var(--primary)" } : {}} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function DaftarMerchantPage() {
  const [step, setStep] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: "var(--surface)" }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <Link href="/mitra" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </Link>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Daftar di BumdesMart</h1>
            <p className="text-sm text-gray-500 mt-1">Bergabunglah untuk membantu produk desa dan UMKM Indonesia.</p>
          </div>

          <StepIndicator current={step} />

          {/* Step 0: Informasi Akun */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Informasi Akun</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                <input type="text" placeholder="Masukkan nama lengkap Anda" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email atau No. HP</label>
                <input type="text" placeholder="Contoh: 08123456789 atau email@domain.com" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Telepon</label>
                <input type="tel" placeholder="Masukkan nomor telepon aktif" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Lahir</label>
                <input type="date" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none text-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Lengkap</label>
                <textarea rows={3} placeholder="Masukkan alamat lengkap Anda" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kata Sandi</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} placeholder="Minimal 8 karakter" className="w-full px-4 pr-12 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-4-8a9.953 9.953 0 014 0M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Kata Sandi</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} placeholder="Ulangi kata sandi Anda" className="w-full px-4 pr-12 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-4-8a9.953 9.953 0 014 0M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                </div>
              </div>
              <button onClick={() => setStep(1)} className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-colors" style={{ background: "var(--primary)" }}>
                Lanjutkan →
              </button>
            </div>
          )}

          {/* Step 1: Profil Toko */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Profil Toko</h2>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mx-auto mb-3 cursor-pointer hover:border-green-400 transition-colors">
                  <span className="text-2xl mb-1">📷</span>
                  <span className="text-xs text-gray-400">Logo Toko</span>
                </div>
              </div>
              {[
                { label: "Nama Toko", placeholder: "Nama toko Anda" },
                { label: "Tagline Toko", placeholder: "Slogan singkat toko Anda" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input type="text" placeholder={f.placeholder} className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi Toko</label>
                <textarea rows={3} placeholder="Ceritakan tentang toko Anda..." className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lokasi Toko</label>
                <input type="text" placeholder="RT/RW, Dusun, Desa Lengkong" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(0)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">← Kembali</button>
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "var(--primary)" }}>Lanjutkan →</button>
              </div>
            </div>
          )}

          {/* Step 2: Verifikasi Dokumen */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Verifikasi Dokumen</h2>
              {[
                { label: "Foto KTP", desc: "Upload foto KTP Anda yang jelas", required: true, icon: "🪪" },
                { label: "Selfie dengan KTP", desc: "Foto selfie sambil memegang KTP", required: true, icon: "🤳" },
                { label: "Foto Produk / Toko", desc: "Foto produk atau tampak depan toko (opsional)", required: false, icon: "📸" },
              ].map((doc) => (
                <div key={doc.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">{doc.label}</label>
                    {doc.required && <span className="text-xs text-red-500">*wajib</span>}
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-green-300 cursor-pointer transition-colors">
                    <span className="text-3xl block mb-1">{doc.icon}</span>
                    <p className="text-xs text-gray-500">{doc.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">JPG/PNG, maks 5MB</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">← Kembali</button>
                <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "var(--primary)" }}>Lanjutkan →</button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Tinjau Pendaftaran Anda</h2>
              {[
                { section: "Informasi Akun", items: ["Nama Lengkap: Ahmad Maulana", "Email/HP: 081234567890", "Nomor Telepon: 081234567890", "Tanggal Lahir: 01/01/1990"] },
                { section: "Profil Toko", items: ["Nama Toko: Keripik Mang Asep", "Tagline: Renyah, Gurih, Asli Desa"] },
                { section: "Verifikasi Dokumen", items: ["KTP: ✓ Terupload", "Selfie KTP: ✓ Terupload"] },
              ].map((block) => (
                <div key={block.section} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{block.section}</p>
                    <button className="text-xs font-medium" style={{ color: "var(--primary)" }}>Edit</button>
                  </div>
                  {block.items.map((item) => (
                    <p key={item} className="text-sm text-gray-700">{item}</p>
                  ))}
                </div>
              ))}
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 mt-0.5 accent-green-600" />
                <span className="text-xs text-gray-500 leading-relaxed">
                  Saya setuju dengan{" "}
                  <Link href="#" className="font-medium" style={{ color: "var(--primary)" }}>Syarat & Ketentuan</Link>
                  {" "}BumdesMart
                </span>
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">← Kembali</button>
                <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "var(--primary)" }}>Kirim Pendaftaran ✓</button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>Masuk Sekarang</Link>
          </p>
        </div>
      </div>
    </div>
  );
}