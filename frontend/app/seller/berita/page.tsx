"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api/axios";
import { getFileUrl } from "@/lib/storage";

interface Berita {
  id: number;
  title: string;
  category: string;
  content: string;
  photos: string[] | null;
  target: string;
  created_at: string;
  event_date: string | null;
  allow_registration: boolean;
  max_participants: number | null;
  registration_deadline: string | null;
  is_registered: boolean;
  registration_count: number;
  registrations_open: boolean;
  is_full: boolean;
  spots_left: number | null;
  bumdes_profile?: { name: string };
}

interface Peserta {
  user_id: number;
  name: string;
  initials: string;
  photo: string | null;
  registrant_type: string;
  registered_at: string;
  is_me: boolean;
}

const CATEGORY_LABEL: Record<string, string> = {
  pengumuman: "Pengumuman",
  pelatihan: "Pelatihan",
  info_bantuan: "Info Bantuan",
  jadwal: "Jadwal",
  acara: "Acara",
  promosi: "Promosi",
  sistem: "Sistem",
  undangan: "Undangan",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function PhotoSlider({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0);
  const urls = photos.map((p) => getFileUrl(p) ?? "");
  if (!urls.length) return null;
  return (
    <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden mb-3">
      <img src={urls[idx]} alt="" className="w-full h-full object-cover" />
      {urls.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + urls.length) % urls.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % urls.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {urls.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BeritaCard({
  item,
  onOpenLeaderboard,
}: {
  item: Berita;
  onOpenLeaderboard: (item: Berita) => void;
}) {
  const [regLoading, setRegLoading] = useState(false);
  const [registered, setRegistered] = useState(item.is_registered);
  const [regCount, setRegCount] = useState(item.registration_count);
  const [open, setOpen] = useState(false);
  const isEvent = !!item.event_date || item.allow_registration;

  const handleRegister = async () => {
    setRegLoading(true);
    try {
      if (registered) {
        await api.delete(`/my/berita/${item.id}/register`);
        setRegistered(false);
        setRegCount((c) => c - 1);
      } else {
        await api.post(`/my/berita/${item.id}/register`);
        setRegistered(true);
        setRegCount((c) => c + 1);
      }
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Gagal memproses pendaftaran.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                {CATEGORY_LABEL[item.category] ?? item.category}
              </span>
              {isEvent && (
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                  Event
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-gray-900 line-clamp-2">{item.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.created_at)}</p>
          </div>
        </div>

        {item.photos && item.photos.length > 0 && <PhotoSlider photos={item.photos} />}

        <p
          className={`text-sm text-gray-600 leading-relaxed whitespace-pre-line ${!open ? "line-clamp-3" : ""}`}
        >
          {item.content}
        </p>
        {item.content.length > 150 && (
          <button onClick={() => setOpen((v) => !v)} className="text-xs text-indigo-500 mt-1 font-medium">
            {open ? "Sembunyikan" : "Selengkapnya"}
          </button>
        )}

        {isEvent && (
          <div className="mt-4 pt-4 border-t border-gray-50 space-y-3">
            {item.event_date && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  Tanggal Event: <strong>{formatDate(item.event_date)}</strong>
                </span>
              </div>
            )}

            {item.allow_registration && (
              <>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{regCount} peserta terdaftar</span>
                  {item.spots_left !== null && (
                    <span className={item.is_full ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                      {item.is_full ? "Kuota penuh" : `Sisa ${item.spots_left} tempat`}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {(item.registrations_open || registered) && (
                    <button
                      onClick={handleRegister}
                      disabled={regLoading || (item.is_full && !registered)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                        registered
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      {regLoading ? "Memproses..." : registered ? "Batalkan Pendaftaran" : "Daftar Sekarang"}
                    </button>
                  )}
                  {regCount > 0 && (
                    <button
                      onClick={() => onOpenLeaderboard(item)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Peserta
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardModal({
  berita,
  onClose,
}: {
  berita: Berita;
  onClose: () => void;
}) {
  const [list, setList] = useState<Peserta[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/my/berita/${berita.id}/peserta`)
      .then((r) => {
        setList(r.data.data ?? []);
        setMyRank(r.data.my_rank ?? null);
      })
      .finally(() => setLoading(false));
  }, [berita.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Peserta Terdaftar</h3>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{berita.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {myRank && (
          <div className="mx-5 mt-4 p-3 bg-indigo-50 rounded-xl text-sm text-indigo-700 font-semibold text-center">
            Kamu di posisi #{myRank} dari {list.length} peserta
          </div>
        )}

        <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-center text-gray-400 py-8">Memuat...</p>
          ) : list.length === 0 ? (
            <p className="text-xs text-center text-gray-400 py-8">Belum ada peserta.</p>
          ) : (
            list.map((p, i) => (
              <div
                key={p.user_id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  p.is_me ? "bg-indigo-50 border border-indigo-100" : "bg-gray-50"
                }`}
              >
                <span className={`text-xs font-bold w-6 text-center shrink-0 ${i < 3 ? "text-amber-500" : "text-gray-400"}`}>
                  {i + 1}
                </span>
                {p.photo ? (
                  <img
                    src={getFileUrl(p.photo) ?? ""}
                    alt={p.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                    {p.initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${p.is_me ? "text-indigo-700" : "text-gray-900"}`}>
                    {p.name}
                    {p.is_me && <span className="ml-1.5 text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">Kamu</span>}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Daftar {new Date(p.registered_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {i === 0 && <span className="text-lg">🥇</span>}
                {i === 1 && <span className="text-lg">🥈</span>}
                {i === 2 && <span className="text-lg">🥉</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function SellerBeritaPage() {
  const [items, setItems] = useState<Berita[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardItem, setLeaderboardItem] = useState<Berita | null>(null);

  useEffect(() => {
    api
      .get("/my/berita")
      .then((r) => setItems(r.data.data?.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Berita & Event</h1>
        <p className="text-sm text-gray-500 mt-0.5">Informasi dan event dari BUMDes kamu</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm font-medium text-gray-700">Belum ada berita atau event.</p>
          <p className="text-xs text-gray-400 mt-1">BUMDes belum mengirimkan pengumuman.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <BeritaCard key={item.id} item={item} onOpenLeaderboard={setLeaderboardItem} />
          ))}
        </div>
      )}

      {leaderboardItem && (
        <LeaderboardModal berita={leaderboardItem} onClose={() => setLeaderboardItem(null)} />
      )}
    </div>
  );
}
