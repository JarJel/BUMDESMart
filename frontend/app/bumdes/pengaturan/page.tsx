"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

interface BumdesProfile {
  id: number;
  name: string;
  slug: string;
  village: string;
  district: string | null;
  city: string;
  province: string;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  status: string;
  fee_type: "percent" | "flat" | null;
  fee_value: number;
}

interface Balance {
  pending: number;
  available: number;
}

function rupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function LockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900">{value || <span className="text-gray-400 italic">—</span>}</p>
    </div>
  );
}

function SectionHeader({ title, locked }: { title: string; locked?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      {locked && (
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <LockIcon /> Hanya Super Admin
        </span>
      )}
    </div>
  );
}

export default function BumdesPengaturanPage() {
  const [profile, setProfile] = useState<BumdesProfile | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [description, setDescription] = useState("");
  const [feeType, setFeeType] = useState<"percent" | "flat" | "">("");
  const [feeValue, setFeeValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingDesc, setSavingDesc] = useState(false);
  const [savingFee, setSavingFee] = useState(false);
  const [descError, setDescError] = useState("");
  const [feeError, setFeeError] = useState("");
  const toast = useToast();

  const fetchProfile = async () => {
    try {
      const [profileRes, balanceRes] = await Promise.all([
        api.get("/admin/profile"),
        api.get("/admin/balance").catch(() => ({ data: { data: { pending: 0, available: 0 } } })),
      ]);
      const p: BumdesProfile = profileRes.data.data;
      setProfile(p);
      setDescription(p.description ?? "");
      setFeeType(p.fee_type ?? "");
      setFeeValue(p.fee_value > 0 ? String(p.fee_value) : "");
      setBalance(balanceRes.data.data);
    } catch {
      setDescError("Gagal memuat profil BUMDes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSaveDesc = async (e: React.FormEvent) => {
    e.preventDefault();
    setDescError("");
    setSavingDesc(true);
    try {
      const res = await api.put("/admin/profile", { description: description || null });
      setProfile(res.data.data);
      toast.success("Deskripsi berhasil disimpan.");
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setDescError(msg ?? "Gagal menyimpan.");
    } finally {
      setSavingDesc(false);
    }
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeeError("");

    const val = parseFloat(feeValue || "0");
    if (feeType === "percent" && val > 2) {
      setFeeError("Fee persentase maksimal 2%.");
      return;
    }
    if (feeType === "flat" && val > 1000) {
      setFeeError("Fee nominal maksimal Rp 1.000.");
      return;
    }

    setSavingFee(true);
    try {
      const res = await api.put("/admin/profile", {
        fee_type: feeType || null,
        fee_value: feeType ? val : 0,
      });
      setProfile(res.data.data);
      toast.success("Pengaturan fee berhasil disimpan.");
    } catch (err: any) {
      setFeeError(err.response?.data?.message ?? "Gagal menyimpan.");
    } finally {
      setSavingFee(false);
    }
  };

  const feePreview = () => {
    const val = parseFloat(feeValue || "0");
    if (!feeType || val <= 0) return null;
    if (feeType === "percent") {
      const ex = [100_000, 250_000, 500_000];
      return ex.map(n => `${rupiah(n)} → potong ${rupiah(Math.round(n * val / 100))}`);
    }
    return [`Setiap transaksi dipotong ${rupiah(val)} (flat)`];
  };

  if (loading) {
    return <div className="p-16 text-center text-sm text-gray-400">Memuat pengaturan...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pengaturan BUMDes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Informasi BUMDes hanya dapat diubah Super Admin. Kamu bisa atur deskripsi dan fee layanan.
        </p>
      </div>

      {profile && (
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            profile.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {profile.status === "active" ? "Aktif" : profile.status}
          </span>
          {profile.slug && <span className="text-xs text-gray-400">/{profile.slug}</span>}
        </div>
      )}

      {/* Read-only sections */}
      {profile && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <SectionHeader title="Informasi BUMDes" locked />
            <InfoRow label="Nama BUMDes" value={profile.name} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <SectionHeader title="Lokasi" locked />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <InfoRow label="Desa / Kelurahan" value={profile.village} />
              <InfoRow label="Kecamatan" value={profile.district} />
              <InfoRow label="Kota / Kabupaten" value={profile.city} />
              <InfoRow label="Provinsi" value={profile.province} />
              <InfoRow label="Kode Pos" value={profile.postal_code} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <SectionHeader title="Kontak" locked />
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <InfoRow label="No. Telepon" value={profile.phone} />
              <InfoRow label="Email BUMDes" value={profile.email} />
            </div>
          </div>
        </>
      )}

      {/* Editable: Deskripsi */}
      <form onSubmit={handleSaveDesc}>
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 space-y-4">
          <SectionHeader title="Deskripsi" />
          {descError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{descError}</div>
          )}
          <div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Deskripsi singkat tentang BUMDes ini yang akan tampil di halaman profil..."
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Tampil di halaman profil yang dilihat mitra dan pembeli.</p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingDesc}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#2D6A4F" }}
            >
              {savingDesc ? "Menyimpan..." : "Simpan Deskripsi"}
            </button>
          </div>
        </div>
      </form>

      {/* Editable: Fee Layanan BUMDes */}
      <form onSubmit={handleSaveFee}>
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 space-y-5">
          <div>
            <SectionHeader title="Fee Layanan BUMDes" />
            <p className="text-xs text-gray-500 mt-1">
              Dipotong dari pendapatan seller setiap ada transaksi. Batas: max 2% atau max Rp 1.000 flat.
            </p>
          </div>

          {/* Saldo BUMDes */}
          {balance && (
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Saldo Menunggu</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{rupiah(balance.pending)}</p>
              </div>
              <div className="flex-1 bg-green-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Saldo Tersedia</p>
                <p className="text-base font-bold text-green-700 mt-0.5">{rupiah(balance.available)}</p>
              </div>
            </div>
          )}

          {feeError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{feeError}</div>
          )}

          {/* Tipe fee */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Tipe Fee</label>
            <div className="flex gap-3">
              {[
                { val: "", label: "Tidak ada fee" },
                { val: "percent", label: "Persentase (max 2%)" },
                { val: "flat", label: "Nominal tetap (max Rp 1.000)" },
              ].map(opt => (
                <label
                  key={opt.val}
                  className={`flex-1 flex items-center gap-2 border rounded-xl px-3.5 py-2.5 cursor-pointer text-sm transition-colors ${
                    feeType === opt.val
                      ? "border-green-400 bg-green-50 text-green-800"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="fee_type"
                    value={opt.val}
                    checked={feeType === opt.val}
                    onChange={() => { setFeeType(opt.val as any); setFeeValue(""); }}
                    className="accent-green-600"
                  />
                  <span className="text-xs font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Nilai fee */}
          {feeType && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                {feeType === "percent" ? "Persentase (%)" : "Nominal (Rp)"}
              </label>
              <div className="relative w-40">
                <input
                  type="number"
                  value={feeValue}
                  onChange={e => setFeeValue(e.target.value)}
                  min={0}
                  max={feeType === "percent" ? 2 : 1000}
                  step={feeType === "percent" ? 0.1 : 50}
                  placeholder={feeType === "percent" ? "0 – 2" : "0 – 1000"}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {feeType === "percent" ? "%" : "Rp"}
                </span>
              </div>
            </div>
          )}

          {/* Preview */}
          {feePreview() && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <p className="text-xs font-medium text-gray-600 mb-1.5">Simulasi potongan:</p>
              {feePreview()!.map((line, i) => (
                <p key={i} className="text-xs text-gray-500">{line}</p>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingFee}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#2D6A4F" }}
            >
              {savingFee ? "Menyimpan..." : "Simpan Fee"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
