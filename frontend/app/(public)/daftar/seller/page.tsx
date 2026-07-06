"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const steps = ["Pilih BUMDes", "Informasi Akun", "Profil Toko", "Dokumen", "Tinjau"];

interface BumdesProfile { id: number; name: string; village: string; city: string; province: string; }
interface RequiredDocument { id: number; name: string; description: string | null; is_required: boolean; }

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i < current ? "text-white" : i === current ? "text-white" : "bg-gray-100 text-gray-400"}`}
              style={i <= current ? { background: "var(--primary)" } : {}}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-xs mt-1 hidden sm:block ${i === current ? "font-semibold text-green-700" : "text-gray-400"}`}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-8 sm:w-12 h-0.5 mx-1 ${i < current ? "" : "bg-gray-200"}`} style={i < current ? { background: "var(--primary)" } : {}} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function DaftarMerchantPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Data
  const [bumdesList, setBumdesList] = useState<BumdesProfile[]>([]);
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocument[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, File | null>>({});

  // Form state
  const [selectedBumdes, setSelectedBumdes] = useState<BumdesProfile | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", password_confirmation: "",
    shop_name: "", description: "",
  });

  useEffect(() => {
    axios.get(`${API}/bumdes`).then(r => setBumdesList(r.data.data ?? []));
  }, []);

  const handleSelectBumdes = async (bumdes: BumdesProfile) => {
    setSelectedBumdes(bumdes);
    const res = await axios.get(`${API}/bumdes/${bumdes.id}/required-documents`);
    setRequiredDocs(res.data.data ?? []);
    setUploadedFiles({});
    setStep(1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (docId: number, file: File | null) => {
    setUploadedFiles(prev => ({ ...prev, [docId]: file }));
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await axios.post(`${API}/register/umkm`, {
        ...form,
        bumdes_profile_id: selectedBumdes?.id,
      });
      router.push("/login?registered=mitra");
    } catch (err: any) {
      const errs = err.response?.data?.errors;
      if (errs) {
        setError(Object.values(errs).flat().join(", "));
      } else {
        setError(err.response?.data?.message ?? "Pendaftaran gagal. Coba lagi.");
      }
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: "var(--surface)" }}>
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <Link href="/mitra" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </Link>

          <div className="flex flex-col items-center mb-5">
            <img src="/logo.png" alt="BUMDESmart" className="h-14 w-auto" />
            <span className="font-bold text-base mt-1" style={{ color: "var(--primary-dark)" }}>BUMDESmart</span>
          </div>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Daftar Jadi Mitra</h1>
            <p className="text-sm text-gray-500 mt-1">Bergabunglah dan jual produk desa Anda di BUMDESmart.</p>
          </div>

          <StepIndicator current={step} />

          {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}

          {/* Step 0: Pilih BUMDes */}
          {step === 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Pilih BUMDes / Desa</h2>
              <p className="text-xs text-gray-500 mb-4">Pilih BUMDes tempat usaha kamu terdaftar</p>
              {bumdesList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Belum ada BUMDes terdaftar.</p>
              ) : (
                <div className="space-y-3">
                  {bumdesList.map(b => (
                    <button
                      key={b.id}
                      onClick={() => handleSelectBumdes(b)}
                      className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all group"
                    >
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700">{b.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{b.village}, {b.city}, {b.province}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Informasi Akun */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Informasi Akun</h2>
              {selectedBumdes && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700">
                  BUMDes: <span className="font-semibold">{selectedBumdes.name}</span> · {selectedBumdes.village}, {selectedBumdes.city}
                </div>
              )}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
                Email yang digunakan harus akun <span className="font-semibold">Gmail (@gmail.com)</span>
              </div>
              {[
                { name: "name", label: "Nama Lengkap", type: "text", placeholder: "Nama lengkap Anda" },
                { name: "email", label: "Email (Gmail)", type: "email", placeholder: "contoh@gmail.com" },
                { name: "phone", label: "Nomor Telepon", type: "tel", placeholder: "08xxxxxxxxxx" },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input type={f.type} name={f.name} value={(form as any)[f.name]} onChange={handleChange}
                    placeholder={f.placeholder} className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50" />
                </div>
              ))}
              {[
                { name: "password", label: "Kata Sandi", show: showPass, toggle: () => setShowPass(!showPass) },
                { name: "password_confirmation", label: "Konfirmasi Kata Sandi", show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <div className="relative">
                    <input type={f.show ? "text" : "password"} name={f.name} value={(form as any)[f.name]} onChange={handleChange}
                      placeholder="Minimal 8 karakter" className="w-full px-4 pr-12 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50" />
                    <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-4-8a9.953 9.953 0 014 0M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(0)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">← Kembali</button>
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "var(--primary)" }}>Lanjutkan →</button>
              </div>
            </div>
          )}

          {/* Step 2: Profil Toko */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Profil Toko</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Toko <span className="text-red-500">*</span></label>
                <input type="text" name="shop_name" value={form.shop_name} onChange={handleChange}
                  placeholder="Nama toko Anda" className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi Toko</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  rows={3} placeholder="Ceritakan tentang toko Anda..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">← Kembali</button>
                <button onClick={() => setStep(requiredDocs.length > 0 ? 3 : 4)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "var(--primary)" }}>Lanjutkan →</button>
              </div>
            </div>
          )}

          {/* Step 3: Dokumen */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Verifikasi Dokumen</h2>
              <p className="text-xs text-gray-500 mb-4">
                Dokumen berikut diwajibkan oleh <span className="font-semibold">{selectedBumdes?.name}</span>
              </p>
              {requiredDocs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">BUMDes belum menentukan dokumen wajib.</p>
              ) : (
                requiredDocs.map(doc => (
                  <div key={doc.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-700">{doc.name}</label>
                      {doc.is_required && <span className="text-xs text-red-500">*wajib</span>}
                    </div>
                    {doc.description && <p className="text-xs text-gray-400 mb-2">{doc.description}</p>}
                    <label className="block border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-green-300 cursor-pointer transition-colors">
                      <input type="file" accept="image/*,.pdf" className="hidden"
                        onChange={e => handleFileChange(doc.id, e.target.files?.[0] ?? null)} />
                      {uploadedFiles[doc.id] ? (
                        <p className="text-sm text-green-700 font-medium">✓ {uploadedFiles[doc.id]?.name}</p>
                      ) : (
                        <>
                          <p className="text-xs text-gray-500">Klik untuk upload file</p>
                          <p className="text-xs text-gray-400 mt-1">JPG / PNG / PDF, maks 5MB</p>
                        </>
                      )}
                    </label>
                  </div>
                ))
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">← Kembali</button>
                <button onClick={() => setStep(4)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "var(--primary)" }}>Lanjutkan →</button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Tinjau Pendaftaran</h2>
              {[
                { section: "BUMDes", items: [`${selectedBumdes?.name} · ${selectedBumdes?.village}, ${selectedBumdes?.city}`] },
                { section: "Akun", items: [`Nama: ${form.name}`, `Email: ${form.email}`, `Telepon: ${form.phone}`] },
                { section: "Toko", items: [`Nama Toko: ${form.shop_name}`] },
                { section: "Dokumen", items: requiredDocs.length > 0 ? requiredDocs.map(d => `${d.name}: ${uploadedFiles[d.id] ? "✓ Terupload" : "Belum diupload"}`) : ["BUMDes belum menetapkan dokumen wajib — akan dikonfirmasi oleh admin"] },
              ].map(block => (
                <div key={block.section} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{block.section}</p>
                  {block.items.map(item => <p key={item} className="text-sm text-gray-700">{item}</p>)}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(requiredDocs.length > 0 ? 3 : 2)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">← Kembali</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--primary)" }}>
                  {submitting ? "Mengirim..." : "Kirim Pendaftaran ✓"}
                </button>
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
