"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

/* ─── Types ─── */
interface WaStatus { connected: boolean; status: string; name?: string; phone?: string; error?: string; }
interface QueueItem {
  id: number; phone: string; message: string; context: string | null;
  status: "pending" | "processing" | "retrying" | "sent" | "failed";
  attempt: number; max_attempts: number; retry_delay: number;
  next_retry_at: string | null; sent_at: string | null; last_error: string | null;
  created_at: string; logs: LogItem[];
}
interface LogItem { id: number; attempt: number; status: "sent" | "failed"; error: string | null; executed_at: string; }

/* ─── Helpers ─── */
const CONN_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  CONNECTED:    { bg: "#DCFCE7", text: "#15803D", label: "Terhubung" },
  SCAN_QR_CODE: { bg: "#FEF9C3", text: "#A16207", label: "Menunggu Scan QR" },
  qr_ready:     { bg: "#FEF9C3", text: "#A16207", label: "QR Siap" },
  STARTING:     { bg: "#DBEAFE", text: "#1D4ED8", label: "Memulai..." },
  STOPPED:      { bg: "#F3F4F6", text: "#6B7280", label: "Berhenti" },
  not_found:    { bg: "#FEF2F2", text: "#DC2626", label: "Session Tidak Ada" },
  error:        { bg: "#FEF2F2", text: "#DC2626", label: "Error" },
  UNKNOWN:      { bg: "#F3F4F6", text: "#6B7280", label: "Tidak Diketahui" },
};
const Q_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pending:    { bg: "#EFF6FF", text: "#1D4ED8", label: "Menunggu" },
  processing: { bg: "#FEF9C3", text: "#A16207", label: "Diproses" },
  retrying:   { bg: "#FFF7ED", text: "#C2410C", label: "Retry" },
  sent:       { bg: "#DCFCE7", text: "#15803D", label: "Terkirim" },
  failed:     { bg: "#FEF2F2", text: "#DC2626", label: "Gagal" },
};
function Badge({ map, val }: { map: Record<string, { bg: string; text: string; label: string }>; val: string }) {
  const s = map[val] ?? map["UNKNOWN"] ?? { bg: "#F3F4F6", text: "#6B7280", label: val };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.text }} />
      {s.label}
    </span>
  );
}
function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

/* ─── Main ─── */
export default function WhatsappAdminPage() {
  const toast = useToast();
  const [tab, setTab] = useState<"koneksi" | "antrian" | "pengaturan">("koneksi");

  /* koneksi */
  const [status, setStatus]           = useState<WaStatus | null>(null);
  const [loadingStatus, setLS]        = useState(true);
  const [qrData, setQrData]           = useState<string | null>(null);
  const [loadingQr, setLoadingQr]     = useState(false);
  const [acting, setActing]           = useState<string | null>(null);
  const [testPhone, setTestPhone]     = useState("");
  const [testMsg, setTestMsg]         = useState("Halo! Ini pesan test dari sistem BumDesMartNukita.");
  const [sendingTest, setSendingTest] = useState(false);

  /* antrian */
  const [items, setItems]       = useState<QueueItem[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [filterQ, setFilterQ]   = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [manualForm, setMF]     = useState({ phone: "", message: "", context: "manual" });
  const [sendingM, setSendingM] = useState(false);

  /* pengaturan */
  const [sett, setSett]     = useState({ wa_max_attempts: "3", wa_retry_delay: "60" });
  const [savingSett, setSS] = useState(false);

  /* ── fetch status ── */
  const fetchStatus = useCallback(async () => {
    setLS(true);
    try {
      const res = await api.get("/admin/whatsapp/status");
      setStatus(res.data);
    } catch {
      setStatus({ connected: false, status: "error", error: "OpenWA tidak dapat dijangkau." });
    } finally { setLS(false); }
  }, []);

  /* ── fetch antrian ── */
  const fetchQueue = useCallback(async () => {
    setLoadingQ(true);
    try {
      const res = await api.get("/super-admin/whatsapp-queue" + (filterQ ? `?status=${filterQ}` : ""));
      setItems(res.data.data?.data ?? []);
      if (res.data.settings) setSett(res.data.settings);
    } catch { toast.error("Gagal memuat antrian."); }
    finally { setLoadingQ(false); }
  }, [filterQ]);

  useEffect(() => { fetchStatus(); const t = setInterval(fetchStatus, 15_000); return () => clearInterval(t); }, [fetchStatus]);
  useEffect(() => { if (tab === "antrian" || tab === "pengaturan") fetchQueue(); }, [tab, fetchQueue]);

  /* ── aksi koneksi ── */
  const handleQr = async () => {
    setLoadingQr(true); setQrData(null);
    try {
      const res = await api.get("/admin/whatsapp/qr");
      setQrData(res.data.qr ?? null);
      if (!res.data.qr) toast.error("QR tidak tersedia. Cek apakah session sudah terhubung.");
    } catch { toast.error("Gagal mengambil QR code."); }
    finally { setLoadingQr(false); }
  };
  const handleAction = async (action: "disconnect" | "restart") => {
    setActing(action);
    try {
      await api.post(`/admin/whatsapp/${action}`);
      toast.success(action === "restart" ? "Session direstart." : "Session diputus.");
      setQrData(null); setTimeout(fetchStatus, 2000);
    } catch { toast.error("Aksi gagal."); }
    finally { setActing(null); }
  };
  const handleTest = async () => {
    if (!testPhone.trim()) { toast.error("Masukkan nomor HP."); return; }
    setSendingTest(true);
    try { await api.post("/admin/whatsapp/send-test", { phone: testPhone, message: testMsg }); toast.success("Pesan test terkirim!"); }
    catch (e: any) { toast.error(e?.response?.data?.message ?? "Gagal mengirim."); }
    finally { setSendingTest(false); }
  };

  /* ── aksi antrian ── */
  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault(); setSendingM(true);
    try {
      await api.post("/super-admin/whatsapp-queue", manualForm);
      toast.success("Pesan masuk antrian.");
      setMF({ phone: "", message: "", context: "manual" });
      fetchQueue();
    } catch { toast.error("Gagal menambahkan ke antrian."); }
    finally { setSendingM(false); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Hapus item ini?")) return;
    try { await api.delete(`/super-admin/whatsapp-queue/${id}`); toast.success("Dihapus."); fetchQueue(); }
    catch { toast.error("Gagal menghapus."); }
  };

  /* ── simpan pengaturan ── */
  const handleSaveSett = async (e: React.FormEvent) => {
    e.preventDefault(); setSS(true);
    try {
      await api.put("/super-admin/whatsapp-settings", {
        wa_max_attempts: parseInt(sett.wa_max_attempts),
        wa_retry_delay: parseInt(sett.wa_retry_delay),
      });
      toast.success("Pengaturan disimpan.");
    } catch { toast.error("Gagal menyimpan."); }
    finally { setSS(false); }
  };

  /* ── Tab button ── */
  const Tabs = () => (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
      {(["koneksi", "antrian", "pengaturan"] as const).map(t => (
        <button key={t} onClick={() => setTab(t)}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors capitalize ${
            tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          {t === "koneksi" ? "Koneksi" : t === "antrian" ? "Antrian & Log" : "Pengaturan"}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">WhatsApp Gateway</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitor, kelola antrian, dan pengaturan WhatsApp</p>
      </div>

      <Tabs />

      {/* ══ TAB: KONEKSI ══ */}
      {tab === "koneksi" && (
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Status Koneksi</p>
              <button onClick={fetchStatus} disabled={loadingStatus}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-40">
                {loadingStatus ? "Memuat..." : "Refresh"}
              </button>
            </div>
            {loadingStatus && !status ? (
              <div className="h-16 animate-pulse bg-gray-50 rounded-xl" />
            ) : status && (
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${status.connected ? "bg-green-50" : "bg-gray-50"}`}>
                  {status.connected ? "📱" : "❌"}
                </div>
                <div className="flex-1 min-w-0">
                  <Badge map={CONN_BADGE} val={status.status} />
                  {status.connected && (
                    <div className="mt-1.5 space-y-0.5">
                      {status.name  && <p className="text-sm font-medium text-gray-900">{status.name}</p>}
                      {status.phone && <p className="text-xs text-gray-500">+{status.phone}</p>}
                    </div>
                  )}
                  {status.error && <p className="text-xs text-red-500 mt-1">{status.error}</p>}
                  {!status.connected && status.status !== "error" && (
                    <p className="text-xs text-gray-400 mt-1">Klik "Ambil QR" untuk menghubungkan nomor WA.</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
              {!status?.connected ? (
                <button onClick={handleQr} disabled={loadingQr}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5V16M4 4h4v4H4V4zm0 12h4v4H4v-4zm12-12h4v4h-4V4z" />
                  </svg>
                  {loadingQr ? "Mengambil QR..." : "Ambil QR Code"}
                </button>
              ) : (
                <>
                  <button onClick={() => handleAction("restart")} disabled={acting !== null}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {acting === "restart" ? "Merestart..." : "Restart"}
                  </button>
                  <button onClick={() => handleAction("disconnect")} disabled={acting !== null}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    {acting === "disconnect" ? "Memutus..." : "Putus"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* QR */}
          {qrData && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-semibold text-gray-700 mb-1">Scan QR Code</p>
              <p className="text-xs text-gray-400 mb-4">WhatsApp → Perangkat Tertaut → Tautkan Perangkat → Scan QR ini.</p>
              <div className="flex justify-center">
                {qrData.startsWith("data:image") ? (
                  <img src={qrData} alt="QR Code" className="w-56 h-56 rounded-xl border border-gray-100" />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-500 break-all max-w-xs">{qrData}</div>
                )}
              </div>
              <p className="text-[11px] text-center text-gray-400 mt-3">QR expired ~60 detik. Klik "Ambil QR Code" lagi jika kadaluarsa.</p>
            </div>
          )}

          {/* Test kirim */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">Tes Kirim Pesan</p>
              <p className="text-xs text-gray-400 mt-0.5">Kirim pesan percobaan untuk memastikan koneksi berjalan.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nomor HP Tujuan</label>
              <input type="tel" value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pesan</label>
              <textarea value={testMsg} onChange={e => setTestMsg(e.target.value)} rows={3} maxLength={500}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50 resize-none" />
              <p className="text-[10px] text-gray-400 mt-1 text-right">{testMsg.length}/500</p>
            </div>
            <button onClick={handleTest} disabled={sendingTest || !status?.connected}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {sendingTest ? "Mengirim..." : !status?.connected ? "WA Belum Terhubung" : "Kirim Pesan Test"}
            </button>
          </div>
        </div>
      )}

      {/* ══ TAB: ANTRIAN & LOG ══ */}
      {tab === "antrian" && (
        <div className="space-y-4">
          {/* Form kirim manual */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Kirim Manual ke Antrian</p>
            <form onSubmit={handleManual} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Nomor HP (628xxx)</label>
                  <input type="text" value={manualForm.phone} placeholder="628123456789"
                    onChange={e => setMF(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-indigo-400" required />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-gray-500 mb-1">Konteks</label>
                  <input type="text" value={manualForm.context}
                    onChange={e => setMF(p => ({ ...p, context: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Isi Pesan</label>
                <textarea value={manualForm.message} rows={3}
                  onChange={e => setMF(p => ({ ...p, message: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-indigo-400 resize-none" required />
              </div>
              <button type="submit" disabled={sendingM}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors">
                {sendingM ? "Menambahkan..." : "Tambah ke Antrian"}
              </button>
            </form>
          </div>

          {/* Daftar antrian */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-semibold text-gray-700">Log Antrian</p>
              <div className="flex gap-2">
                <select value={filterQ} onChange={e => setFilterQ(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50">
                  <option value="">Semua</option>
                  <option value="pending">Menunggu</option>
                  <option value="retrying">Retry</option>
                  <option value="sent">Terkirim</option>
                  <option value="failed">Gagal</option>
                </select>
                <button onClick={fetchQueue}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                  Refresh
                </button>
              </div>
            </div>

            {loadingQ ? (
              <div className="p-8 text-center text-sm text-gray-400">Memuat...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">Belum ada antrian.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {items.map(item => (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1.5 flex-1">
                        {/* baris atas: status + nomor + konteks */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge map={Q_BADGE} val={item.status} />
                          <span className="text-xs font-mono text-gray-600">{item.phone}</span>
                          {item.context && (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{item.context}</span>
                          )}
                        </div>
                        {/* isi pesan */}
                        <p className="text-sm text-gray-800 leading-snug line-clamp-2">{item.message}</p>
                        {/* meta */}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          <span>Percobaan {item.attempt}/{item.max_attempts}</span>
                          <span>{fmt(item.created_at)}</span>
                          {item.sent_at && <span className="text-green-600">✓ {fmt(item.sent_at)}</span>}
                          {item.status === "retrying" && item.next_retry_at && (
                            <span className="text-orange-500">Retry: {fmt(item.next_retry_at)}</span>
                          )}
                        </div>
                        {item.last_error && (
                          <p className="text-xs text-red-400 truncate">{item.last_error}</p>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                          className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                          {expanded === item.id ? "Tutup" : "Log"}
                        </button>
                        {["pending","retrying","failed"].includes(item.status) && (
                          <button onClick={() => handleDelete(item.id)}
                            className="text-xs px-2.5 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 text-red-500">
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Log detail */}
                    {expanded === item.id && (
                      <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Riwayat Percobaan</p>
                        {item.logs.length === 0 ? (
                          <p className="text-xs text-gray-400">Belum ada percobaan.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {item.logs.map(log => (
                              <div key={log.id} className="flex items-center gap-2.5 text-xs">
                                <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                  log.status === "sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                                }`}>
                                  #{log.attempt} {log.status === "sent" ? "Terkirim" : "Gagal"}
                                </span>
                                <span className="text-gray-400">{fmt(log.executed_at)}</span>
                                {log.error && <span className="text-red-400 truncate flex-1">{log.error}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: PENGATURAN ══ */}
      {tab === "pengaturan" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-1">Pengaturan Antrian WhatsApp</p>
            <p className="text-xs text-gray-400 mb-5">Berlaku untuk semua pesan yang masuk antrian baru.</p>
            <form onSubmit={handleSaveSett} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maksimal Percobaan <span className="text-gray-400 font-normal">(1–5)</span>
                </label>
                <input type="number" min={1} max={5} value={sett.wa_max_attempts}
                  onChange={e => setSett(p => ({ ...p, wa_max_attempts: e.target.value }))}
                  className="w-32 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-indigo-400" />
                <p className="text-xs text-gray-400 mt-1">Berapa kali sistem akan mencoba ulang jika gagal.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jeda Antar Retry <span className="text-gray-400 font-normal">(detik)</span>
                </label>
                <input type="number" min={10} max={3600} value={sett.wa_retry_delay}
                  onChange={e => setSett(p => ({ ...p, wa_retry_delay: e.target.value }))}
                  className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-indigo-400" />
                <p className="text-xs text-gray-400 mt-1">Misal: 60 = tunggu 60 detik sebelum mencoba ulang.</p>
              </div>
              <button type="submit" disabled={savingSett}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {savingSett ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </form>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Panduan Aman Penggunaan</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
              <li>Gunakan nomor WA <strong>khusus sistem</strong>, bukan nomor pribadi</li>
              <li>Antrian diproses setiap 1 menit oleh cron job</li>
              <li>Hanya kirim pesan transaksional — bukan promosi massal</li>
              <li>Pastikan HP nomor WA selalu <strong>nyala dan terkoneksi internet</strong></li>
              <li>Jika session terputus, buka tab Koneksi dan scan QR ulang</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
