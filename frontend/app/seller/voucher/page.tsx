"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// --- Helpers ---
function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

// --- Types ---
type TriggerType = "item_count" | "order_amount" | "order_frequency";
type RewardType = "flat" | "percentage" | "free_shipping";

interface VoucherProgram {
  id: number;
  trigger_type: TriggerType;
  trigger_value: number;
  reward_type: RewardType;
  reward_value: number;
  max_discount: number | null;
  label: string | null;
  auto_label: string;
  is_active: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  trigger_type: "item_count" as TriggerType,
  trigger_value: "",
  reward_type: "flat" as RewardType,
  reward_value: "",
  max_discount: "",
  label: "",
};

const TRIGGER_OPTIONS: { value: TriggerType; label: string; desc: string; icon: string; unit: string; placeholder: string }[] = [
  {
    value: "item_count",
    label: "Jumlah Item",
    desc: "Berdasarkan jumlah item yang dibeli dalam 1 transaksi",
    icon: "ti ti-shopping-bag",
    unit: "item",
    placeholder: "misal: 5",
  },
  {
    value: "order_amount",
    label: "Total Belanja",
    desc: "Berdasarkan total harga belanja dalam 1 transaksi",
    icon: "ti ti-coin",
    unit: "Rp",
    placeholder: "misal: 200000",
  },
  {
    value: "order_frequency",
    label: "Frekuensi Beli",
    desc: "Berdasarkan berapa kali customer sudah beli di toko ini",
    icon: "ti ti-refresh",
    unit: "kali",
    placeholder: "misal: 10",
  },
];

const REWARD_OPTIONS: { value: RewardType; label: string; icon: string }[] = [
  { value: "flat", label: "Diskon Nominal (Rp)", icon: "ti ti-coin" },
  { value: "percentage", label: "Diskon Persen (%)", icon: "ti ti-tag" },
  { value: "free_shipping", label: "Gratis Ongkir", icon: "ti ti-truck" },
];

function buildAutoLabel(form: typeof EMPTY_FORM): string {
  const trigger = TRIGGER_OPTIONS.find((t) => t.value === form.trigger_type);
  if (!form.trigger_value || !trigger) return "Preview label akan muncul di sini...";

  let triggerText = "";
  if (form.trigger_type === "item_count") triggerText = `Beli ${form.trigger_value} item`;
  else if (form.trigger_type === "order_amount") triggerText = `Belanja ${formatRp(Number(form.trigger_value))}`;
  else triggerText = `${form.trigger_value}x beli di toko ini`;

  let rewardText = "";
  if (form.reward_type === "flat") rewardText = form.reward_value ? `diskon ${formatRp(Number(form.reward_value))}` : "...";
  else if (form.reward_type === "percentage") rewardText = form.reward_value ? `diskon ${form.reward_value}%` : "...";
  else rewardText = "gratis ongkir";

  return `${triggerText} → ${rewardText}`;
}

export default function VoucherPage() {
  const toast = useToast();
  const [programs, setPrograms] = useState<VoucherProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VoucherProgram | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VoucherProgram | null>(null);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/seller/voucher-programs");
      setPrograms(res.data.data ?? []);
    } catch {
      toast.error("Gagal memuat program voucher.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  const set = (field: keyof typeof EMPTY_FORM, val: string) =>
    setForm((p) => ({ ...p, [field]: val }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (p: VoucherProgram) => {
    setEditing(p);
    setForm({
      trigger_type: p.trigger_type,
      trigger_value: String(p.trigger_value),
      reward_type: p.reward_type,
      reward_value: String(p.reward_value),
      max_discount: p.max_discount ? String(p.max_discount) : "",
      label: p.label ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.trigger_value) {
      toast.error("Nilai syarat wajib diisi.");
      return;
    }
    if (form.reward_type !== "free_shipping" && !form.reward_value) {
      toast.error("Nilai reward wajib diisi.");
      return;
    }
    setSaving(true);
    const body: Record<string, unknown> = {
      trigger_type: form.trigger_type,
      trigger_value: Number(form.trigger_value),
      reward_type: form.reward_type,
      reward_value: form.reward_type === "free_shipping" ? 0 : Number(form.reward_value),
      is_active: true,
    };
    if (form.max_discount) body.max_discount = Number(form.max_discount);
    if (form.label.trim()) body.label = form.label.trim();

    try {
      if (editing) {
        await api.put(`/seller/voucher-programs/${editing.id}`, body);
        toast.success("Program voucher diperbarui.");
      } else {
        await api.post("/seller/voucher-programs", body);
        toast.success("Program voucher berhasil dibuat.");
      }
      setShowForm(false);
      fetchPrograms();
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      const errs = anyErr?.response?.data?.errors;
      if (errs) {
        const first = Object.values(errs)[0] as string[];
        toast.error(first[0]);
      } else {
        toast.error(anyErr?.response?.data?.message ?? "Gagal menyimpan program.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p: VoucherProgram) => {
    setTogglingId(p.id);
    try {
      await api.patch(`/seller/voucher-programs/${p.id}/toggle`);
      fetchPrograms();
    } catch {
      toast.error("Gagal mengubah status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/seller/voucher-programs/${deleteTarget.id}`);
      toast.success("Program voucher dihapus.");
      setDeleteTarget(null);
      fetchPrograms();
    } catch {
      toast.error("Gagal menghapus.");
    }
  };

  const selectedTrigger = TRIGGER_OPTIONS.find((t) => t.value === form.trigger_type)!;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Program Voucher</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Voucher otomatis tampil ke pembeli saat syarat terpenuhi — tanpa perlu kode
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "var(--primary)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat Voucher
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <i className="ti ti-bulb text-xl shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Cara kerja voucher</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            Voucher muncul otomatis di halaman checkout pembeli. Jika syarat terpenuhi, pembeli tinggal klik "Pakai" tanpa input kode.
            Hanya <strong>1 program aktif</strong> yang bisa berlaku di satu waktu.
          </p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: "var(--primary)" }} />
        </div>
      ) : programs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <i className="ti ti-ticket text-5xl text-gray-300 mb-4" />
          <p className="text-sm font-semibold text-gray-700 mb-1">Belum ada program voucher</p>
          <p className="text-xs text-gray-400 mb-5 max-w-xs">
            Buat program voucher untuk menarik lebih banyak pembeli. Voucher muncul otomatis tanpa kode.
          </p>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            Buat Voucher Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((p) => {
            const trigger = TRIGGER_OPTIONS.find((t) => t.value === p.trigger_type)!;
            const displayLabel = p.label || p.auto_label;
            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border-2 p-4 transition-all ${p.is_active ? "border-green-200" : "border-gray-100 opacity-60"}`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: p.is_active ? "var(--primary-light, #f0fdf4)" : "#f9fafb" }}
                  >
                    <i className={trigger.icon} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {p.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full font-medium">
                        {trigger.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{displayLabel}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span>
                        Syarat: <strong className="text-gray-700">
                          {p.trigger_type === "order_amount" ? formatRp(p.trigger_value) : `${p.trigger_value} ${trigger.unit}`}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Reward:{" "}
                        <strong className="text-gray-700">
                          {p.reward_type === "flat"
                            ? formatRp(p.reward_value)
                            : p.reward_type === "percentage"
                            ? `${p.reward_value}%`
                            : "Gratis Ongkir"}
                        </strong>
                      </span>
                      {p.max_discount && (
                        <>
                          <span>·</span>
                          <span>maks. {formatRp(p.max_discount)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggle(p)}
                      disabled={togglingId === p.id}
                      title={p.is_active ? "Nonaktifkan" : "Aktifkan"}
                      className={`relative w-10 h-6 rounded-full transition-colors disabled:opacity-40 ${p.is_active ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${p.is_active ? "right-1" : "left-1"}`} />
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <p className="text-base font-bold text-gray-900">{editing ? "Edit Program Voucher" : "Buat Program Voucher"}</p>
                <p className="text-xs text-gray-500 mt-0.5">Voucher tampil otomatis di checkout pembeli</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Trigger Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  1. Syarat dapat voucher
                </label>
                <div className="space-y-2">
                  {TRIGGER_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set("trigger_type", t.value)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        form.trigger_type === t.value
                          ? "border-green-500 bg-green-50"
                          : "border-gray-100 hover:border-gray-200 bg-white"
                      }`}
                    >
                      <i className={`${t.icon} text-xl shrink-0`} />
                      <div>
                        <p className={`text-sm font-semibold ${form.trigger_type === t.value ? "text-green-700" : "text-gray-800"}`}>
                          {t.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                      </div>
                      {form.trigger_type === t.value && (
                        <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trigger Value */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Nilai syarat ({selectedTrigger.unit})
                </label>
                <input
                  type="number"
                  value={form.trigger_value}
                  onChange={(e) => set("trigger_value", e.target.value)}
                  placeholder={selectedTrigger.placeholder}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  {form.trigger_type === "item_count" && "Minimum jumlah item yang harus ada di cart dari toko ini"}
                  {form.trigger_type === "order_amount" && "Minimum total belanja dari toko ini (dalam Rupiah)"}
                  {form.trigger_type === "order_frequency" && "Sudah berapa kali customer harus pernah beli di toko ini"}
                </p>
              </div>

              {/* Reward Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  2. Hadiah yang didapat
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {REWARD_OPTIONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => set("reward_type", r.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all ${
                        form.reward_type === r.value
                          ? "border-green-500 bg-green-50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <i className={`${r.icon} text-xl`} />
                      <span className={`text-[11px] font-semibold ${form.reward_type === r.value ? "text-green-700" : "text-gray-600"}`}>
                        {r.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reward Value */}
              {form.reward_type !== "free_shipping" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Nilai {form.reward_type === "percentage" ? "(%)" : "(Rp)"} *
                    </label>
                    <input
                      type="number"
                      value={form.reward_value}
                      onChange={(e) => set("reward_value", e.target.value)}
                      placeholder={form.reward_type === "percentage" ? "misal: 15" : "misal: 10000"}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
                    />
                  </div>
                  {form.reward_type === "percentage" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Maks. Diskon (Rp)
                      </label>
                      <input
                        type="number"
                        value={form.max_discount}
                        onChange={(e) => set("max_discount", e.target.value)}
                        placeholder="Kosongkan = tanpa batas"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Label custom */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Label tampilan (opsional)
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => set("label", e.target.value)}
                  placeholder="Biarkan kosong untuk generate otomatis"
                  maxLength={100}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
                />
              </div>

              {/* Preview */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">
                <p className="text-[10px] text-green-600 font-semibold mb-1 uppercase tracking-wide">Preview Voucher</p>
                <div className="flex items-center gap-3">
                  <i className="ti ti-ticket text-2xl text-green-600" />
                  <div>
                    <p className="text-sm font-bold text-green-800">{form.label.trim() || buildAutoLabel(form)}</p>
                    <p className="text-[10px] text-green-600 mt-0.5">Tampil otomatis di checkout pembeli</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--primary)" }}
              >
                {saving ? "Menyimpan..." : editing ? "Perbarui" : "Buat Voucher"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Program Voucher"
        description={`Yakin ingin menghapus program "${deleteTarget?.label || deleteTarget?.auto_label}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
