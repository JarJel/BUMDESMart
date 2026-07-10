"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addressApi, AddressData } from "@/lib/api/address";
import { cartApi, CartItemData } from "@/lib/api/cart";
import { useToast } from "@/components/ui/Toast";

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const getAssetUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  try {
    const origin = new URL(apiUrl).origin;
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
  } catch (e) {
    return `http://localhost:8000/${path.startsWith('/') ? path.substring(1) : path}`;
  }
};

const slugify = (text: string | undefined) => {
  if (!text) return 'toko';
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

const ekspedisi = [
  { id: "jne-reg", nama: "JNE Regular", estimasi: "2-3 hari", harga: 12000 },
  { id: "jnt-reg", nama: "J&T Express", estimasi: "2-3 hari", harga: 11000 },
  { id: "sicepat", nama: "SiCepat REG", estimasi: "1-2 hari", harga: 14000 },
  { id: "pickup", nama: "Ambil Sendiri", estimasi: "Hari ini", harga: 0 },
];

// Kelompokkan item cart berdasarkan tenant (umkm_profile)
interface TenantGroup {
  tenantId: number | null;
  tenantKey: string;
  tenantName: string;
  storeSlug: string;
  items: CartItemData[];
}

function groupByTenant(items: CartItemData[]): TenantGroup[] {
  const groups: Record<string, TenantGroup> = {};

  items.forEach((item) => {
    const tenantId = item.product?.umkm_profile?.id ?? null;
    const tenantName = item.product?.umkm_profile?.shop_name || item.product?.umkm_profile?.name_umkm || "Toko";
    const key = tenantId !== null ? String(tenantId) : "unknown";

    if (!groups[key]) {
      groups[key] = {
        tenantId,
        tenantKey: key,
        tenantName,
        storeSlug: slugify(tenantName),
        items: [],
      };
    }
    groups[key].items.push(item);
  });

  return Object.values(groups);
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // Kurir per tenant: { [tenantKey]: ekspedisiId }
  const [kurirPerTenant, setKurirPerTenant] = useState<Record<string, string>>({});
  const [bayar, setBayar] = useState("qris");
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Address Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [form, setForm] = useState({
    label: "",
    recipient_name: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    is_default: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Cart
      const cartRes = await cartApi.get();
      if (cartRes.data && cartRes.data.success) {
        const items: CartItemData[] = cartRes.data.data.items || [];
        setCartItems(items);

        // Inisialisasi kurir default (jne-reg) untuk setiap tenant
        const groups = groupByTenant(items);
        const defaultKurir: Record<string, string> = {};
        groups.forEach((g) => {
          defaultKurir[g.tenantKey] = "jne-reg";
        });
        setKurirPerTenant(defaultKurir);
      }

      // Fetch Addresses
      const addressRes = await addressApi.list();
      if (addressRes.data && addressRes.data.success) {
        const addrList = addressRes.data.data || [];
        setAddresses(addrList);
        const defaultAddr = addrList.find((a: any) => a.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id || null);
        } else if (addrList.length > 0) {
          setSelectedAddressId(addrList[0].id || null);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data checkout:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setForm({
      label: "Rumah",
      recipient_name: "",
      phone: "",
      address: "",
      city: "",
      province: "",
      postal_code: "",
      is_default: false,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (addr: AddressData) => {
    setEditingAddress(addr);
    setForm({
      label: addr.label || "Utama",
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      province: addr.province,
      postal_code: addr.postal_code,
      is_default: !!addr.is_default,
    });
    setShowModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress?.id) {
        await addressApi.update(editingAddress.id, form);
      } else {
        await addressApi.store(form);
      }
      setShowModal(false);
      const addressRes = await addressApi.list();
      if (addressRes.data && addressRes.data.success) {
        const addrList = addressRes.data.data || [];
        setAddresses(addrList);
        if (!selectedAddressId && addrList.length > 0) {
          setSelectedAddressId(addrList[0].id || null);
        }
      }
    } catch (err) {
      console.error("Gagal menyimpan alamat:", err);
      toast.error("Gagal menyimpan alamat. Harap periksa input Anda.");
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus alamat ini?")) return;
    try {
      await addressApi.destroy(id);
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
      const addressRes = await addressApi.list();
      if (addressRes.data && addressRes.data.success) {
        const addrList = addressRes.data.data || [];
        setAddresses(addrList);
        if (addrList.length > 0) {
          setSelectedAddressId(addrList[0].id || null);
        }
      }
    } catch (err) {
      console.error("Gagal menghapus alamat:", err);
    }
  };

  const handleSelectDefault = async (id: number) => {
    try {
      await addressApi.setDefault(id);
      const addressRes = await addressApi.list();
      if (addressRes.data && addressRes.data.success) {
        setAddresses(addressRes.data.data || []);
      }
    } catch (err) {
      console.error("Gagal menetapkan alamat utama:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#F4F7F5" }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Keranjang Belanja Kosong</h2>
        <p className="text-gray-500 text-sm mb-6">Silakan tambahkan produk desa terlebih dahulu sebelum melakukan checkout.</p>
        <Link href="/produk" className="inline-block px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90" style={{ background: "var(--primary)" }}>
          Belanja Sekarang
        </Link>
      </div>
    );
  }

  const tenantGroups = groupByTenant(cartItems);
  const activeAddress = addresses.find((a) => a.id === selectedAddressId);

  // Hitung subtotal dan ongkir per tenant
  const tenantSummaries = tenantGroups.map((group) => {
    const kurirId = kurirPerTenant[group.tenantKey] || "jne-reg";
    const selectedKurir = ekspedisi.find((e) => e.id === kurirId) || ekspedisi[0];
    const subtotal = group.items.reduce((s, item) => {
      const price = item.variant ? Number(item.variant.price) : Number(item.product?.price || 0);
      return s + price * item.quantity;
    }, 0);
    const totalQty = group.items.reduce((s, i) => s + i.quantity, 0);
    return { ...group, subtotal, selectedKurir, totalQty };
  });

  const grandSubtotal = tenantSummaries.reduce((s, t) => s + t.subtotal, 0);
  const grandOngkir = tenantSummaries.reduce((s, t) => s + t.selectedKurir.harga, 0);
  const grandTotal = grandSubtotal + grandOngkir;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/keranjang" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form Kiri */}
        <div className="flex-1 space-y-5">

          {/* 1. Alamat Pengiriman */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>1</span>
                Alamat Pengiriman
              </h2>
              <button
                onClick={handleOpenAddModal}
                className="text-xs font-semibold text-green-700 hover:text-green-800 cursor-pointer flex items-center gap-1"
              >
                + Tambah Alamat Baru
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-400 mb-3">Belum ada alamat pengiriman terdaftar.</p>
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100 cursor-pointer"
                >
                  Tambah Alamat
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id || null)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${isSelected
                        ? "border-green-600 bg-green-50/30"
                        : "border-gray-100 hover:border-gray-200 bg-white"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            {addr.label}
                          </span>
                          {addr.is_default && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                              Utama
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2.5 z-10">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(addr); }}
                            className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
                          >
                            Edit
                          </button>
                          {!addr.is_default && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSelectDefault(addr.id!); }}
                              className="text-xs text-green-600 hover:text-green-800 cursor-pointer font-medium"
                            >
                              Set Utama
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id!); }}
                            className="text-xs text-red-500 hover:text-red-700 cursor-pointer font-medium"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{addr.recipient_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{addr.phone}</p>
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                        {addr.address}, {addr.city}, {addr.province} - {addr.postal_code}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Metode Pengiriman — Per Tenant */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>2</span>
              Metode Pengiriman
            </h2>

            <div className="space-y-5">
              {tenantGroups.map((group) => {
                const kurirId = kurirPerTenant[group.tenantKey] || "jne-reg";
                const groupQty = group.items.reduce((s, i) => s + i.quantity, 0);

                return (
                  <div key={group.tenantKey}>
                    {/* Header Toko */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--primary)" }}>
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{group.tenantName}</span>
                      <span className="text-xs text-gray-400">({groupQty} item)</span>
                    </div>

                    {/* Daftar produk mini per toko */}
                    <div className="ml-7 mb-3 space-y-1">
                      {group.items.map((item) => {
                        const imagePath = item.product?.images?.[0]?.image_path;
                        const imageUrl = getAssetUrl(imagePath);
                        return (
                          <div key={item.id} className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                              {imageUrl ? (
                                <img src={imageUrl} alt={item.product?.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-600 line-clamp-1">{item.product?.name} ×{item.quantity}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pilihan Ekspedisi per Toko */}
                    <div className="ml-7 space-y-1.5">
                      {ekspedisi.map((e) => (
                        <label
                          key={e.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${kurirId === e.id ? "border-green-500 bg-green-50" : "border-gray-100 hover:border-gray-200"}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`kurir-${group.tenantKey}`}
                              value={e.id}
                              checked={kurirId === e.id}
                              onChange={() => setKurirPerTenant((prev) => ({ ...prev, [group.tenantKey]: e.id }))}
                              className="accent-green-700"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{e.nama}</p>
                              <p className="text-xs text-gray-500">Estimasi {e.estimasi}</p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                            {e.harga === 0 ? "Gratis" : formatRupiah(e.harga)}
                          </p>
                        </label>
                      ))}
                    </div>

                    {/* Separator antar tenant */}
                    {tenantGroups.indexOf(group) < tenantGroups.length - 1 && (
                      <div className="mt-5 border-t border-dashed border-gray-200" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ringkasan Kanan */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20">
            <h2 className="font-bold text-gray-900 mb-4">Ringkasan</h2>
            <div className="space-y-3 mb-4">

              {/* Ringkasan per Tenant */}
              {tenantSummaries.map((t) => (
                <div key={t.tenantKey} className="space-y-1">
                  <p className="text-xs font-semibold text-gray-700 truncate">🏪 {t.tenantName}</p>
                  {t.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs text-gray-500 ml-3">
                      <span className="line-clamp-1 flex-1 mr-1">{item.product?.name} ×{item.quantity}</span>
                      <span className="shrink-0">
                        {formatRupiah((item.variant ? Number(item.variant.price) : Number(item.product?.price || 0)) * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-gray-500 ml-3">
                    <span>Ongkir ({t.selectedKurir.nama})</span>
                    <span>{t.selectedKurir.harga === 0 ? "Gratis" : formatRupiah(t.selectedKurir.harga)}</span>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="border-t border-gray-100 pt-2 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Total Subtotal</span>
                  <span>{formatRupiah(grandSubtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Total Ongkir ({tenantGroups.length} toko)</span>
                  <span>{grandOngkir === 0 ? "Gratis" : formatRupiah(grandOngkir)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-gray-900 pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span style={{ color: "var(--primary)" }}>{formatRupiah(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Metode Pembayaran */}
            <div className="border-t border-gray-100 pt-4 mb-4">
              <h3 className="font-bold text-xs text-gray-900 mb-2.5">Metode Pembayaran</h3>
              <div className="space-y-1.5">
                {[
                  { id: "qris", label: "QRIS", desc: "Scan QR e-wallet & m-banking" },
                  { id: "transfer", label: "Transfer Bank", desc: "BCA, BRI, BNI, Mandiri, BJB" },
                  { id: "ewallet", label: "E-Wallet", desc: "GoPay, OVO, Dana, ShopeePay" },
                ].map((m) => (
                  <label key={m.id} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${bayar === m.id ? "border-green-500 bg-green-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <input type="radio" name="bayar" value={m.id} checked={bayar === m.id} onChange={() => setBayar(m.id)} className="accent-green-700 w-3.5 h-3.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 leading-tight">{m.label}</p>
                      <p className="text-[10px] text-gray-500 leading-normal truncate">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Link
              href={activeAddress ? `/pembayaran?address_id=${selectedAddressId}&kurir=${JSON.stringify(kurirPerTenant)}&payment=${bayar}` : "#"}
              className={`block w-full text-center py-3 rounded-xl text-sm font-bold text-white transition-all ${activeAddress ? "hover:opacity-90 cursor-pointer" : "opacity-50 cursor-not-allowed"
                }`}
              style={{ background: "var(--primary)" }}
              onClick={(e) => {
                if (!activeAddress) {
                  e.preventDefault();
                  toast.warning("Harap pilih alamat pengiriman terlebih dahulu.");
                }
              }}
            >
              Bayar Sekarang →
            </Link>
            <p className="text-xs text-gray-400 text-center mt-2">Pembayaran aman & terenkripsi</p>
          </div>
        </div>
      </div>

      {/* Modal Tambah/Edit Alamat */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-gray-900 mb-4">
              {editingAddress ? "Ubah Alamat Pengiriman" : "Tambah Alamat Baru"}
            </h3>

            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Label Alamat</label>
                  <input
                    type="text"
                    required
                    placeholder="Rumah, Kantor, dll"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Penerima</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap"
                    value={form.recipient_name}
                    onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">No. Telepon</label>
                <input
                  type="text"
                  required
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Alamat Lengkap</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Nama jalan, RT/RW, nomor rumah"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Kota</label>
                  <input
                    type="text"
                    required
                    placeholder="Kota/Kab"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Provinsi</label>
                  <input
                    type="text"
                    required
                    placeholder="Provinsi"
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    required
                    placeholder="Kode Pos"
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                  className="accent-green-700"
                />
                <span className="text-xs text-gray-600">Jadikan alamat utama</span>
              </label>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                  style={{ background: "var(--primary)" }}
                >
                  Simpan Alamat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
