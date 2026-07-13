"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const EMPTY_FORM = {
  code: "", name: "", description: "",
  type: "percentage" as "percentage" | "fixed",
  value: "", min_order_amount: "", max_discount_amount: "",
  start_date: "", end_date: "", usage_limit: "",
};

type Form = typeof EMPTY_FORM;

export default function PromosiPage() {
  const toast = useToast();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/seller/promotions");
      setPromos(res.data.data ?? []);
    } catch {
      toast.error("Gagal memuat data promosi.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  const set = (field: keyof Form, val: string) => setForm(p => ({ ...p, [field]: val }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (promo: any) => {
    setEditing(promo);
    setForm({
      code:                promo.code ?? "",
      name:                promo.name ?? "",
      description:         promo.description ?? "",
      type:                promo.type ?? "percentage",
      value:               String(promo.value ?? ""),
      min_order_amount:    String(promo.min_order_amount ?? ""),
      max_discount_amount: String(promo.max_discount_amount ?? ""),
      start_date:          promo.start_date ? promo.start_date.slice(0, 10) : "",
      end_date:            promo.end_date ? promo.end_date.slice(0, 10) : "",
      usage_limit:         String(promo.usage_limit ?? ""),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.value) {
      toast.error("Kode, nama, dan nilai wajib diisi.");
      return;
    }
    setSaving(true);
    const body: any = {
      code:  form.code.toUpperCase().trim(),
      name:  form.name.trim(),
      type:  form.type,
      value: Number(form.value),
    };
    if (form.description)        body.description         = form.description;
    if (form.min_order_amount)   body.min_order_amount    = Number(form.min_order_amount);
    if (form.max_discount_amount) body.max_discount_amount = Number(form.max_discount_amount);
    if (form.start_date)         body.start_date          = form.start_date;
    if (form.end_date)           body.end_date            = form.end_date;
    if (form.usage_limit)        body.usage_limit         = Number(form.usage_limit);

    try {
      if (editing) {
        await api.put(`/seller/promotions/${editing.id}`, body);
        toast.success("Promosi diperbarui.");
      } else {
        await api.post("/seller/promotions", body);
        toast.success("Promosi berhasil dibuat.");
      }
      setShowForm(false);
      fetchPromos();
    } catch (err: any) {
      const errs = err.response?.data?.errors;
      if (errs) {
        const first = Object.values(errs)[0] as string[];
        toast.error(first[0]);
      } else {
        toast.error("Gagal menyimpan promosi.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/seller/promotions/${deleteTarget.id}`);
      toast.success("Promosi dihapus.");
      setDeleteTarget(null);
      fetchPromos();
    } catch {
      toast.error("Gagal menghapus promosi.");
    }
  };

  const handleToggle = async (promo: any) => {
    setTogglingId(promo.id);
    try {
      await api.patch(`/seller/promotions/${promo.id}/toggle`);
      fetchPromos();
    } catch {
      toast.error("Gagal mengubah status.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kode Promo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola kode voucher untuk tokomu</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ background: "var(--primary)" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat Promo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: "var(--primary)" }} />
        </div>
      ) : promos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Belum ada kode promo</p>
          <p className="text-xs text-gray-400 mb-4 max-w-xs">
            Buat kode promo untuk menarik lebih banyak pembeli ke tokomu.
          </p>
          <button onClick={openCreate}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
            style={{ background: "var(--primary)" }}>
            Buat Promo Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map(promo => (
            <div key={promo.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg tracking-wider">
                      {promo.code}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${promo.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {promo.status === "active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{promo.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Diskon{" "}
                    <span className="font-semibold text-gray-700">
                      {promo.type === "percentage" ? `${promo.value}%` : formatRp(Number(promo.value))}
                    </span>
                    {promo.min_order_amount > 0 && (
                      <> · min. {formatRp(Number(promo.min_order_amount))}</>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(promo.start_date)} — {formatDate(promo.end_date)}
                    {promo.usage_limit && (
                      <> · {promo.usage_count}/{promo.usage_limit} dipakai</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleToggle(promo)} disabled={togglingId === promo.id}
                    className={`relative w-10 h-6 rounded-full transition-colors disabled:opacity-50 ${promo.status === "active" ? "bg-green-500" : "bg-gray-200"}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${promo.status === "active" ? "right-1" : "left-1"}`} />
                  </button>
                  <button onClick={() => openEdit(promo)}
                    className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleteTarget(promo)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <p className="text-base font-bold text-gray-900">{editing ? "Edit Promosi" : "Buat Promosi"}</p>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Kode Promo *</label>
                  <input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())}
                    placeholder="DISKON10"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 font-mono uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nama Promo *</label>
                  <input value={form.name} onChange={e => set("name", e.target.value)}
                    placeholder="Diskon 10% untuk semua"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Jenis Diskon *</label>
                <div className="grid grid-cols-2 gap-2">
                  {([["percentage", "Persentase (%)"], ["fixed", "Nominal (Rp)"]] as const).map(([val, label]) => (
                    <button key={val} type="button" onClick={() => set("type", val)}
                      className="py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all"
                      style={form.type === val
                        ? { borderColor: "var(--primary)", background: "#F0FDF4", color: "var(--primary)" }
                        : { borderColor: "#E5E7EB", background: "white", color: "#6B7280" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Nilai {form.type === "percentage" ? "(%)" : "(Rp)"} *
                  </label>
                  <input type="number" value={form.value} onChange={e => set("value", e.target.value)}
                    placeholder={form.type === "percentage" ? "10" : "20000"}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Maks. Diskon (Rp)</label>
                  <input type="number" value={form.max_discount_amount} onChange={e => set("max_discount_amount", e.target.value)}
                    placeholder="50000"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Min. Pembelian (Rp)</label>
                <input type="number" value={form.min_order_amount} onChange={e => set("min_order_amount", e.target.value)}
                  placeholder="100000"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Mulai</label>
                  <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Berakhir</label>
                  <input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Batas Penggunaan</label>
                <input type="number" value={form.usage_limit} onChange={e => set("usage_limit", e.target.value)}
                  placeholder="Kosongkan = tidak terbatas"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Deskripsi</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="Keterangan promo (opsional)"
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 resize-none" />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--primary)" }}>
                {saving ? "Menyimpan..." : editing ? "Perbarui" : "Buat Promo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Promosi"
        description={`Yakin ingin menghapus promo "${deleteTarget?.code}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
