"use client";
import { useState } from "react";
import { DOKUMEN_META } from "@/lib/data/dummy";
import type { DokumenType } from "@/lib/data/dummy";

const days = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"];

const ALL_DOC_TYPES = Object.entries(DOKUMEN_META) as [DokumenType, typeof DOKUMEN_META[DokumenType]][];

type DocForm = { aktif: boolean; nomor: string; tanggalTerbit: string; berlakuHingga: string; cakupan: string; fileNama: string };
const defaultDocForm = (): DocForm => ({ aktif: false, nomor: "", tanggalTerbit: "", berlakuHingga: "", cakupan: "", fileNama: "" });

export default function PengaturanPage() {
  const [jamBuka, setJamBuka] = useState<Record<string, { buka: boolean; dari: string; sampai: string }>>(
    Object.fromEntries(days.map((d) => [d, { buka: d !== "Minggu", dari: "08:00", sampai: "17:00" }]))
  );
  const [kurir, setKurir] = useState({ lokal: true, jne: false, jnt: false, sicepat: false });
  const [twofa, setTwofa] = useState(false);

  const [dokumen, setDokumen] = useState<Record<DokumenType, DocForm>>(
    Object.fromEntries(ALL_DOC_TYPES.map(([k]) => [k, defaultDocForm()])) as Record<DokumenType, DocForm>
  );
  const [openDoc, setOpenDoc] = useState<DokumenType | null>(null);

  const updateDoc = (type: DokumenType, field: keyof DocForm, val: string | boolean) => {
    setDokumen((prev) => ({ ...prev, [type]: { ...prev[type], [field]: val } }));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pengaturan Toko</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola profil dan preferensi toko Anda</p>
      </div>

      {/* Profil Toko */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-3">Profil Toko</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "var(--primary-muted)" }}>
            <svg className="w-10 h-10" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <button className="text-xs font-medium px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Ubah Logo</button>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG maks. 2MB</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Nama Toko", val: "Keripik Mang Asep", type: "text" },
            { label: "Tagline", val: "Renyah, Gurih, Khas Sunda", type: "text" },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">{f.label}</label>
              <input defaultValue={f.val} type={f.type} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Deskripsi Toko</label>
            <textarea defaultValue="Keripik singkong dan pisang homemade dengan bumbu rempah khas Sunda. Sudah berjualan sejak 2018." rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Kecamatan</label>
            <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-green-400">
              <option>Bojongsoang</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Desa/Kelurahan</label>
            <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-green-400">
              <option>Desa Lengkong</option>
            </select>
          </div>
        </div>
        <button className="px-5 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90" style={{ background: "var(--primary)" }}>Simpan Profil</button>
      </div>

      {/* Jam Operasional */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-3">Jam Operasional</h2>
        {days.map((d) => (
          <div key={d} className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-24 shrink-0">
              <button onClick={() => setJamBuka((prev) => ({ ...prev, [d]: { ...prev[d], buka: !prev[d].buka } }))} className={`relative w-8 h-4 rounded-full transition-colors ${jamBuka[d].buka ? "" : "bg-gray-200"}`} style={jamBuka[d].buka ? { background: "var(--primary)" } : {}}>
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${jamBuka[d].buka ? "left-4" : "left-0.5"}`} />
              </button>
              <span className="text-xs text-gray-700 font-medium">{d}</span>
            </div>
            {jamBuka[d].buka ? (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <input type="time" value={jamBuka[d].dari} onChange={(e) => setJamBuka((prev) => ({ ...prev, [d]: { ...prev[d], dari: e.target.value } }))} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-green-400" />
                <span>s/d</span>
                <input type="time" value={jamBuka[d].sampai} onChange={(e) => setJamBuka((prev) => ({ ...prev, [d]: { ...prev[d], sampai: e.target.value } }))} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-green-400" />
              </div>
            ) : (
              <span className="text-xs text-gray-400">Tutup</span>
            )}
          </div>
        ))}
        <button className="px-5 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 mt-2" style={{ background: "var(--primary)" }}>Simpan Jam</button>
      </div>

      {/* Pengiriman */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-3">Pengaturan Pengiriman</h2>
        <div className="space-y-3">
          {([["lokal","Kurir Desa Lokal (BumdesMart)"],["jne","JNE"],["jnt","J&T Express"],["sicepat","SiCepat"]] as [keyof typeof kurir, string][]).map(([k, label]) => (
            <label key={k} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 cursor-pointer">
              <span className="text-sm text-gray-700">{label}</span>
              <button onClick={() => setKurir((prev) => ({ ...prev, [k]: !prev[k] }))} className={`relative w-10 h-5 rounded-full transition-colors ${kurir[k] ? "" : "bg-gray-200"}`} style={kurir[k] ? { background: "var(--primary)" } : {}}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${kurir[k] ? "left-5" : "left-0.5"}`} />
              </button>
            </label>
          ))}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1.5 block">Alamat Pickup</label>
          <input defaultValue="RT 03/RW 05, Desa Lengkong, Kec. Bojongsoang, Kab. Bandung" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
        </div>
        <button className="px-5 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90" style={{ background: "var(--primary)" }}>Simpan Pengiriman</button>
      </div>

      {/* Keamanan */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-3">Keamanan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Kata Sandi Lama", type: "password" },
            { label: "Kata Sandi Baru", type: "password" },
            { label: "Konfirmasi Kata Sandi", type: "password" },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">{f.label}</label>
              <input type={f.type} placeholder="••••••••" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between py-3 border-t border-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-900">Autentikasi 2 Faktor (2FA)</p>
            <p className="text-xs text-gray-400 mt-0.5">Tambahkan lapisan keamanan ekstra ke akun Anda</p>
          </div>
          <button onClick={() => setTwofa(!twofa)} className={`relative w-11 h-6 rounded-full transition-colors ${twofa ? "" : "bg-gray-200"}`} style={twofa ? { background: "var(--primary)" } : {}}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${twofa ? "left-6" : "left-1"}`} />
          </button>
        </div>
        <button className="px-5 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90" style={{ background: "var(--primary)" }}>Simpan Keamanan</button>
      </div>

      {/* Dokumen Legalitas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="border-b border-gray-50 pb-3">
          <h2 className="text-sm font-semibold text-gray-900">Dokumen Legalitas</h2>
          <p className="text-xs text-gray-400 mt-0.5">Aktifkan dokumen yang sudah dimiliki toko Anda. Calon pembeli dapat melihat ini di halaman toko.</p>
        </div>

        <div className="space-y-3">
          {ALL_DOC_TYPES.map(([type, meta]) => {
            const doc = dokumen[type];
            const isOpen = openDoc === type;
            return (
              <div key={type} className={`rounded-xl border transition-colors ${doc.aktif ? "border-green-200 bg-green-50/30" : "border-gray-100"}`}>
                {/* Header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Toggle aktif */}
                  <button
                    onClick={() => updateDoc(type, "aktif", !doc.aktif)}
                    className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${doc.aktif ? "" : "bg-gray-200"}`}
                    style={doc.aktif ? { background: "var(--primary)" } : {}}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${doc.aktif ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${doc.aktif ? "text-gray-900" : "text-gray-500"}`}>{meta.nama}</p>
                    <p className="text-xs text-gray-400">{meta.penerbit} · {meta.kategori}</p>
                  </div>
                  {doc.aktif && (
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.fileNama && (
                        <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-lg">{doc.fileNama}</span>
                      )}
                      <button
                        onClick={() => setOpenDoc(isOpen ? null : type)}
                        className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white"
                      >
                        {isOpen ? "Tutup" : "Isi Detail"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Form detail — hanya muncul saat aktif dan open */}
                {doc.aktif && isOpen && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Nomor Dokumen</label>
                        <input
                          value={doc.nomor}
                          onChange={(e) => updateDoc(type, "nomor", e.target.value)}
                          placeholder="cth. 9120706290001"
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Cakupan (opsional)</label>
                        <input
                          value={doc.cakupan}
                          onChange={(e) => updateDoc(type, "cakupan", e.target.value)}
                          placeholder="cth. Keripik singkong original"
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Tanggal Terbit</label>
                        <input
                          type="date"
                          value={doc.tanggalTerbit}
                          onChange={(e) => updateDoc(type, "tanggalTerbit", e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Berlaku Hingga (kosongkan jika permanen)</label>
                        <input
                          type="date"
                          value={doc.berlakuHingga}
                          onChange={(e) => updateDoc(type, "berlakuHingga", e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Upload Scan Dokumen</label>
                      <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors">
                        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          {doc.fileNama ? (
                            <p className="text-sm text-green-700 font-medium truncate">{doc.fileNama}</p>
                          ) : (
                            <p className="text-sm text-gray-500">Klik untuk pilih file · PDF atau JPG, maks. 5MB</p>
                          )}
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) updateDoc(type, "fileNama", f.name);
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setOpenDoc(null)}
                        className="px-4 py-2 text-xs font-semibold text-white rounded-xl"
                        style={{ background: "var(--primary)" }}
                      >
                        Simpan Dokumen Ini
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-gray-50">
          <p className="text-xs text-gray-400">Dokumen yang diaktifkan akan tampil sebagai "Legalitas Terverifikasi" di halaman profil toko Anda.</p>
        </div>
      </div>
    </div>
  );
}