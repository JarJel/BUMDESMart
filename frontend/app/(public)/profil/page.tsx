"use client";

import Link from "next/link";
import { useState } from "react";
import { dummyOrders } from "@/lib/data/orders";

function formatRupiah(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

const tabs = ["Profil", "Alamat", "Keamanan"];

export default function ProfilPage() {
  const [tab, setTab] = useState("Profil");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Akun Saya</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-56 shrink-0 space-y-3">
          {/* Avatar card */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-2" style={{ background: "var(--primary)" }}>
              A
            </div>
            <p className="font-semibold text-gray-900 text-sm">Andi Wijaya</p>
            <p className="text-xs text-gray-500">andi.wijaya@gmail.com</p>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--primary-muted)", color: "var(--primary-dark)" }}>Customer</span>
          </div>

          {/* Nav */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {[
              { label: "Profil Saya", tab: "Profil", icon: "👤" },
              { label: "Alamat", tab: "Alamat", icon: "📍" },
              { label: "Keamanan", tab: "Keamanan", icon: "🔒" },
            ].map((item) => (
              <button
                key={item.tab}
                onClick={() => setTab(item.tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-gray-50 last:border-0 ${tab === item.tab ? "font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                style={tab === item.tab ? { color: "var(--primary)", background: "var(--primary-muted)" } : {}}
              >
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
            <Link href="/pesanan" className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50">
              <span>📦</span> Pesanan Saya
            </Link>
          </div>
        </div>

        {/* Konten */}
        <div className="flex-1">
          {tab === "Profil" && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-5">Informasi Pribadi</h2>
              <div className="space-y-4">
                {[
                  { label: "Nama Lengkap", value: "Andi Wijaya", type: "text" },
                  { label: "Email", value: "andi.wijaya@gmail.com", type: "email" },
                  { label: "No. Telepon", value: "08123456789", type: "tel" },
                  { label: "Tanggal Lahir", value: "1995-08-17", type: "date" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{f.label}</label>
                    <input type={f.type} defaultValue={f.value} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2" style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties} />
                  </div>
                ))}
                <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "var(--primary)" }}>
                  Simpan Perubahan
                </button>
              </div>
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
              {[
                { label: "Rumah", alamat: "Jl. Contoh No. 10, RT 03/RW 05, Desa Lengkong, Kec. Bojongsoang, Kab. Bandung, Jawa Barat 40287", utama: true },
                { label: "Kantor", alamat: "Jl. Raya Soekarno-Hatta No. 5, Kota Bandung, Jawa Barat 40183", utama: false },
              ].map((a) => (
                <div key={a.label} className="border border-gray-100 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{a.label}</span>
                    {a.utama && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--primary-muted)", color: "var(--primary-dark)" }}>Utama</span>}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{a.alamat}</p>
                  <div className="flex gap-2">
                    <button className="text-xs font-medium hover:underline" style={{ color: "var(--primary)" }}>Edit</button>
                    {!a.utama && <button className="text-xs font-medium text-red-400 hover:underline">Hapus</button>}
                  </div>
                </div>
              ))}
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
