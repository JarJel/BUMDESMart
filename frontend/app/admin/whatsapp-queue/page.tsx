"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

interface QueueItem {
  id: number;
  phone: string;
  message: string;
  context: string | null;
  status: "pending" | "processing" | "retrying" | "sent" | "failed";
  attempt: number;
  max_attempts: number;
  retry_delay: number;
  next_retry_at: string | null;
  sent_at: string | null;
  last_error: string | null;
  created_at: string;
  logs: LogItem[];
}

interface LogItem {
  id: number;
  attempt: number;
  status: "sent" | "failed";
  error: string | null;
  executed_at: string;
}

interface WaSettings {
  wa_max_attempts: string;
  wa_retry_delay: string;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pending:    { bg: "#EFF6FF", text: "#1D4ED8", label: "Menunggu" },
  processing: { bg: "#FEF9C3", text: "#A16207", label: "Diproses" },
  retrying:   { bg: "#FFF7ED", text: "#C2410C", label: "Mencoba Ulang" },
  sent:       { bg: "#DCFCE7", text: "#15803D", label: "Terkirim" },
  failed:     { bg: "#FEF2F2", text: "#DC2626", label: "Gagal" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE["pending"];
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

export default function WhatsappQueuePage() {
  const { showToast } = useToast();
  const [items, setItems]       = useState<QueueItem[]>([]);
  const [settings, setSettings] = useState<WaSettings>({ wa_max_attempts: "3", wa_retry_delay: "60" });
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  // Form kirim manual
  const [form, setForm]         = useState({ phone: "", message: "", context: "manual" });
  const [sending, setSending]   = useState(false);

  // Settings form
  const [settForm, setSettForm] = useState({ wa_max_attempts: "3", wa_retry_delay: "60" });
  const [savingSett, setSavingSett] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/super-admin/whatsapp-queue" + (filter ? `?status=${filter}` : ""));
      setItems(res.data.data?.data ?? []);
      if (res.data.settings) {
        setSettings(res.data.settings);
        setSettForm(res.data.settings);
      }
    } catch {
      showToast("Gagal memuat antrian.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => { load(); }, [load]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/super-admin/whatsapp-queue", form);
      showToast("Pesan masuk antrian.", "success");
      setForm({ phone: "", message: "", context: "manual" });
      load();
    } catch {
      showToast("Gagal menambahkan ke antrian.", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus item ini dari antrian?")) return;
    try {
      await api.delete(`/super-admin/whatsapp-queue/${id}`);
      showToast("Item dihapus.", "success");
      load();
    } catch {
      showToast("Gagal menghapus.", "error");
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSett(true);
    try {
      await api.put("/super-admin/whatsapp-settings", {
        wa_max_attempts: parseInt(settForm.wa_max_attempts),
        wa_retry_delay:  parseInt(settForm.wa_retry_delay),
      });
      showToast("Pengaturan disimpan.", "success");
      load();
    } catch {
      showToast("Gagal menyimpan pengaturan.", "error");
    } finally {
      setSavingSett(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Antrian WhatsApp</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola dan pantau pengiriman pesan WhatsApp otomatis</p>
      </div>

      {/* Pengaturan */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Pengaturan Antrian</h2>
        <form onSubmit={handleSaveSettings} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Maks Percobaan (1–5)</label>
            <input type="number" min={1} max={5} value={settForm.wa_max_attempts}
              onChange={e => setSettForm(p => ({ ...p, wa_max_attempts: e.target.value }))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Jeda Retry (detik)</label>
            <input type="number" min={10} max={3600} value={settForm.wa_retry_delay}
              onChange={e => setSettForm(p => ({ ...p, wa_retry_delay: e.target.value }))}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={savingSett}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {savingSett ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">Saat ini: maks {settings.wa_max_attempts}x, jeda {settings.wa_retry_delay}s</p>
      </div>

      {/* Form kirim manual */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Kirim Manual</h2>
        <form onSubmit={handleSend} className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-40">
              <label className="block text-xs text-gray-500 mb-1">Nomor HP (628xxx)</label>
              <input type="text" value={form.phone} placeholder="628123456789"
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-xs text-gray-500 mb-1">Konteks</label>
              <input type="text" value={form.context}
                onChange={e => setForm(p => ({ ...p, context: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pesan</label>
            <textarea value={form.message} rows={3}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" required />
          </div>
          <button type="submit" disabled={sending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {sending ? "Mengirim..." : "Tambah ke Antrian"}
          </button>
        </form>
      </div>

      {/* Daftar antrian */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Daftar Antrian</h2>
          <div className="flex gap-2 items-center">
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5">
              <option value="">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="processing">Diproses</option>
              <option value="retrying">Retry</option>
              <option value="sent">Terkirim</option>
              <option value="failed">Gagal</option>
            </select>
            <button onClick={load}
              className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Memuat...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">Tidak ada data.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map(item => (
              <div key={item.id} className="px-5 py-4">
                <div className="flex flex-wrap gap-2 items-start justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-gray-500 font-mono">{item.phone}</span>
                      {item.context && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.context}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 line-clamp-2">{item.message}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      <span>Percobaan: {item.attempt}/{item.max_attempts}</span>
                      <span>Dibuat: {fmtDate(item.created_at)}</span>
                      {item.sent_at && <span>Terkirim: {fmtDate(item.sent_at)}</span>}
                      {item.next_retry_at && item.status === "retrying" && (
                        <span>Retry: {fmtDate(item.next_retry_at)}</span>
                      )}
                    </div>
                    {item.last_error && (
                      <p className="text-xs text-red-500 truncate max-w-xs">{item.last_error}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                      {expanded === item.id ? "Tutup" : "Log"}
                    </button>
                    {(item.status === "pending" || item.status === "failed" || item.status === "retrying") && (
                      <button onClick={() => handleDelete(item.id)}
                        className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-600">
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                {/* Log per percobaan */}
                {expanded === item.id && (
                  <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Riwayat Percobaan</p>
                    {item.logs.length === 0 ? (
                      <p className="text-xs text-gray-400">Belum ada percobaan.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {item.logs.map(log => (
                          <div key={log.id} className="flex items-start gap-3 text-xs">
                            <span className={`inline-flex px-2 py-0.5 rounded-full font-medium ${
                              log.status === "sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>
                              #{log.attempt} {log.status === "sent" ? "Terkirim" : "Gagal"}
                            </span>
                            <span className="text-gray-500">{fmtDate(log.executed_at)}</span>
                            {log.error && <span className="text-red-500 truncate">{log.error}</span>}
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
  );
}
