"use client";

import { useState } from "react";
import Link from "next/link";

const conversations = [
  { id: 1, toko: "Keripik Mang Asep", tokoSlug: "keripik-mang-asep", lastMsg: "Terima kasih kak, pesanan sudah dikirim ya!", waktu: "10:32", unread: 0 },
  { id: 2, toko: "MomeeRa Bakery", tokoSlug: "momeera-bakery", lastMsg: "Apakah bisa custom ukuran browniesnya?", waktu: "Kemarin", unread: 2 },
  { id: 3, toko: "Manisan & Catering Bu Lilis", tokoSlug: "manisan-bu-lilis", lastMsg: "Stok manisan cangkaleng masih ada kak 👍", waktu: "Senin", unread: 0 },
];

const dummyMessages: Record<number, { from: "me" | "seller"; text: string; waktu: string }[]> = {
  1: [
    { from: "seller", text: "Halo kak! Ada yang bisa saya bantu? 😊", waktu: "10:20" },
    { from: "me", text: "Halo, mau tanya stok keripik singkong masih ada?", waktu: "10:25" },
    { from: "seller", text: "Masih ada kak, stok 150 pcs. Mau pesan berapa?", waktu: "10:28" },
    { from: "me", text: "Pesan 5 ya, bisa dikirim ke Bandung?", waktu: "10:30" },
    { from: "seller", text: "Terima kasih kak, pesanan sudah dikirim ya!", waktu: "10:32" },
  ],
  2: [
    { from: "me", text: "Selamat pagi, apakah bisa custom ukuran browniesnya?", waktu: "Kemarin 09:15" },
    { from: "seller", text: "Halo kak! Bisa banget, mau ukuran berapa?", waktu: "Kemarin 09:45" },
    { from: "seller", text: "Apakah bisa custom ukuran browniesnya?", waktu: "Kemarin 09:46" },
  ],
  3: [
    { from: "me", text: "Halo, stok manisan cangkaleng masih ada nggak?", waktu: "Senin 14:00" },
    { from: "seller", text: "Stok manisan cangkaleng masih ada kak 👍", waktu: "Senin 14:05" },
  ],
};

export default function ChatPage() {
  const [active, setActive] = useState<number | null>(1);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(dummyMessages);

  const send = () => {
    if (!input.trim() || !active) return;
    setMessages((prev) => ({
      ...prev,
      [active]: [...(prev[active] || []), { from: "me", text: input.trim(), waktu: "Baru saja" }],
    }));
    setInput("");
  };

  const activeConv = conversations.find((c) => c.id === active);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Pesan</h1>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
        {/* Sidebar percakapan */}
        <div className="w-64 shrink-0 border-r border-gray-100 flex flex-col">
          <div className="p-3 border-b border-gray-50">
            <input type="text" placeholder="Cari percakapan..." className="w-full px-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-100 focus:outline-none" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 transition-colors ${active === c.id ? "font-medium" : "hover:bg-gray-50"}`}
                style={active === c.id ? { background: "var(--primary-muted)" } : {}}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm" style={{ background: "var(--primary)" }}>
                  {c.toko.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.toko}</p>
                    <span className="text-xs text-gray-400 shrink-0">{c.waktu}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.lastMsg}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center shrink-0" style={{ background: "var(--primary)" }}>
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Area chat */}
        {active && activeConv ? (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--primary)" }}>
                {activeConv.toko.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{activeConv.toko}</p>
                <Link href={`/${activeConv.tokoSlug}`} className="text-xs hover:underline" style={{ color: "var(--primary)" }}>Lihat toko →</Link>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(messages[active] || []).map((m, i) => (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.from === "me" ? "text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}
                    style={m.from === "me" ? { background: "var(--primary)" } : {}}
                  >
                    {m.text}
                    <p className={`text-xs mt-1 ${m.from === "me" ? "text-green-200" : "text-gray-400"}`}>{m.waktu}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Tulis pesan..."
                className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties}
              />
              <button onClick={send} className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all" style={{ background: "var(--primary)" }}>
                Kirim
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Pilih percakapan
          </div>
        )}
      </div>
    </div>
  );
}
