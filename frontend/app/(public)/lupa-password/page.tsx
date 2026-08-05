"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api/auth";
import { useToast } from "@/components/ui/Toast";

// ─── Helper Components ────────────────────────────────────────────────────────
function StepBadge({ num, active = false, done = false }: { num: number; active?: boolean; done?: boolean }) {
  return (
    <div
      className="flex items-center justify-center rounded-full text-xs font-bold shrink-0 transition-all"
      style={{
        width: 28, height: 28,
        background: done ? "var(--primary)" : active ? "var(--primary)" : "#e5e7eb",
        color: done || active ? "white" : "#9ca3af",
      }}
    >
      {done ? (
        <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : num}
    </div>
  );
}

function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 mb-7">
      <StepBadge num={1} active={step === 1} done={step > 1} />
      <div className="flex-1 h-0.5 rounded transition-all" style={{ background: step > 1 ? "var(--primary)" : "var(--border)" }} />
      <StepBadge num={2} active={step === 2} done={step > 2} />
      <div className="flex-1 h-0.5 rounded transition-all" style={{ background: step > 2 ? "var(--primary)" : "var(--border)" }} />
      <StepBadge num={3} active={step === 3} done={false} />
    </div>
  );
}

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-4-8a9.953 9.953 0 014 0M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const getScore = useCallback((p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, []);
  const score = getScore(password);
  const labels = ["", "Lemah", "Cukup", "Kuat", "Sangat Kuat"];
  const colors = ["", "#f87171", "#fb923c", "#4ade80", "#22c55e"];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all"
            style={{ background: i <= score ? colors[score] : "#e5e7eb" }} />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[score] || "#9ca3af" }}>
        {labels[score] || "Masukkan password"}
      </p>
    </div>
  );
}

// ─── STEP 1: Input Email → POST /forgot-password ──────────────────────────────
function StepEmail({ onNext }: { onNext: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Email wajib diisi."); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast.success("Kode OTP berhasil dikirim ke email Anda.");
      onNext(email);
    } catch (err: any) {
      const msg =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.error ||
        "Email tidak ditemukan.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar step={1} />
      <h1 className="text-xl font-bold text-gray-900 mb-1">Lupa Password?</h1>
      <p className="text-sm text-gray-500 mb-6">
        Masukkan email akun Anda. Kami akan mengirim kode OTP 6 digit.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Email</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--primary)" }}>
              <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@email.com"
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              autoFocus
            />
          </div>
        </div>
        <button
          id="btn-kirim-otp"
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--primary)" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Mengirim OTP...
            </span>
          ) : "Kirim Kode OTP"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Ingat password?{" "}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>
          Masuk Sekarang
        </Link>
      </p>
    </>
  );
}

// ─── STEP 2: Input OTP → POST /verify-otp ────────────────────────────────────
function StepOtp({ email, onNext, onBack }: { email: string; onNext: (otp: string) => void; onBack: () => void }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast.success("Kode OTP baru telah dikirim.");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch { toast.error("Gagal mengirim ulang OTP."); }
    finally { setResendLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { toast.error("Masukkan 6 digit kode OTP."); return; }

    setLoading(true);
    try {
      // Validasi OTP ke BE — kalau salah, BE langsung return error
      await authApi.verifyOtp({ email, otp: code });
      // Kalau sampai sini berarti OTP benar → lanjut ke step 3
      onNext(code);
    } catch (err: any) {
      const msg =
        err.response?.data?.errors?.otp?.[0] ||
        err.response?.data?.error ||
        "Kode OTP tidak valid.";
      toast.error(msg);
      // Reset kotak OTP agar user ketik ulang
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar step={2} />
      <h1 className="text-xl font-bold text-gray-900 mb-1">Masukkan Kode OTP</h1>
      <p className="text-sm text-gray-500 mb-1">Kode OTP 6 digit telah dikirim ke:</p>
      <p className="text-sm font-semibold mb-6 truncate" style={{ color: "var(--primary)" }}>{email}</p>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-2.5 justify-center mb-4" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
              className="text-center text-lg font-bold border-2 rounded-xl transition-all focus:outline-none"
              style={{
                width: 48, height: 52,
                borderColor: digit ? "var(--primary)" : "#e5e7eb",
                background: digit ? "var(--primary-muted)" : "#f9fafb",
                color: "var(--primary-dark)",
              }}
            />
          ))}
        </div>

        <div className="text-center mb-5">
          {resendCooldown > 0 ? (
            <p className="text-xs text-gray-400">
              Kirim ulang dalam{" "}
              <span className="font-semibold" style={{ color: "var(--primary)" }}>{resendCooldown}s</span>
            </p>
          ) : (
            <button type="button" id="btn-resend-otp" onClick={handleResend} disabled={resendLoading}
              className="text-xs font-semibold hover:underline disabled:opacity-50"
              style={{ color: "var(--primary)" }}>
              {resendLoading ? "Mengirim..." : "Kirim Ulang OTP"}
            </button>
          )}
        </div>

        <button
          id="btn-verifikasi-otp"
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--primary)" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Memverifikasi...
            </span>
          ) : "Verifikasi OTP"}
        </button>
      </form>

      <button type="button" onClick={onBack}
        className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">
        ← Ganti Email
      </button>
    </>
  );
}

// ─── STEP 3: Input Password Baru → POST /reset-password ──────────────────────
function StepPassword({ email, otp, onBack }: { email: string; otp: string; onBack: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ password: "", password_confirmation: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password minimal 8 karakter."); return; }
    if (form.password !== form.password_confirmation) { toast.error("Konfirmasi password tidak cocok."); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, password: form.password, password_confirmation: form.password_confirmation });
      toast.success("Password berhasil diubah! Silakan login.");
      router.push("/login");
    } catch (err: any) {
      const msg =
        err.response?.data?.errors?.password?.[0] ||
        err.response?.data?.error ||
        "Gagal mengubah password.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar step={3} />
      <h1 className="text-xl font-bold text-gray-900 mb-1">Buat Password Baru</h1>
      <p className="text-sm text-gray-500 mb-6">
        OTP terverifikasi ✅ Silakan buat password baru untuk akun Anda.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--primary)" }}>
              <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="new-password"
              type={showPass ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimal 8 karakter"
              className="w-full pl-10 pr-11 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              autoFocus
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <EyeIcon show={showPass} />
            </button>
          </div>
          {form.password && <PasswordStrength password={form.password} />}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--primary)" }}>
              <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              placeholder="Ulangi password baru"
              className="w-full pl-10 pr-11 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
              style={{
                borderColor: form.password_confirmation && form.password !== form.password_confirmation ? "#f87171" : undefined,
              }}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <EyeIcon show={showConfirm} />
            </button>
          </div>
          {form.password_confirmation && form.password !== form.password_confirmation && (
            <p className="text-xs text-red-500 mt-1.5">Password tidak cocok.</p>
          )}
        </div>

        <button
          id="btn-simpan-password"
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--primary)" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Menyimpan...
            </span>
          ) : "Simpan Password Baru"}
        </button>
      </form>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LupaPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F7F4" }}>
      <div className="flex-1 flex items-center justify-center px-4 pb-12 pt-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <div className="flex flex-col items-center mb-6">
            <Link href="/">
              <img src="/logo.png" alt="BUMDESmart" className="h-14 w-auto" />
            </Link>
            <span className="font-bold text-base mt-1" style={{ color: "var(--primary-dark)" }}>
              BUMDESmart
            </span>
          </div>

          {step === 1 && (
            <StepEmail onNext={(e) => { setEmail(e); setStep(2); }} />
          )}
          {step === 2 && (
            <StepOtp
              email={email}
              onNext={(code) => { setOtp(code); setStep(3); }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepPassword email={email} otp={otp} onBack={() => setStep(2)} />
          )}
        </div>
      </div>
    </div>
  );
}
