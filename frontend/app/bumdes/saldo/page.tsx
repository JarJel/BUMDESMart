"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api/axios";
import { useToast } from "@/components/ui/Toast";

/* ─── Types ─────────────────────────────────────────── */
interface BalanceData {
  pending: number;
  available: number;
  total_seller_fee: number;
  total_service_fee: number;
  month_seller_fee: number;
  month_service_fee: number;
  month_total: number;
  bank_account: {
    id: number;
    channel_code: string;
    account_number: string;
    account_name: string;
  } | null;
}

interface BumdesTx {
  id: number;
  type: "seller_fee" | "service_fee";
  amount: number;
  description: string;
  created_at: string;
  order?: { order_code: string };
}

interface Disbursement {
  id: number;
  amount: string;
  channel_code: string;
  account_number: string;
  account_name: string;
  status: string;
  reference_id: string;
  created_at: string;
}

/* ─── Helpers ────────────────────────────────────────── */
function rupiah(n: number) {
  return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const DISBURSE_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: "Diproses",  cls: "bg-yellow-50 text-yellow-700" },
  COMPLETED:  { label: "Berhasil",  cls: "bg-green-50  text-green-700"  },
  FAILED:     { label: "Gagal",     cls: "bg-red-50    text-red-700"    },
  IN_PROCESS: { label: "Diproses",  cls: "bg-blue-50   text-blue-700"   },
};

const TX_TYPE_LABEL: Record<string, string> = {
  seller_fee:  "Fee Seller",
  service_fee: "Fee Layanan",
};

const BANKS = [
  "BCA", "BNI", "BRI", "MANDIRI", "BSI", "CIMB", "PERMATA", "DANAMON",
  "OCBC", "PANIN", "MAYBANK", "BTN", "MEGA", "BUKOPIN", "BJB",
];

type Tab = "overview" | "transactions" | "disbursements" | "bank";

/* ─── Page ───────────────────────────────────────────── */
export default function SaldoPage() {
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("overview");
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [txList, setTxList] = useState<BumdesTx[]>([]);
  const [txFilter, setTxFilter] = useState("");
  const [disburseList, setDisburseList] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);

  /* Withdraw modal */
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  /* Bank account form */
  const [bankForm, setBankForm] = useState({ channel_code: "", account_number: "", account_name: "" });
  const [bankErrors, setBankErrors] = useState<Record<string, string>>({});
  const [savingBank, setSavingBank] = useState(false);

  const loadBalance = useCallback(async () => {
    try {
      const r = await api.get("/admin/balance");
      const d: BalanceData = r.data.data;
      setBalance(d);
      if (d.bank_account) {
        setBankForm({
          channel_code: d.bank_account.channel_code,
          account_number: d.bank_account.account_number,
          account_name: d.bank_account.account_name,
        });
      }
    } catch {}
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const params = txFilter ? `?type=${txFilter}` : "";
      const r = await api.get(`/admin/transactions${params}`);
      setTxList(r.data.data?.data ?? []);
    } catch {}
  }, [txFilter]);

  const loadDisbursements = useCallback(async () => {
    try {
      const r = await api.get("/admin/disbursements");
      setDisburseList(r.data.data?.data ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadBalance(), loadTransactions(), loadDisbursements()]).finally(() => setLoading(false));
  }, [loadBalance, loadTransactions, loadDisbursements]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  /* Withdraw */
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(withdrawAmt.replace(/\D/g, ""), 10);
    if (!amt || amt < 10000) { toast.error("Minimum pencairan Rp 10.000."); return; }
    if (!balance?.bank_account) { toast.error("Tambahkan rekening bank dulu sebelum mencairkan."); setTab("bank"); setShowWithdraw(false); return; }
    setWithdrawing(true);
    try {
      const r = await api.post("/admin/withdraw", { amount: amt });
      toast.success(r.data.message);
      setShowWithdraw(false);
      setWithdrawAmt("");
      loadBalance();
      loadDisbursements();
      setTab("disbursements");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Gagal mengajukan pencairan.");
    } finally {
      setWithdrawing(false);
    }
  };

  /* Bank account */
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!bankForm.channel_code) errs.channel_code = "Pilih bank.";
    if (!bankForm.account_number.trim()) errs.account_number = "Nomor rekening wajib diisi.";
    if (!bankForm.account_name.trim()) errs.account_name = "Nama pemilik rekening wajib diisi.";
    if (Object.keys(errs).length) { setBankErrors(errs); return; }
    setBankErrors({});
    setSavingBank(true);
    try {
      await api.post("/admin/bank-account", bankForm);
      toast.success("Rekening bank berhasil disimpan.");
      loadBalance();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Gagal menyimpan rekening.");
    } finally {
      setSavingBank(false);
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview",      label: "Ringkasan"   },
    { key: "transactions",  label: "Pemasukan"   },
    { key: "disbursements", label: "Pencairan"   },
    { key: "bank",          label: "Rekening Bank" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Saldo BUMDes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pantau pemasukan dari fee dan ajukan pencairan ke rekening BUMDes.</p>
        </div>
        <button
          onClick={() => setShowWithdraw(true)}
          disabled={!balance || balance.available < 10000}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ background: "#2D6A4F" }}
        >
          Cairkan Saldo
        </button>
      </div>

      {/* Saldo cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-600 rounded-2xl p-5 text-white">
          <p className="text-xs opacity-75">Saldo Tersedia</p>
          <p className="text-2xl font-bold mt-1">{balance ? rupiah(balance.available) : "—"}</p>
          <p className="text-xs opacity-60 mt-1">Bisa dicairkan sekarang</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500">Saldo Menunggu</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{balance ? rupiah(balance.pending) : "—"}</p>
          <p className="text-xs text-gray-400 mt-1">Belum diselesaikan pembeli</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              tab === t.key ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Ringkasan */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Bulan Ini</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Fee Seller</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{balance ? rupiah(balance.month_seller_fee) : "—"}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Fee Layanan</p>
                <p className="text-base font-bold text-blue-700 mt-0.5">{balance ? rupiah(balance.month_service_fee) : "—"}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Total Bulan Ini</p>
                <p className="text-base font-bold text-green-700 mt-0.5">{balance ? rupiah(balance.month_total) : "—"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Semua Waktu</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Fee Seller</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{balance ? rupiah(balance.total_seller_fee) : "—"}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Fee Layanan</p>
                <p className="text-base font-bold text-blue-700 mt-0.5">{balance ? rupiah(balance.total_service_fee) : "—"}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-base font-bold text-green-700 mt-0.5">
                  {balance ? rupiah(balance.total_seller_fee + balance.total_service_fee) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Rekening terdaftar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Rekening Pencairan</h2>
              <button onClick={() => setTab("bank")} className="text-xs text-green-700 font-medium">Ubah</button>
            </div>
            {balance?.bank_account ? (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{balance.bank_account.channel_code} · {balance.bank_account.account_number}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{balance.bank_account.account_name}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400">Belum ada rekening terdaftar.</p>
                <button onClick={() => setTab("bank")} className="mt-2 text-xs font-semibold text-green-700">+ Tambah Rekening</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Pemasukan */}
      {tab === "transactions" && (
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900 mr-auto">Histori Pemasukan</h2>
            <select
              value={txFilter}
              onChange={e => setTxFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 focus:outline-none"
            >
              <option value="">Semua</option>
              <option value="seller_fee">Fee Seller</option>
              <option value="service_fee">Fee Layanan</option>
            </select>
          </div>
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Memuat...</div>
          ) : txList.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Belum ada pemasukan.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {txList.map(tx => (
                <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-800">{tx.description}</p>
                    {tx.order && (
                      <p className="text-xs text-gray-400 mt-0.5">#{tx.order.order_code}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(tx.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tx.type === "seller_fee" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
                      {TX_TYPE_LABEL[tx.type]}
                    </span>
                    <p className="text-sm font-bold text-gray-900 mt-1">+{rupiah(tx.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Pencairan */}
      {tab === "disbursements" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={!balance || balance.available < 10000}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed border-2 border-dashed border-green-300 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
            style={{ color: "#2D6A4F" }}
          >
            + Ajukan Pencairan Baru
          </button>

          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Riwayat Pencairan</h2>
            </div>
            {disburseList.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">Belum ada pencairan.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {disburseList.map(d => {
                  const s = DISBURSE_STATUS[d.status] ?? { label: d.status, cls: "bg-gray-100 text-gray-500" };
                  return (
                    <div key={d.id} className="px-5 py-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{rupiah(parseFloat(d.amount))}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{d.channel_code} · {d.account_number}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(d.created_at)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Rekening Bank */}
      {tab === "bank" && (
        <form onSubmit={handleSaveBank} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Rekening Bank BUMDes</h2>
            <p className="text-xs text-gray-500 mt-0.5">Dana akan ditransfer ke rekening ini saat pencairan diproses.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Bank</label>
            <select
              value={bankForm.channel_code}
              onChange={e => setBankForm(f => ({ ...f, channel_code: e.target.value }))}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 ${bankErrors.channel_code ? "border-red-300" : "border-gray-200"}`}
            >
              <option value="">Pilih bank...</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            {bankErrors.channel_code && <p className="text-xs text-red-500 mt-1">{bankErrors.channel_code}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Nomor Rekening</label>
            <input
              value={bankForm.account_number}
              onChange={e => setBankForm(f => ({ ...f, account_number: e.target.value }))}
              placeholder="Contoh: 1234567890"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 ${bankErrors.account_number ? "border-red-300" : "border-gray-200"}`}
            />
            {bankErrors.account_number && <p className="text-xs text-red-500 mt-1">{bankErrors.account_number}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Nama Pemilik Rekening</label>
            <input
              value={bankForm.account_name}
              onChange={e => setBankForm(f => ({ ...f, account_name: e.target.value }))}
              placeholder="Nama sesuai buku tabungan"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:border-green-400 bg-gray-50 ${bankErrors.account_name ? "border-red-300" : "border-gray-200"}`}
            />
            {bankErrors.account_name && <p className="text-xs text-red-500 mt-1">{bankErrors.account_name}</p>}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingBank}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#2D6A4F" }}
            >
              {savingBank ? "Menyimpan..." : "Simpan Rekening"}
            </button>
          </div>
        </form>
      )}

      {/* Modal Pencairan */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowWithdraw(false)}>
          <form
            onSubmit={handleWithdraw}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-gray-900">Cairkan Saldo</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Saldo tersedia: <span className="font-semibold text-green-700">{balance ? rupiah(balance.available) : "—"}</span>
              </p>
            </div>

            {balance?.bank_account ? (
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
                Dikirim ke: <span className="font-semibold">{balance.bank_account.channel_code} {balance.bank_account.account_number}</span>
                {" · "}{balance.bank_account.account_name}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
                Belum ada rekening bank. Isi di tab "Rekening Bank" terlebih dahulu.
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Nominal (min. Rp 10.000)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
                <input
                  value={withdrawAmt}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setWithdrawAmt(raw ? parseInt(raw).toLocaleString("id-ID") : "");
                  }}
                  placeholder="0"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-gray-50"
                />
              </div>
              {balance && (
                <button
                  type="button"
                  onClick={() => setWithdrawAmt(balance.available.toLocaleString("id-ID"))}
                  className="mt-1.5 text-xs text-green-700 font-medium"
                >
                  Cairkan semua
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowWithdraw(false)} className="flex-1 py-2.5 text-sm text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50">
                Batal
              </button>
              <button
                type="submit"
                disabled={withdrawing || !balance?.bank_account}
                className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
                style={{ background: "#2D6A4F" }}
              >
                {withdrawing ? "Memproses..." : "Cairkan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
