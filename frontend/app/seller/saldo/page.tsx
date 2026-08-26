"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api/axios";

interface BankAccount {
  id: number;
  channel_code: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
}

interface Balance {
  pending: number;
  available: number;
  withdrawn: number;
}

const BANK_OPTIONS = [
  { code: "BCA",     name: "BCA",        minLen: 10, maxLen: 10 },
  { code: "BNI",     name: "BNI",        minLen: 10, maxLen: 10 },
  { code: "BRI",     name: "BRI",        minLen: 15, maxLen: 15 },
  { code: "MANDIRI", name: "Mandiri",    minLen: 13, maxLen: 13 },
  { code: "PERMATA", name: "Permata",    minLen: 10, maxLen: 10 },
  { code: "DANAMON", name: "Danamon",    minLen: 10, maxLen: 14 },
  { code: "BSI",     name: "BSI",        minLen: 10, maxLen: 10 },
  { code: "CIMB",    name: "CIMB Niaga", minLen: 13, maxLen: 14 },
];

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id");
}

export default function SellerSaldoPage() {
  const [balance, setBalance]               = useState<Balance | null>(null);
  const [accounts, setAccounts]             = useState<BankAccount[]>([]);
  const [loading, setLoading]               = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg]       = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showAddForm, setShowAddForm]       = useState(false);
  const [addLoading, setAddLoading]         = useState(false);
  const [form, setForm]                     = useState({ channel_code: "", account_number: "", account_name: "" });
  const [addMsg, setAddMsg]                 = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchData = () => {
    api.get("/seller/bank-accounts")
      .then(r => {
        setBalance(r.data.data?.balance ?? null);
        setAccounts(r.data.data?.accounts ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const activeAccount = accounts.find(a => a.is_active);
  const avail    = parseFloat(String(balance?.available ?? 0));
  const pending  = parseFloat(String(balance?.pending   ?? 0));
  const withdrawn = parseFloat(String(balance?.withdrawn ?? 0));

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount.replace(/\D/g, ""));
    if (!amount || amount < 10000) {
      setWithdrawMsg({ type: "err", text: "Minimal penarikan Rp 10.000" });
      return;
    }
    if (!activeAccount) {
      setWithdrawMsg({ type: "err", text: "Tambahkan rekening bank terlebih dahulu." });
      return;
    }
    setWithdrawLoading(true);
    setWithdrawMsg(null);
    try {
      await api.post("/seller/withdraw", { amount });
      setWithdrawMsg({ type: "ok", text: "Permintaan pencairan berhasil diajukan." });
      setWithdrawAmount("");
      fetchData();
    } catch (e: any) {
      setWithdrawMsg({ type: "err", text: e?.response?.data?.message ?? "Gagal mengajukan penarikan." });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!form.channel_code) {
      setAddMsg({ type: "err", text: "Pilih bank terlebih dahulu." });
      return;
    }
    if (!form.account_number.trim() || !form.account_name.trim()) {
      setAddMsg({ type: "err", text: "Isi semua field rekening." });
      return;
    }
    const selectedBank = BANK_OPTIONS.find(b => b.code === form.channel_code);
    if (selectedBank) {
      const accLen = form.account_number.trim().length;
      if (accLen < selectedBank.minLen || accLen > selectedBank.maxLen) {
        const lenText = selectedBank.minLen === selectedBank.maxLen 
          ? `${selectedBank.minLen} digit` 
          : `${selectedBank.minLen}-${selectedBank.maxLen} digit`;
        setAddMsg({ type: "err", text: `Nomor rekening ${selectedBank.name} harus ${lenText}.` });
        return;
      }
    }
    
    setAddLoading(true);
    setAddMsg(null);
    try {
      await api.post("/seller/bank-accounts", form);
      setAddMsg({ type: "ok", text: "Rekening berhasil ditambahkan." });
      setForm({ channel_code: "", account_number: "", account_name: "" });
      setShowAddForm(false);
      fetchData();
    } catch (e: any) {
      setAddMsg({ type: "err", text: e?.response?.data?.message ?? "Gagal menambahkan rekening." });
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    try {
      await api.delete(`/seller/bank-accounts/${id}`);
      fetchData();
    } catch {}
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Saldo &amp; Tarik Tunai</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola saldo dan rekening bank toko kamu</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <p className="text-xs text-gray-500">Saldo Tersedia</p>
          <p className="text-lg font-bold text-green-700 mt-1">{loading ? "—" : formatRp(avail)}</p>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
          <p className="text-xs text-gray-500">Diproses</p>
          <p className="text-lg font-bold text-yellow-700 mt-1">{loading ? "—" : formatRp(pending)}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Total Dicairkan</p>
          <p className="text-lg font-bold text-gray-600 mt-1">{loading ? "—" : formatRp(withdrawn)}</p>
        </div>
      </div>

      {/* Withdraw */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Tarik Saldo</h2>

        {activeAccount ? (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
            <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
              {activeAccount.channel_code.slice(0, 3)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">{activeAccount.account_name}</p>
              <p className="text-xs text-gray-500">{activeAccount.channel_code} · {activeAccount.account_number}</p>
            </div>
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">Aktif</span>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 rounded-xl text-xs text-yellow-700 border border-yellow-100">
            Tambahkan rekening bank terlebih dahulu sebelum menarik saldo.
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Jumlah (min. 10.000)"
              value={withdrawAmount ? parseInt(withdrawAmount).toLocaleString("id") : ""}
              onChange={e => setWithdrawAmount(e.target.value.replace(/\D/g, ""))}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
            />
          </div>
          <button
            onClick={handleWithdraw}
            disabled={withdrawLoading || !activeAccount}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-40 transition-opacity shrink-0"
            style={{ background: "var(--primary)" }}
          >
            {withdrawLoading ? "Memproses..." : "Tarik"}
          </button>
        </div>

        {withdrawMsg && (
          <p className={`text-xs font-medium ${withdrawMsg.type === "ok" ? "text-green-600" : "text-red-500"}`}>
            {withdrawMsg.text}
          </p>
        )}
      </div>

      {/* Bank accounts */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Rekening Bank</h2>
          <button
            onClick={() => { setShowAddForm(v => !v); setAddMsg(null); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white"
            style={{ background: "var(--primary)" }}
          >
            {showAddForm ? "Batal" : "+ Tambah"}
          </button>
        </div>

        {showAddForm && (
          <div className="px-5 py-4 border-b border-gray-50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={form.channel_code}
                onChange={e => setForm(f => ({ ...f, channel_code: e.target.value, account_number: "" }))}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
              >
                <option value="" disabled>Pilih Bank...</option>
                {BANK_OPTIONS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
              <input
                type="text"
                placeholder="Nomor rekening"
                value={form.account_number}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "");
                  const max = BANK_OPTIONS.find(b => b.code === form.channel_code)?.maxLen || 20;
                  setForm(f => ({ ...f, account_number: val.slice(0, max) }));
                }}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
              />
              <input
                type="text"
                placeholder="Nama pemilik rekening"
                value={form.account_name}
                onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
              />
            </div>
            {addMsg && (
              <p className={`text-xs font-medium ${addMsg.type === "ok" ? "text-green-600" : "text-red-500"}`}>{addMsg.text}</p>
            )}
            <button
              onClick={handleAddAccount}
              disabled={addLoading}
              className="text-sm font-semibold px-4 py-2 rounded-xl text-white disabled:opacity-50"
              style={{ background: "var(--primary)" }}
            >
              {addLoading ? "Menyimpan..." : "Simpan Rekening"}
            </button>
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {loading ? (
            <p className="px-5 py-6 text-xs text-center text-gray-400">Memuat...</p>
          ) : accounts.length === 0 ? (
            <p className="px-5 py-6 text-xs text-center text-gray-400">Belum ada rekening tersimpan.</p>
          ) : (
            accounts.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
                  {a.channel_code.slice(0, 3)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{a.account_name}</p>
                  <p className="text-xs text-gray-500">{a.channel_code} · {a.account_number}</p>
                </div>
                {a.is_active && (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">Aktif</span>
                )}
                <button
                  onClick={() => handleDeleteAccount(a.id)}
                  className="ml-1 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  title="Hapus rekening"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
