"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/hooks/useAuth";

const tabs = ["Profil Saya", "Alamat", "Keamanan"];

export default function ProfilPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [tab, setTab] = useState("Profil Saya");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    authApi.getProfile()
      .then((res) => {
        const d = res.data.data;
        setForm({
          name: d.name || "",
          email: d.email || "",
          phone: d.customer?.phone || d.phone || "",
          date_of_birth: d.customer?.date_of_birth || "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await authApi.updateProfile({
        name: form.name,
        phone: form.phone,
        date_of_birth: form.date_of_birth || undefined,
      });
      setMessage("Profil berhasil diperbarui.");
    } catch {
      setMessage("Gagal memperbarui profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : "?";

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center text-sm text-gray-500">
        {authLoading ? "Memuat..." : ""}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Akun Saya</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-56 shrink-0 space-y-3">
          {/* Avatar card */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-2" style={{ background: "var(--primary)" }}>
              {getInitial(form.name)}
            </div>
            <p className="font-semibold text-gray-900 text-sm">{form.name || "-"}</p>
            <p className="text-xs text-gray-500">{form.email || "-"}</p>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: "var(--primary-muted)", color: "var(--primary-dark)" }}>
              {user?.role || "customer"}
            </span>
          </div>

          {/* Nav */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-gray-50 last:border-0 ${tab === item ? "font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                style={tab === item ? { color: "var(--primary)", background: "var(--primary-muted)" } : {}}
              >
                {item === "Profil Saya" && "👤"} {item === "Alamat" && "📍"} {item === "Keamanan" && "🔒"} {item}
              </button>
            ))}
            <Link href="/pesanan" className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 border-b border-gray-50">
              <span>📦</span> Pesanan Saya
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Keluar
            </button>
          </div>
        </div>

        {/* Konten */}
        <div className="flex-1">
          {tab === "Profil Saya" && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-5">Informasi Pribadi</h2>
              {loading ? (
                <p className="text-sm text-gray-500">Memuat data profil...</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                      style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      disabled
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">No. Telepon</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Masukkan nomor telepon"
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                      style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Lahir</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={form.date_of_birth}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                      style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties}
                    />
                  </div>

                  {message && (
                    <p className={`text-sm ${message.includes("berhasil") ? "text-green-600" : "text-red-500"}`}>
                      {message}
                    </p>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    style={{ background: "var(--primary)" }}
                  >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "Alamat" && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-semibold text-gray-900">Alamat Tersimpan</h2>
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                  + Tambah Alamat
                </button>
              </div>
              <p className="text-sm text-gray-500">Belum ada alamat tersimpan.</p>
            </div>
          )}

          {tab === "Keamanan" && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-5">Ubah Kata Sandi</h2>
              <div className="space-y-4">
                {["Kata Sandi Lama", "Kata Sandi Baru", "Konfirmasi Kata Sandi Baru"].map((f) => (
                  <div key={f}>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{f}</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2" style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties} />
                  </div>
                ))}
                <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "var(--primary)" }}>
                  Update Kata Sandi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
