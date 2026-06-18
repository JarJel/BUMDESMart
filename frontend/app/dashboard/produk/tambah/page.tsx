"use client";
import { useState } from "react";
import Link from "next/link";

const kategoriList = ["Makanan & Minuman","Kerajinan Tangan","Pertanian","Konveksi & Fashion","Jasa"];
const kurirList = [
  { key: "lokal", label: "Kurir Desa Lokal (BumdesMart)" },
  { key: "jne", label: "JNE" },
  { key: "jnt", label: "J&T Express" },
  { key: "sicepat", label: "SiCepat" },
];

export default function TambahProdukPage() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [hasVariant, setHasVariant] = useState(false);
  const [kurir, setKurir] = useState({ lokal: true, jne: false, jnt: false, sicepat: false });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/produk" className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tambah Produk Baru</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lengkapi informasi produk Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — main form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Informasi Produk */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Informasi Produk</h2>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Nama Produk <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Contoh: Keripik Singkong Original 200gr" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Kategori <span className="text-red-500">*</span></label>
              <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-green-400">
                <option value="">Pilih Kategori</option>
                {kategoriList.map((k) => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Deskripsi Produk</label>
              <textarea rows={4} placeholder="Deskripsikan produk Anda secara lengkap..." className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 resize-none" />
            </div>
          </div>

          {/* Foto Produk */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Foto Produk</h2>
              <span className="text-xs text-gray-400">Maks. 5 foto</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {[0,1,2,3,4].map((i) => (
                <div key={i} className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-green-300 hover:bg-green-50/50 transition-colors">
                  {i === 0 ? (
                    <>
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      <span className="text-xs text-gray-300 mt-1">Utama</span>
                    </>
                  ) : (
                    <svg className="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">Format: JPG, PNG, WEBP. Ukuran: maks. 2MB per foto. Foto pertama akan menjadi foto utama.</p>
          </div>

          {/* Harga & Stok */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Harga & Stok</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Harga Jual <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">Rp</span>
                  <input type="number" placeholder="0" className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-green-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Stok <span className="text-red-500">*</span></label>
                <input type="number" placeholder="0" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">Harga Coret (Opsional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">Rp</span>
                  <input type="number" placeholder="0" className="w-full text-sm border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-green-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">SKU (Opsional)</label>
                <input type="text" placeholder="Contoh: KSO-001" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400" />
              </div>
            </div>
          </div>

          {/* Pengiriman */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Pengiriman</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Berat (gram)", placeholder: "200" },
                { label: "Panjang (cm)", placeholder: "15" },
                { label: "Lebar (cm)", placeholder: "10" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">{f.label}</label>
                  <input type="number" placeholder={f.placeholder} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400" />
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Layanan Kurir</p>
              <div className="space-y-2">
                {kurirList.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer py-1">
                    <input type="checkbox" checked={kurir[key as keyof typeof kurir]} onChange={() => setKurir((p) => ({ ...p, [key]: !p[key as keyof typeof kurir] }))} className="rounded text-green-600" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Varian */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Varian Produk</h2>
              <button onClick={() => setHasVariant(!hasVariant)} className={`relative w-10 h-5 rounded-full transition-colors ${hasVariant ? "" : "bg-gray-200"}`} style={hasVariant ? { background: "var(--primary)" } : {}}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${hasVariant ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
            {hasVariant && (
              <div>
                <p className="text-xs text-gray-500 mb-3">Aktifkan jika produk memiliki varian (ukuran, rasa, warna, dll)</p>
                <button className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--primary)" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Tambah Varian
                </button>
              </div>
            )}
            {!hasVariant && <p className="text-xs text-gray-400">Aktifkan toggle untuk menambah varian produk</p>}
          </div>
        </div>

        {/* Right - Sidebar */}
        <div className="space-y-5">
          {/* Status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Status Produk</h2>
            <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-green-400">
              <option>Aktif</option>
              <option>Draft</option>
              <option>Arsip</option>
            </select>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
            <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center">
              <div className="w-full h-24 rounded-lg flex items-center justify-center mb-3" style={{ background: "var(--primary-muted)" }}>
                <svg className="w-10 h-10" style={{ color: "var(--primary-light)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-xs text-gray-400">Nama produk akan tampil di sini</p>
              <p className="text-sm font-bold text-gray-900 mt-1">Rp 0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90" style={{ background: "var(--primary)" }}>Simpan & Publikasikan</button>
        <button className="px-6 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Simpan sebagai Draft</button>
        <Link href="/dashboard/produk" className="px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-600 ml-auto">Batal</Link>
      </div>
    </div>
  );
}