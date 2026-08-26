"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

interface Setting {
  key: string;
  value: string;
  description: string | null;
}

// Key WA dikelola di halaman /admin/whatsapp
const WA_KEYS = ["wa_max_attempts", "wa_retry_delay"];

const LABELS: Record<string, string> = {
  site_name:        "Nama Platform",
  site_tagline:     "Tagline",
  contact_email:    "Email Kontak",
  contact_phone:    "Nomor Telepon",
  maintenance_mode: "Mode Maintenance",
};

export default function AdminPengaturanPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    api.get("/super-admin/settings")
      .then(res => {
        const data: Setting[] = (res.data.data ?? []).filter((s: Setting) => !WA_KEYS.includes(s.key));
        setSettings(data);
        const initial: Record<string, string> = {};
        data.forEach(s => { initial[s.key] = s.value; });
        setForm(initial);
      })
      .catch(() => toast.error("Gagal memuat pengaturan."))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/super-admin/settings", { settings: form });
      toast.success("Pengaturan berhasil disimpan.");
    } catch {
      toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">Memuat pengaturan...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pengaturan Sistem</h1>
        <p className="text-sm text-gray-500 mt-0.5">Konfigurasi platform secara global</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-50">
        {settings.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Belum ada pengaturan tersedia</div>
        ) : (
          settings.map(s => (
            <div key={s.key} className="px-5 py-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {LABELS[s.key] ?? s.key}
              </label>
              {s.description && <p className="text-xs text-gray-400 mb-2">{s.description}</p>}
              {s.key === "maintenance_mode" ? (
                <select
                  value={form[s.key] ?? "0"}
                  onChange={e => setForm({ ...form, [s.key]: e.target.value })}
                  className="w-48 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400"
                >
                  <option value="0">Nonaktif (normal)</option>
                  <option value="1">Aktif (maintenance)</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={form[s.key] ?? ""}
                  onChange={e => setForm({ ...form, [s.key]: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400"
                />
              )}
            </div>
          ))
        )}
      </div>

      {settings.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-60 transition-opacity"
            style={{ background: "#6366f1" }}
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      )}
    </div>
  );
}
