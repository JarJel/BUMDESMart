import Link from "next/link";
import { dummyOrders, statusColor } from "@/lib/data/orders";
import { notFound } from "next/navigation";

function formatRupiah(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

const statusSteps = ["Menunggu Pembayaran", "Pesanan Diproses", "Dikirim", "Selesai"];
const statusIndex: Record<string, number> = { pending: 0, processing: 1, shipped: 2, delivered: 3 };

export function generateStaticParams() {
  return dummyOrders.map((o) => ({ id: o.id }));
}

export default async function DetailPesananPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = dummyOrders.find((o) => o.id === id);
  if (!order) notFound();

  const sc = statusColor[order.status] || { bg: "#F3F4F6", text: "#6B7280" };
  const stepIdx = statusIndex[order.status] ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pesanan" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Detail Pesanan</h1>
          <p className="text-xs text-gray-500">{order.id}</p>
        </div>
        <span className="ml-auto text-xs font-semibold px-3 py-1 rounded-full" style={{ background: sc.bg, color: sc.text }}>
          {order.statusLabel}
        </span>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <p className="text-sm font-semibold text-gray-800 mb-4">Status Pesanan</p>
        <div className="flex items-start gap-0">
          {statusSteps.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center relative">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all ${i <= stepIdx ? "text-white" : "bg-gray-100 text-gray-400"}`}
                style={i <= stepIdx ? { background: "var(--primary)" } : {}}>
                {i < stepIdx ? "✓" : i + 1}
              </div>
              {i < statusSteps.length - 1 && (
                <div className={`absolute top-3.5 left-1/2 w-full h-0.5 ${i < stepIdx ? "" : "bg-gray-100"}`}
                  style={i < stepIdx ? { background: "var(--primary)" } : {}} />
              )}
              <p className={`text-center text-xs mt-2 leading-tight ${i === stepIdx ? "font-semibold" : "text-gray-400"}`}
                style={i === stepIdx ? { color: "var(--primary)" } : {}}>
                {s}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Info pengiriman */}
      {order.noResi && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">Info Pengiriman</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Ekspedisi</span><span className="font-medium">{order.ekspedisi}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">No. Resi</span>
              <span className="font-mono font-medium" style={{ color: "var(--primary)" }}>{order.noResi}</span>
            </div>
          </div>
        </div>
      )}

      {/* Detail produk */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <p className="text-sm font-semibold text-gray-800 mb-3">Detail Produk</p>
        <div className="flex gap-3 items-center mb-3">
          <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shrink-0" style={{ background: "var(--surface)" }}>🛍️</div>
          <div className="flex-1">
            <Link href={`/${order.tokoSlug}`} className="text-xs text-gray-500 hover:underline">{order.toko}</Link>
            <p className="text-sm font-semibold text-gray-900">{order.produk}</p>
            <p className="text-xs text-gray-500">{order.qty} item</p>
          </div>
          <p className="text-sm font-bold shrink-0" style={{ color: "var(--primary)" }}>{formatRupiah(order.total)}</p>
        </div>
      </div>

      {/* Ringkasan biaya */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <p className="text-sm font-semibold text-gray-800 mb-3">Ringkasan Biaya</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatRupiah(order.total - 12000)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Ongkir</span><span>Rp 12.000</span></div>
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2">
            <span>Total Bayar</span>
            <span style={{ color: "var(--primary)" }}>{formatRupiah(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {order.status === "delivered" && (
          <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
            Beri Ulasan
          </button>
        )}
        {order.status === "pending" && (
          <Link href="/pembayaran" className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
            Bayar Sekarang
          </Link>
        )}
        <button className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
          Hubungi Penjual
        </button>
      </div>
    </div>
  );
}
