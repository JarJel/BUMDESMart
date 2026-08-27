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

interface UmkmAccountItem {
  umkm_id: number;
  shop_name: string;
  owner_name: string;
  phone: string;
  logo: string | null;
  status: string;
  channel_code: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
  available_balance: number;
  pending_balance: number;
  withdrawn_total: number;
}

interface UmkmOrderTx {
  id: number;
  order_code: string;
  total: string;
  sub_total: string;
  shipping_cost: string;
  bumdes_fee: string;
  status: string;
  created_at: string;
  umkm_shop_name: string;
  umkm_owner_name: string;
  customer?: { user?: { name: string } };
  items?: { product?: { name: string } }[];
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

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending:    { label: "Menunggu",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed:  { label: "Dikonfirmasi", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  processing: { label: "Diproses",   cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  shipping:   { label: "Dikirim",    cls: "bg-purple-50 text-purple-700 border-purple-200" },
  delivered:  { label: "Sampai",     cls: "bg-teal-50 text-teal-700 border-teal-200" },
  completed:  { label: "Selesai",    cls: "bg-green-50 text-green-700 border-green-200" },
  cancelled:  { label: "Dibatalkan", cls: "bg-red-50 text-red-700 border-red-200" },
};

const TX_TYPE_LABEL: Record<string, string> = {
  seller_fee:  "Fee Seller",
  service_fee: "Fee Layanan",
};

const BANKS = [
  "BCA", "BNI", "BRI", "MANDIRI", "BSI", "CIMB", "PERMATA", "DANAMON",
  "OCBC", "PANIN", "MAYBANK", "BTN", "MEGA", "BUKOPIN", "BJB",
];

type Tab = "overview" | "transactions" | "disbursements" | "bank" | "umkm_accounts" | "umkm_transactions";

/* ─── Page ───────────────────────────────────────────── */
export default function SaldoPage() {
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("overview");
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [txList, setTxList] = useState<BumdesTx[]>([]);
  const [txFilter, setTxFilter] = useState("");
  const [disburseList, setDisburseList] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);

  /* UMKM Accounts state */
  const [umkmAccounts, setUmkmAccounts] = useState<UmkmAccountItem[]>([]);
  const [umkmSearch, setUmkmSearch] = useState("");
  const [loadingUmkmAcc, setLoadingUmkmAcc] = useState(false);

  /* UMKM Transactions state */
  const [umkmOrders, setUmkmOrders] = useState<UmkmOrderTx[]>([]);
  const [selectedUmkmId, setSelectedUmkmId] = useState<string>("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("");
  const [loadingOrders, setLoadingOrders] = useState(false);

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

  const loadUmkmAccounts = useCallback(async () => {
    setLoadingUmkmAcc(true);
    try {
      const r = await api.get("/admin/umkm-bank-accounts");
      setUmkmAccounts(r.data.data ?? []);
    } catch {
      toast.error("Gagal memuat daftar rekening UMKM.");
    } finally {
      setLoadingUmkmAcc(false);
    }
  }, [toast]);

  const loadUmkmOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams();
      if (selectedUmkmId) params.append("umkm_id", selectedUmkmId);
      if (orderStatusFilter) params.append("status", orderStatusFilter);
      const r = await api.get(`/admin/umkm-transactions?${params.toString()}`);
      setUmkmOrders(r.data.data?.data ?? []);
    } catch {
      toast.error("Gagal memuat transaksi per toko.");
    } finally {
      setLoadingOrders(false);
    }
  }, [selectedUmkmId, orderStatusFilter, toast]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadBalance(), loadTransactions(), loadDisbursements()]).finally(() => setLoading(false));
  }, [loadBalance, loadTransactions, loadDisbursements]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  useEffect(() => {
    if (tab === "umkm_accounts") {
      loadUmkmAccounts();
    } else if (tab === "umkm_transactions") {
      loadUmkmOrders();
      if (umkmAccounts.length === 0) loadUmkmAccounts();
    }
  }, [tab, loadUmkmAccounts, loadUmkmOrders, umkmAccounts.length]);

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
    { key: "overview",          label: "Ringkasan"         },
    { key: "transactions",      label: "Pemasukan Fee"     },
    { key: "disbursements",     label: "Pencairan BUMDes"  },
    { key: "umkm_accounts",     label: "Rekening UMKM"     },
    { key: "umkm_transactions", label: "Transaksi Toko"    },
    { key: "bank",              label: "Rekening Bank Kita"},
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pencairan Dana &amp; Keuangan BUMDes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pantau saldo, ajukan pencairan dana, cek rekening bank mitra UMKM, dan pantau transaksi per toko.</p>
        </div>
        <button
          onClick={() => setShowWithdraw(true)}
          disabled={!balance || balance.available < 10000}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-sm"
          style={{ background: "#2D6A4F" }}
        >
          Cairkan Saldo BUMDes
        </button>
      </div>

      {/* Saldo cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-green-700 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-xs opacity-75">Saldo BUMDes Tersedia</p>
          <p className="text-2xl font-bold mt-1">{balance ? rupiah(balance.available) : "—"}</p>
          <p className="text-xs opacity-60 mt-1">Siap diajukan pencairan</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500">Saldo Menunggu Selesai</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{balance ? rupiah(balance.pending) : "—"}</p>
          <p className="text-xs text-gray-400 mt-1">Menunggu konfirmasi penerimaan pesanan</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-gray-100/80 rounded-2xl overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex-1 text-center ${
              tab === t.key ? "bg-white shadow-sm text-gray-900 font-bold" : "text-gray-500 hover:text-gray-800"
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

      {/* Tab: Rekening UMKM */}
      {tab === "umkm_accounts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari nama toko atau pemilik..."
                value={umkmSearch}
                onChange={e => setUmkmSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-green-400"
              />
            </div>
            <button
              onClick={loadUmkmAccounts}
              disabled={loadingUmkmAcc}
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 shrink-0 flex items-center gap-1.5"
            >
              <svg className={`w-3.5 h-3.5 ${loadingUmkmAcc ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Rekening Bank Mitra UMKM</h2>
                <p className="text-xs text-gray-400 mt-0.5">Informasi rekening & saldo seluruh toko UMKM di bawah binaan BUMDes Anda</p>
              </div>
              <span className="text-xs font-medium bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                {umkmAccounts.length} UMKM
              </span>
            </div>

            {loadingUmkmAcc ? (
              <div className="py-12 text-center text-sm text-gray-400">Memuat data rekening...</div>
            ) : umkmAccounts.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">Belum ada mitra UMKM terdaftar.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-xs text-gray-500 font-semibold">
                      <th className="text-left px-5 py-3.5">Toko / UMKM</th>
                      <th className="text-left px-4 py-3.5">Bank</th>
                      <th className="text-left px-4 py-3.5">No. Rekening</th>
                      <th className="text-left px-4 py-3.5">Nama Pemilik Rekening</th>
                      <th className="text-right px-4 py-3.5">Saldo Tersedia</th>
                      <th className="text-center px-4 py-3.5">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {umkmAccounts
                      .filter(u =>
                        u.shop_name.toLowerCase().includes(umkmSearch.toLowerCase()) ||
                        u.owner_name.toLowerCase().includes(umkmSearch.toLowerCase()) ||
                        u.account_number.includes(umkmSearch) ||
                        u.channel_code.toLowerCase().includes(umkmSearch.toLowerCase())
                      )
                      .map((u) => {
                        const hasBank = u.account_number && u.account_number !== "-";
                        return (
                          <tr key={u.umkm_id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-600 shrink-0">
                                  {u.shop_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 leading-tight truncate">{u.shop_name}</p>
                                  <p className="text-xs text-gray-400 mt-0.5 truncate">{u.owner_name} {u.phone ? `· ${u.phone}` : ""}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {hasBank ? (
                                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                  {u.channel_code}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Belum diisi</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {hasBank ? (
                                <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-200 select-all">
                                  {u.account_number}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-xs font-medium text-gray-800">{hasBank ? u.account_name : "—"}</p>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <p className="text-xs font-bold text-green-700">{rupiah(u.available_balance)}</p>
                              {u.pending_balance > 0 && (
                                <p className="text-[10px] text-gray-400 mt-0.5">+{rupiah(u.pending_balance)} pending</p>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedUmkmId(String(u.umkm_id));
                                  setTab("umkm_transactions");
                                }}
                                className="text-xs font-semibold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                Transaksi
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Transaksi Per Toko */}
      {tab === "umkm_transactions" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
              <label className="text-xs font-semibold text-gray-600 shrink-0">Filter Toko:</label>
              <select
                value={selectedUmkmId}
                onChange={e => setSelectedUmkmId(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-green-400 font-medium"
              >
                <option value="">Semua Toko UMKM</option>
                {umkmAccounts.map(u => (
                  <option key={u.umkm_id} value={u.umkm_id}>
                    {u.shop_name} ({u.owner_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <label className="text-xs font-semibold text-gray-600 shrink-0">Status:</label>
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-green-400 font-medium"
              >
                <option value="">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="confirmed">Dikonfirmasi</option>
                <option value="processing">Diproses</option>
                <option value="shipping">Dikirim</option>
                <option value="delivered">Sampai</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
              <button
                onClick={loadUmkmOrders}
                disabled={loadingOrders}
                className="p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600"
                title="Refresh"
              >
                <svg className={`w-4 h-4 ${loadingOrders ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Histori Transaksi Toko</h2>
              <span className="text-xs font-medium text-gray-400">{umkmOrders.length} transaksi</span>
            </div>

            {loadingOrders ? (
              <div className="py-12 text-center text-sm text-gray-400">Memuat transaksi toko...</div>
            ) : umkmOrders.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">Belum ada transaksi pada filter ini.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {umkmOrders.map((ord) => {
                  const s = ORDER_STATUS[ord.status] ?? { label: ord.status, cls: "bg-gray-50 text-gray-600 border-gray-200" };
                  return (
                    <div key={ord.id} className="p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-gray-900">#{ord.order_code}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.cls}`}>
                            {s.label}
                          </span>
                          <span className="text-xs font-bold text-green-800 bg-green-50 px-2 py-0.5 rounded-md">
                            🏪 {ord.umkm_shop_name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Pembeli: <span className="font-medium text-gray-700">{ord.customer?.user?.name ?? "Pelanggan"}</span>
                          {ord.items && ord.items.length > 0 && ` · ${ord.items.map(i => i.product?.name).filter(Boolean).slice(0, 2).join(", ")}${ord.items.length > 2 ? ` (+${ord.items.length - 2} lainnya)` : ""}`}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{fmtDateTime(ord.created_at)}</p>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 shrink-0 text-right">
                        <p className="text-sm font-bold text-gray-900">{rupiah(parseFloat(ord.total))}</p>
                        {parseFloat(ord.bumdes_fee) > 0 && (
                          <p className="text-[11px] text-green-700 font-medium">Fee BUMDes: +{rupiah(parseFloat(ord.bumdes_fee))}</p>
                        )}
                      </div>
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
