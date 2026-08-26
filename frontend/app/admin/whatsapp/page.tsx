"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

interface WaStatus {
  connected: boolean;
  status: string;
  name?: string;
  phone?: string;
  error?: string;
}

function StatusBadge({ connected, status }: { connected: boolean; status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    CONNECTED:    { bg: "#DCFCE7", text: "#15803D", label: "Terhubung" },
    SCAN_QR_CODE: { bg: "#FEF9C3", text: "#A16207", label: "Menunggu Scan QR" },
    STARTING:     { bg: "#DBEAFE", text: "#1D4ED8", label: "Memulai..." },
    STOPPED:      { bg: "#F3F4F6", text: "#6B7280", label: "Berhenti" },
    not_found:    { bg: "#FEF2F2", text: "#DC2626", label: "Session Tidak Ada" },
    error:        { bg: "#FEF2F2", text: "#DC2626", label: "Error" },
    UNKNOWN:      { bg: "#F3F4F6", text: "#6B7280", label: "Tidak Diketahui" },
  };
  const s = map[status] ?? map["UNKNOWN"];
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.text }} />
      {s.label}
    </span>
  );
}

export default function WhatsappAdminPage() {
  const toast = useToast();
  const [status, setStatus]       = useState<WaStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [qrData, setQrData]       = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [acting, setActing]       = useState<string | null>(null);

  // Test kirim
  const [testPhone, setTestPhone]     = useState("");
  const [testMessage, setTestMessage] = useState("Halo! Ini pesan test dari sistem BUMDESMARTNUKITA.");
  const [sendingTest, setSendingTest] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await api.get("/admin/whatsapp/status");
      setStatus(res.data);
    } catch {
      setStatus({ connected: false, status: "error", error: "OpenWA tidak dapat dijangkau." });
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleGetQr = async () => {
    setLoadingQr(true);
    setQrData(null);
    try {
      const res = await api.get("/admin/whatsapp/qr");
      setQrData(res.data.qr ?? null);
      if (!res.data.qr) toast.error("QR tidak tersedia. Cek apakah session sudah terhubung.");
    } catch {
      toast.error("Gagal mengambil QR code.");
    } finally {
      setLoadingQr(false);
    }
  };

  const handleAction = async (action: "disconnect" | "restart") => {
    setActing(action);
    try {
      await api.post(`/admin/whatsapp/${action}`);
      toast.success(action === "restart" ? "Session direstart." : "Session diputus.");
      setQrData(null);
      setTimeout(fetchStatus, 2000);
    } catch {
      toast.error("Aksi gagal.");
    } finally {
      setActing(null);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) { toast.error("Masukkan nomor HP tujuan."); return; }
    setSendingTest(true);
    try {
      await api.post("/admin/whatsapp/send-test", { phone: testPhone, message: testMessage });
      toast.success("Pesan test berhasil dikirim!");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Gagal mengirim.");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">WhatsApp Gateway</h1>
        <p className="text-sm text-gray-500 mt-0.5">Monitor dan kelola koneksi WhatsApp sistem</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Status Koneksi</p>
          <button
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-40"
          >
            {loadingStatus ? "Memuat..." : "Refresh"}
          </button>
        </div>

        {loadingStatus && !status ? (
          <div className="h-16 animate-pulse bg-gray-50 rounded-xl" />
        ) : status ? (
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${status.connected ? "bg-green-50" : "bg-gray-50"}`}>
              {status.connected ? "📱" : "❌"}
            </div>
            <div className="flex-1 min-w-0">
              <StatusBadge connected={status.connected} status={status.status} />
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
        ) : null}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
          {!status?.connected ? (
            <button
              onClick={handleGetQr}
              disabled={loadingQr}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5V16M4 4h4v4H4V4zm0 12h4v4H4v-4zm12-12h4v4h-4V4z" />
              </svg>
              {loadingQr ? "Mengambil QR..." : "Ambil QR Code"}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAction("restart")}
                disabled={acting !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {acting === "restart" ? "Merestart..." : "Restart Session"}
              </button>
              <button
                onClick={() => handleAction("disconnect")}
                disabled={acting !== null}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                {acting === "disconnect" ? "Memutus..." : "Putus Koneksi"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* QR Code */}
      {qrData && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-1">Scan QR Code</p>
          <p className="text-xs text-gray-400 mb-4">
            Buka WhatsApp di HP nomor BUMDes → Perangkat Tertaut → Tautkan Perangkat → Scan QR ini.
          </p>
          <div className="flex justify-center">
            {qrData.startsWith("data:image") ? (
              <img src={qrData} alt="QR Code" className="w-56 h-56 rounded-xl border border-gray-100" />
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-500 break-all max-w-xs">{qrData}</div>
            )}
          </div>
          <p className="text-[11px] text-center text-gray-400 mt-3">QR expired dalam ~60 detik. Klik "Ambil QR Code" lagi jika kadaluarsa.</p>
        </div>
      )}

      {/* Test Kirim */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">Tes Kirim Pesan</p>
          <p className="text-xs text-gray-400 mt-0.5">Kirim pesan percobaan untuk memastikan koneksi berjalan.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nomor HP Tujuan</label>
            <input
              type="tel"
              value={testPhone}
              onChange={e => setTestPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pesan</label>
            <textarea
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50 resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-right">{testMessage.length}/500</p>
          </div>
          <button
            onClick={handleSendTest}
            disabled={sendingTest || !status?.connected}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {sendingTest ? "Mengirim..." : !status?.connected ? "WA Belum Terhubung" : "Kirim Pesan Test"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 space-y-1">
        <p className="font-semibold">Panduan Aman Penggunaan</p>
        <ul className="list-disc list-inside space-y-0.5 text-amber-700">
          <li>Gunakan nomor WA <strong>khusus sistem</strong>, bukan nomor pribadi</li>
          <li>Pesan dikirim otomatis dengan delay 1-3 detik antar pesan</li>
          <li>Hanya kirim pesan transaksional (OTP, konfirmasi order) — bukan promosi massal</li>
          <li>Pastikan HP nomor WA selalu <strong>nyala dan terkoneksi internet</strong></li>
          <li>Jika session terputus, klik "Ambil QR Code" dan scan ulang</li>
        </ul>
      </div>
    </div>
  );
}
