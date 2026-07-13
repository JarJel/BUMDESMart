"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { addressApi, AddressData } from "@/lib/api/address";
import { cartApi } from "@/lib/api/cart";
import { checkoutApi } from "@/lib/api/checkout";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const MapPicker = dynamic(() => import("@/components/shared/MapPicker"), { ssr: false });

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

const getAssetUrl = (path: string | undefined) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  try {
    const origin = new URL(apiUrl).origin;
    return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
  } catch {
    return `http://localhost:8000/${path.startsWith("/") ? path.substring(1) : path}`;
  }
};

interface CartItem {
  id: number;
  product?: {
    id: number;
    name: string;
    price: number;
    images?: { image_path: string }[];
    umkm_profile?: { id: number; shop_name?: string; name_umkm?: string };
  };
  variant?: { id: number; name: string; price: number };
  quantity: number;
}

interface TenantGroup {
  tenantId: number | null;
  tenantKey: string;
  tenantName: string;
  items: CartItem[];
}

function groupByTenant(items: CartItem[]): TenantGroup[] {
  const groups: Record<string, TenantGroup> = {};
  items.forEach((item) => {
    const umkm = item.product?.umkm_profile;
    const tenantId = umkm?.id ?? null;
    const tenantName = umkm?.shop_name || umkm?.name_umkm || "Toko";
    const key = tenantId !== null ? String(tenantId) : "unknown";
    if (!groups[key]) groups[key] = { tenantId, tenantKey: key, tenantName, items: [] };
    groups[key].items.push(item);
  });
  return Object.values(groups);
}

const EMPTY_FORM = {
  label: "Rumah",
  recipient_name: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postal_code: "",
  latitude: null as number | null,
  longitude: null as number | null,
  is_default: false,
};

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliveryType, setDeliveryType] = useState<"delivered" | "pickup">("delivered");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteAddrId, setDeleteAddrId] = useState<number | null>(null);
  const [deletingAddr, setDeletingAddr] = useState(false);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Address modal
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [showMap, setShowMap] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cartRes, addressRes] = await Promise.all([cartApi.get(), addressApi.list()]);
      if (cartRes.data?.success) setCartItems(cartRes.data.data.items || []);
      if (addressRes.data?.success) {
        const list: AddressData[] = addressRes.data.data || [];
        setAddresses(list);
        const def = list.find((a) => a.is_default) || list[0];
        if (def?.id) setSelectedAddressId(def.id);
      }
    } catch {
      toast.error("Gagal memuat data checkout.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateQuantity = async (itemId: number, currentQty: number, change: number, stock: number) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;
    if (newQty > stock) {
      toast.warning("Kuantitas melebihi stok yang tersedia.");
      return;
    }
    try {
      const res = await cartApi.update(itemId, newQty);
      if (res.data?.success) {
        fetchData();
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memperbarui kuantitas.");
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      const res = await cartApi.remove(itemId);
      if (res.data?.success) {
        fetchData();
        window.dispatchEvent(new Event("cart-updated"));
        toast.success("Produk dihapus dari pesanan.");
      }
    } catch {
      toast.error("Gagal menghapus produk.");
    }
  };

  // Ambil estimasi ongkir dari BE saat address atau delivery_type berubah
  useEffect(() => {
    if (!selectedAddressId || deliveryType === "pickup") {
      setShippingCost(deliveryType === "pickup" ? 0 : null);
      return;
    }
    setLoadingShipping(true);
    checkoutApi
      .preview({ address_id: selectedAddressId })
      .then((res) => {
        const methods = res.data?.data?.shipping_methods;
        if (methods?.length) {
          const opt = methods[0]?.options?.find((o: any) => o.id === "kurir-lokal");
          setShippingCost(opt?.price ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingShipping(false));
  }, [selectedAddressId, deliveryType]);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setForm(EMPTY_FORM);
    setShowMap(false);
    setShowModal(true);
  };

  const handleOpenEdit = (addr: AddressData) => {
    setEditingAddress(addr);
    setForm({
      label: addr.label || "Rumah",
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      province: addr.province,
      postal_code: addr.postal_code,
      latitude: addr.latitude ?? null,
      longitude: addr.longitude ?? null,
      is_default: !!addr.is_default,
    });
    setShowMap(false);
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
      const res = await addressApi.list();
      if (res.data?.success) {
        const list = res.data.data || [];
        setAddresses(list);
        if (!selectedAddressId && list[0]?.id) setSelectedAddressId(list[0].id);
      }
    } catch {
      toast.error("Gagal menyimpan alamat.");
    }
  };

  const handleDeleteAddress = (id: number) => {
    setDeleteAddrId(id);
  };

  const executeDeleteAddress = async () => {
    if (!deleteAddrId) return;
    setDeletingAddr(true);
    try {
      await addressApi.destroy(deleteAddrId);
      if (selectedAddressId === deleteAddrId) setSelectedAddressId(null);
      const res = await addressApi.list();
      if (res.data?.success) setAddresses(res.data.data || []);
    } catch {
      toast.error("Gagal menghapus alamat.");
    } finally {
      setDeletingAddr(false);
      setDeleteAddrId(null);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await addressApi.setDefault(id);
      const res = await addressApi.list();
      if (res.data?.success) setAddresses(res.data.data || []);
    } catch {}
  };

  const handleSubmit = async () => {
    if (!selectedAddressId) { toast.warning("Pilih alamat pengiriman terlebih dahulu."); return; }
    if (cartItems.length === 0) { toast.warning("Keranjang kosong."); return; }

    setSubmitting(true);
    try {
      const res = await checkoutApi.confirm({
        address_id: selectedAddressId,
        delivery_type: deliveryType,
        notes: notes || undefined,
      });

      if (res.data?.success) {
        const orders: { order_id: number; order_code: string; total: number }[] = res.data.data.orders;
        // Ambil order pertama untuk redirect ke halaman pembayaran
        const firstOrderId = orders[0]?.order_id;
        if (firstOrderId) {
          router.push(`/pembayaran?order_id=${firstOrderId}`);
        } else {
          toast.success("Pesanan berhasil dibuat!");
          router.push("/pesanan");
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gagal membuat pesanan.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#F4F7F5" }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600" />
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
        <p className="text-gray-500 text-sm mb-6">Tambahkan produk desa terlebih dahulu.</p>
        <Link href="/produk" className="inline-block px-6 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: "var(--primary)" }}>
          Belanja Sekarang
        </Link>
      </div>
    );
  }

  const tenantGroups = groupByTenant(cartItems);
  const activeAddress = addresses.find((a) => a.id === selectedAddressId);

  const subtotal = cartItems.reduce((s, item) => {
    const price = item.variant ? Number(item.variant.price) : Number(item.product?.price || 0);
    return s + price * item.quantity;
  }, 0);

  const shippingDisplay = deliveryType === "pickup" ? 0 : (shippingCost ?? 0);
  const grandTotal = subtotal + shippingDisplay;

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
        {/* Kiri */}
        <div className="flex-1 space-y-5">

          {/* 1. Alamat Pengiriman */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>1</span>
                Alamat Pengiriman
              </h2>
              <button onClick={handleOpenAdd} className="text-xs font-semibold text-green-700 hover:text-green-800">
                + Tambah Alamat
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-400 mb-3">Belum ada alamat terdaftar.</p>
                <button onClick={handleOpenAdd} className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-semibold">
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
                      onClick={() => setSelectedAddressId(addr.id!)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? "border-green-600 bg-green-50/30" : "border-gray-100 hover:border-gray-200"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">{addr.label}</span>
                          {addr.is_default && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">Utama</span>}
                          {addr.latitude && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 inline-flex items-center gap-0.5"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Peta</span>}
                        </div>
                        <div className="flex gap-2.5">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(addr); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                          {!addr.is_default && (
                            <button onClick={(e) => { e.stopPropagation(); handleSetDefault(addr.id!); }} className="text-xs text-green-600 hover:text-green-800 font-medium">Set Utama</button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id!); }} className="text-xs text-red-500 hover:text-red-700 font-medium">Hapus</button>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{addr.recipient_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{addr.phone}</p>
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">{addr.address}, {addr.city}, {addr.province} - {addr.postal_code}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 1.5 Daftar Pesanan */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>1.5</span>
              Daftar Pesanan
            </h2>
            <div className="space-y-4">
              {tenantGroups.map((group) => (
                <div key={group.tenantKey} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <p className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10"/>
                    </svg>
                    {group.tenantName}
                  </p>
                  <div className="space-y-3">
                    {group.items.map((item) => {
                      const imgUrl = getAssetUrl(item.product?.images?.[0]?.image_path);
                      const price = item.variant ? Number(item.variant.price) : Number(item.product?.price || 0);
                      const stock = item.variant ? item.variant.stock : (item.product?.stock || 999);
                      return (
                        <div key={item.id} className="flex items-center justify-between gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white border border-gray-100 flex items-center justify-center">
                              {imgUrl ? (
                                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{item.product?.name}</p>
                              {item.variant && <p className="text-[10px] text-gray-400 mt-0.5">Varian: {item.variant.name}</p>}
                              <p className="text-xs font-bold text-green-600 mt-1">{formatRupiah(price)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Qty controls */}
                            <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-2 py-1">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1, stock)}
                                disabled={item.quantity <= 1}
                                className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 cursor-pointer font-bold border-0 bg-transparent"
                              >
                                ➖
                              </button>
                              <span className="text-xs font-semibold text-gray-800 w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1, stock)}
                                disabled={item.quantity >= stock}
                                className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-30 cursor-pointer font-bold border-0 bg-transparent"
                              >
                                ➕
                              </button>
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors border-0 bg-transparent cursor-pointer"
                              title="Hapus"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Metode Pengiriman */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>2</span>
              Metode Pengiriman
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {([
                {
                  id: "delivered" as const, label: "Dikirim Kurir", desc: "Dikirim ke alamat kamu",
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6" />
                    </svg>
                  ),
                },
                {
                  id: "pickup" as const, label: "Ambil Sendiri", desc: "Ambil langsung di toko",
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 22V12h6v10" />
                    </svg>
                  ),
                },
              ]).map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${deliveryType === opt.id ? "border-green-600 bg-green-50/40" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <input type="radio" name="delivery_type" value={opt.id} checked={deliveryType === opt.id} onChange={() => setDeliveryType(opt.id)} className="mt-0.5 accent-green-700" />
                  <div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      {opt.icon}
                      <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Estimasi ongkir */}
            {deliveryType === "delivered" && (
              <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-700 font-medium">
                    {activeAddress?.latitude ? "Ongkir estimasi (berdasarkan jarak)" : "Ongkir estimasi"}
                  </span>
                  <span className="text-sm font-bold text-blue-900">
                    {loadingShipping ? "Menghitung..." : shippingCost !== null ? formatRupiah(shippingCost) : "Pilih alamat dulu"}
                  </span>
                </div>
                {!activeAddress?.latitude && (
                  <p className="text-[10px] text-blue-500 mt-1">
                    Tambahkan pin lokasi di alamat untuk ongkir lebih akurat.
                  </p>
                )}
              </div>
            )}

          </div>

          {/* 3. Catatan */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>3</span>
              Catatan (Opsional)
            </h2>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pesan untuk penjual..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 resize-none"
            />
          </div>
        </div>

        {/* Kanan - Ringkasan */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20">
            <h2 className="font-bold text-gray-900 mb-4">Ringkasan Pesanan</h2>

            <div className="space-y-1 mb-4 text-xs text-gray-500">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="line-clamp-1 flex-1 mr-1">{item.product?.name} ×{item.quantity}</span>
                  <span className="shrink-0">{formatRupiah((item.variant ? Number(item.variant.price) : Number(item.product?.price || 0)) * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Ongkir</span>
                <span>
                  {deliveryType === "pickup" ? "Gratis (Ambil sendiri)" :
                    loadingShipping ? "Menghitung..." :
                    shippingCost !== null ? formatRupiah(shippingCost) : "-"}
                </span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
                <span>Total</span>
                <span style={{ color: "var(--primary)" }}>{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedAddressId}
              className="mt-5 w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
              style={{ background: "var(--primary)" }}
            >
              {submitting ? "Membuat Pesanan..." : "Lanjut ke Pembayaran →"}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">Pembayaran aman via Xendit</p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteAddrId !== null}
        title="Hapus Alamat?"
        description="Alamat yang dihapus tidak dapat dikembalikan."
        confirmLabel="Ya, Hapus"
        loading={deletingAddr}
        onConfirm={executeDeleteAddress}
        onClose={() => setDeleteAddrId(null)}
      />

      {/* Modal Tambah/Edit Alamat */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {editingAddress ? "Ubah Alamat" : "Tambah Alamat Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Label</label>
                  <input type="text" required placeholder="Rumah, Kantor..." value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Penerima</label>
                  <input type="text" required placeholder="Nama lengkap" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">No. Telepon</label>
                <input type="text" required placeholder="08xxxxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Alamat Lengkap</label>
                <textarea required rows={2} placeholder="Nama jalan, RT/RW, nomor rumah" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 resize-none" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Kota</label>
                  <input type="text" required placeholder="Kota/Kab" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Provinsi</label>
                  <input type="text" required placeholder="Provinsi" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Kode Pos</label>
                  <input type="text" required placeholder="Kode Pos" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600" />
                </div>
              </div>

              {/* Pin Lokasi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-500">
                    Pin Lokasi
                    <span className="ml-1 text-gray-400 font-normal">(opsional, untuk akurasi ongkir)</span>
                  </label>
                  <button type="button" onClick={() => setShowMap(!showMap)}
                    className="text-xs font-semibold text-green-700 hover:text-green-800">
                    <span className="inline-flex items-center gap-1">
                      {showMap ? (
                        <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg> Sembunyikan Peta</>
                      ) : form.latitude ? (
                        <><svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Ubah Lokasi</>
                      ) : (
                        <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Atur Lokasi</>
                      )}
                    </span>
                  </button>
                </div>
                {form.latitude && !showMap && (
                  <p className="text-xs text-green-600 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Koordinat tersimpan ({form.latitude?.toFixed(5)}, {form.longitude?.toFixed(5)})</p>
                )}
                {showMap && (
                  <MapPicker
                    defaultLat={form.latitude}
                    defaultLng={form.longitude}
                    onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
                    height="220px"
                  />
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} className="accent-green-700" />
                <span className="text-xs text-gray-600">Jadikan alamat utama</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
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
