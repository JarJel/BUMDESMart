"use client";
import { useState } from "react";

const reviews = [
  { id: 1, pelanggan: "Rina Kartika", rating: 5, produk: "Keripik Singkong Original", isi: "Produknya enak banget! Renyah dan gurih, cocok buat camilan keluarga. Pengiriman cepat juga.", tanggal: "17 Jun 2026", foto: true, dibalas: false },
  { id: 2, pelanggan: "Budi Santoso", rating: 4, produk: "Keripik Pisang Cokelat", isi: "Rasanya enak, tapi packagingnya agak kurang rapi. Semoga bisa diperbaiki lagi.", tanggal: "16 Jun 2026", foto: false, dibalas: true, balasan: "Terima kasih atas masukannya, Pak Budi! Kami akan terus perbaiki packaging kami. Semoga berkenan berbelanja lagi!" },
  { id: 3, pelanggan: "Sari Dewi", rating: 5, produk: "Keripik Singkong Pedas", isi: "Level pedasnya pas banget, nggak terlalu pedas tapi tetap berasa. Recommended!", tanggal: "15 Jun 2026", foto: true, dibalas: false },
  { id: 4, pelanggan: "Ahmad Yusuf", rating: 3, produk: "Keripik Singkong Original", isi: "Lumayan enak, tapi harganya agak mahal dibanding di warung. Stoknya juga sering kosong.", tanggal: "14 Jun 2026", foto: false, dibalas: false },
];

const tabs = ["Semua", "Belum Dibalas", "3-4 Bintang", "Dengan Foto"];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function UlasanPage() {
  const [activeTab, setActiveTab] = useState("Semua");
  const [replyOpen, setReplyOpen] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const avgRating = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);

  const filtered = reviews.filter((r) => {
    if (activeTab === "Belum Dibalas") return !r.dibalas;
    if (activeTab === "3-4 Bintang") return r.rating >= 3 && r.rating <= 4;
    if (activeTab === "Dengan Foto") return r.foto;
    return true;
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ulasan Pelanggan</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola dan balas ulasan dari pelanggan</p>
      </div>

      {/* Rating Overview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col md:flex-row gap-6">
        <div className="text-center md:w-36 shrink-0">
          <p className="text-5xl font-bold text-gray-900">{avgRating}</p>
          <StarRow rating={Math.round(parseFloat(avgRating))} />
          <p className="text-xs text-gray-400 mt-1">{reviews.length} ulasan</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5,4,3,2,1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length;
            const pct = (count / reviews.length) * 100;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-8 shrink-0">{star} ★</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full"><div className="h-full rounded-full bg-yellow-400" style={{ width: `${pct}%` }} /></div>
                <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "var(--primary)" }}>
                  {r.pelanggan[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{r.pelanggan}</p>
                  <p className="text-xs text-gray-400">{r.produk} · {r.tanggal}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StarRow rating={r.rating} />
                {r.foto && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">Foto</span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-3 leading-relaxed">{r.isi}</p>

            {/* Balasan */}
            {r.dibalas && r.balasan && (
              <div className="mt-4 pl-4 border-l-2 border-green-200">
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>Balasan Anda</p>
                <p className="text-xs text-gray-600 leading-relaxed">{r.balasan}</p>
              </div>
            )}

            {!r.dibalas && (
              <div className="mt-3">
                {replyOpen === r.id ? (
                  <div className="space-y-2">
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} placeholder="Tulis balasan Anda..." className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-green-400 resize-none" />
                    <div className="flex gap-2">
                      <button className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: "var(--primary)" }}>Kirim Balasan</button>
                      <button onClick={() => setReplyOpen(null)} className="px-4 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">Batal</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReplyOpen(r.id)} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--primary)" }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    Balas Ulasan
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}