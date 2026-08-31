"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { addressApi, AddressData } from "@/lib/api/address";
import { cartApi } from "@/lib/api/cart";
import { checkoutApi } from "@/lib/api/checkout";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { getFileUrl } from "@/lib/storage";

const MapPicker = dynamic(() => import("@/components/shared/MapPicker"), { ssr: false });

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

interface CartItem {
  id: number;
  product?: {
    id: number;
    name: string;
    price: number | string;
    stock?: number;
    images?: { image_path?: string; file_path?: string }[];
    umkm_profile?: {
      id: number;
      shop_name?: string;
      name_umkm?: string;
      qris_image?: string | null;
      bank_accounts?: { id: number; channel_code: string; account_number: string; account_name: string }[];
    };
    active_discount?: {
      id: number;
      type: 'percentage' | 'fixed';
      value: string | number;
    } | null;
  };
  variant?: {
    id: number;
    name?: string;
    value?: string;
    price: number | string;
    stock: number;
    product_variant?: { id: number; name: string; product_id: number } | null;
  } | null;
  quantity: number;
}

interface TenantGroup {
  tenantId: number | null;
  tenantKey: string;
  tenantName: string;
  items: CartItem[];
}

interface VoucherProgram {
  id: number;
  label: string;
  trigger_type: string;
  trigger_value: number;
  reward_type: 'flat' | 'percentage' | 'free_shipping';
  reward_value: number;
  is_eligible: boolean;
  already_used: boolean;
  discount_amount: number;
  progress: { current: number; required: number; met: boolean };
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

const getProductPrice = (item: CartItem) => {
  if (item.variant) {
    return Number(item.variant.price);
  }
  const basePrice = Number(item.product?.price || 0);
  const discount = item.product?.active_discount;
  if (discount) {
    const val = Number(discount.value);
    if (discount.type === 'percentage') {
      return Math.round(basePrice * (1 - val / 100));
    }
    return Math.max(0, basePrice - val);
  }
  return basePrice;
};

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, loading: authLoading } = useAuth();

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
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>("");
  const selectedShippingIdRef = useRef<string>("");
  const [showAllShipping, setShowAllShipping] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"midtrans" | "manual_umkm">("midtrans");
  const [updatingQtyId, setUpdatingQtyId] = useState<number | null>(null);

  // Address modal
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [showMap, setShowMap] = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [cartRes, addressRes] = await Promise.all([cartApi.get(), addressApi.list()]);
      if (cartRes.data?.success) setCartItems(cartRes.data.data.items || []);
      if (addressRes.data?.success) {
        const list: AddressData[] = addressRes.data.data || [];
        setAddresses(list);
        const def = list.find((a) => a.is_default) || list[0];
        if (def?.id && !selectedAddressId) setSelectedAddressId(def.id);
      }
    } catch {
      toast.error("Gagal memuat data checkout.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/checkout");
    }
  }, [authLoading, user, router]);

  useEffect(() => { fetchData(); }, []);

  const handleUpdateQuantity = async (itemId: number, currentQty: number, change: number, stock: number) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;
    if (newQty > stock) {
      toast.warning("Kuantitas melebihi stok yang tersedia.");
      return;
    }

    setUpdatingQtyId(itemId);
    // Optimistic update
    setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQty } : item));

    try {
      const res = await cartApi.update(itemId, newQty);
      if (res.data?.success) {
        await fetchData(true);
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (err: any) {
      // Rollback on error
      setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: currentQty } : item));
      toast.error(err.response?.data?.message || "Gagal memperbarui kuantitas.");
    } finally {
      setUpdatingQtyId(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    setDeletingItem(true);
    try {
      const res = await cartApi.remove(itemId);
      if (res.data?.success) {
        fetchData();
        window.dispatchEvent(new Event("cart-updated"));
        toast.success("Produk dihapus dari pesanan.");
      }
    } catch {
      toast.error("Gagal menghapus produk.");
    } finally {
      setDeletingItem(false);
    }
  };

  // State Voucher (sistem baru tanpa kode — auto tampil seperti Shopee)
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<Record<number, VoucherProgram[]>>({});
  const [selectedVouchers, setSelectedVouchers] = useState<Record<number, number>>({}); // umkm_id → voucher_program_id
  const [loadingVouchers, setLoadingVouchers] = useState<Record<number, boolean>>({});

  const loadCheckoutPreview = useCallback(async (addressId: number | null, delType: string) => {
    if (!addressId) return;
    setLoadingPreview(true);
    try {
      const params: any = {
        address_id: addressId,
        delivery_type: delType,
      };

      const res = await checkoutApi.preview(params);
      if (res.data?.success) {
        setPreviewData(res.data.data);
        const methods = res.data.data.shipping_methods;
        if (methods?.length) {
          const opts = (methods[0]?.options ?? []).filter((o: any) => o.type !== "pickup");
          setShippingOptions(opts);
          
          // Cek apakah opsi yang sedang dipilih user masih ada di daftar opsi terbaru
          const currentChoice = selectedShippingIdRef.current;
          const matchingOpt = opts.find((o: any) => o.id === currentChoice);

          if (matchingOpt) {
            // Tetap gunakan opsi pilihan user dan perbarui harganya jika ada perubahan
            setSelectedShippingId(matchingOpt.id);
            selectedShippingIdRef.current = matchingOpt.id;
            setShippingCost(matchingOpt.price ?? null);
          } else {
            // Jika belum ada pilihan atau pilihan sebelumnya tidak valid lagi, pakai opsi pertama (default)
            const defaultOpt = opts[0];
            const chosenId = defaultOpt?.id ?? "kurir-lokal-motor";
            setSelectedShippingId(chosenId);
            selectedShippingIdRef.current = chosenId;
            setShippingCost(defaultOpt?.price ?? null);
          }
        } else {
          setShippingOptions([]);
          setShippingCost(null);
        }
      }
    } catch (err) {
      console.error("Gagal memuat preview checkout:", err);
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  // Fetch voucher tersedia per toko
  const fetchVouchersForTenant = useCallback(async (umkmId: number, itemCount: number, orderAmount: number) => {
    setLoadingVouchers(prev => ({ ...prev, [umkmId]: true }));
    try {
      const res = await import("@/lib/api/axios").then(m => m.default.get(
        `/checkout/vouchers?umkm_profile_id=${umkmId}&item_count=${itemCount}&order_amount=${orderAmount}`
      ));
      setAvailableVouchers(prev => ({ ...prev, [umkmId]: res.data?.data ?? [] }));
    } catch {
      // silent fail
    } finally {
      setLoadingVouchers(prev => ({ ...prev, [umkmId]: false }));
    }
  }, []);

  // Pemicu preview saat data alamat, metode pengiriman, atau isi keranjang berubah
  useEffect(() => {
    if (selectedAddressId) {
      loadCheckoutPreview(selectedAddressId, deliveryType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressId, deliveryType, cartItems]);

  // Fetch voucher saat cart items berubah
  useEffect(() => {
    const groups = groupByTenant(cartItems);
    groups.forEach(g => {
      if (g.tenantId) {
        const itemCount = g.items.reduce((s, i) => s + i.quantity, 0);
        const orderAmount = g.items.reduce((s, i) => s + getProductPrice(i) * i.quantity, 0);
        fetchVouchersForTenant(g.tenantId, itemCount, orderAmount);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  // Cek apakah UMKM memiliki QRIS atau rekening bank aktif
  const hasDirectPaymentSupport = (() => {
    const apiTenants = previewData?.tenants || [];
    if (apiTenants.length > 0) {
      return apiTenants.some((t: any) => Boolean(t.qris_image || (t.bank_accounts && t.bank_accounts.length > 0)));
    }
    return cartItems.some((item) => {
      const umkm = item.product?.umkm_profile;
      return Boolean(umkm?.qris_image || (umkm?.bank_accounts && umkm.bank_accounts.length > 0));
    });
  })();

  useEffect(() => {
    if (!hasDirectPaymentSupport && paymentMethod === "manual_umkm") {
      setPaymentMethod("midtrans");
    }
  }, [hasDirectPaymentSupport, paymentMethod]);

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
    if (deliveryType === "delivered" && !selectedAddressId) {
      toast.warning("Pilih alamat pengiriman terlebih dahulu.");
      return;
    }
    if (cartItems.length === 0) { toast.warning("Keranjang kosong."); return; }

    setSubmitting(true);
    try {
      const payload: any = {
        address_id: deliveryType === 'delivered' ? selectedAddressId : undefined,
        delivery_type: deliveryType,
        vehicle_type: undefined,
        notes: notes || undefined,
        payment_type: paymentMethod,
        shipping_method_id: deliveryType === 'delivered' ? selectedShippingId : undefined,
        shipping_cost_override: (deliveryType === 'delivered' && selectedShippingId && !selectedShippingId.startsWith('kurir-lokal') && shippingCost !== null)
          ? shippingCost : undefined,
      };
      // Sertakan voucher yang dipilih per toko (format: { umkm_id: voucher_program_id })
      if (Object.keys(selectedVouchers).length > 0) {
        payload.voucher_program_ids = selectedVouchers;
      }

      const res = await checkoutApi.confirm(payload);

      if (res.data?.success) {
        const orders: { order_id: number; order_code: string; total: number }[] = res.data.data.orders;
        const firstOrderId = orders[0]?.order_id;
        if (firstOrderId) {
          if (paymentMethod === "manual_umkm") {
            toast.success("Pesanan berhasil dibuat! Silakan transfer ke toko dan unggah bukti.");
            router.push(`/pesanan/${firstOrderId}`);
          } else {
            router.push(`/pembayaran?order_id=${firstOrderId}`);
          }
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

  // Hitung total diskon dari voucher yang dipilih
  const voucherDiscount = Object.entries(selectedVouchers).reduce((total, [umkmId, voucherId]) => {
    const vouchers = availableVouchers[Number(umkmId)] ?? [];
    const v = vouchers.find(vv => vv.id === voucherId);
    return total + (v?.discount_amount ?? 0);
  }, 0);

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
    return s + getProductPrice(item) * item.quantity;
  }, 0);

  const shippingDisplay = deliveryType === "pickup" ? 0 : (shippingCost ?? 0);
  
  // Hitung values berdasarkan data dari API preview (tanpa promo kode lagi)
  const apiTenants     = previewData?.tenants || [];
  const apiSubtotal    = apiTenants.reduce((s: number, t: any) => s + (Number(t.sub_total)   || 0), 0);
  const apiServiceFee  = apiTenants.reduce((s: number, t: any) => s + (Number(t.service_fee) || 0), 0);

  const finalSubtotal  = apiTenants.length > 0 ? apiSubtotal : subtotal;
  const grandTotal     = finalSubtotal - voucherDiscount + shippingDisplay + apiServiceFee;

  if (authLoading || !user) return null;

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
                      const imgUrl = getFileUrl(item.product?.images?.[0]?.file_path) ?? "";
                      const price = getProductPrice(item);
                      const originalPrice = item.variant ? Number(item.variant.price) : Number(item.product?.price || 0);
                      const hasDiscount = !item.variant && !!item.product?.active_discount;
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
                              {item.variant && (
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {item.variant.product_variant?.name
                                    ? `${item.variant.product_variant.name}: ${item.variant.value}`
                                    : (item.variant.value || item.variant.name)}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <p className="text-xs font-bold text-green-600">{formatRupiah(price)}</p>
                                {hasDiscount && (
                                  <p className="text-[10px] text-gray-400 line-through">{formatRupiah(originalPrice)}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Qty controls */}
                            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1, stock)}
                                disabled={item.quantity <= 1 || updatingQtyId === item.id}
                                aria-label="Kurangi kuantitas"
                                className="w-7 h-7 flex items-center justify-center text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent rounded-md cursor-pointer border-0 bg-transparent transition-all"
                              >
                                −
                              </button>
                              <div className="w-8 flex items-center justify-center">
                                {updatingQtyId === item.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <span className="text-xs font-bold text-gray-800 select-none">{item.quantity}</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1, stock)}
                                disabled={item.quantity >= stock || updatingQtyId === item.id}
                                aria-label="Tambah kuantitas"
                                className="w-7 h-7 flex items-center justify-center text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent rounded-md cursor-pointer border-0 bg-transparent transition-all"
                              >
                                +
                              </button>
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={() => setConfirmRemoveId(item.id)}
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

                  {/* Voucher Toko — Auto tampil seperti Shopee */}
                  {group.tenantId && (() => {
                    const vouchers = availableVouchers[group.tenantId] ?? [];
                    const isLoadingV = loadingVouchers[group.tenantId];
                    const selectedVId = selectedVouchers[group.tenantId];
                    if (isLoadingV) return (
                      <div className="mt-4 pt-3 border-t border-dashed border-gray-100">
                        <p className="text-[11px] text-gray-400 animate-pulse">Memuat voucher...</p>
                      </div>
                    );
                    if (vouchers.length === 0) return null;
                    return (
                      <div className="mt-4 pt-3 border-t border-dashed border-gray-100 space-y-2">
                        <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                          <i className="ti ti-ticket" /> Voucher Toko
                        </p>
                        {vouchers.map((v) => {
                          const isSelected = selectedVId === v.id;
                          if (v.already_used) {
                            return (
                              <div key={v.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 opacity-50">
                                <span className="text-xs text-gray-500 line-through">{v.label}</span>
                                <span className="text-[10px] font-semibold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Sudah dipakai</span>
                              </div>
                            );
                          }
                          if (v.is_eligible) {
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    const next = { ...selectedVouchers };
                                    delete next[group.tenantId!];
                                    setSelectedVouchers(next);
                                  } else {
                                    setSelectedVouchers({ ...selectedVouchers, [group.tenantId!]: v.id });
                                  }
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                                  isSelected
                                    ? "border-green-500 bg-green-50"
                                    : "border-green-200 bg-white hover:border-green-400"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <i className="ti ti-ticket text-green-600" />
                                  <span className="text-xs font-semibold text-green-700">{v.label}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs font-bold text-green-700">-{formatRupiah(v.discount_amount)}</span>
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                                    {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                  </div>
                                </div>
                              </button>
                            );
                          }
                          // Belum eligible - tampilkan progress
                          const pct = Math.min(100, Math.round((v.progress.current / v.progress.required) * 100));
                          return (
                            <div key={v.id} className="px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-gray-500">{v.label}</span>
                                <span className="text-[10px] text-gray-400">{v.progress.current}/{v.progress.required}</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {v.trigger_type === "item_count" && `Tambah ${v.progress.required - v.progress.current} item lagi`}
                                {v.trigger_type === "order_amount" && `Belanja ${formatRupiah(v.progress.required - v.progress.current)} lagi`}
                                {v.trigger_type === "order_frequency" && `${v.progress.required - v.progress.current}x lagi beli di toko ini`}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
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

            {/* Pilihan metode pengiriman */}
            {deliveryType === "delivered" && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pilih Pengiriman</p>
                {loadingPreview ? (
                  <div className="space-y-2.5">
                    {/* Skeleton Loading Card 1 */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-gray-200" />
                        <div className="w-8 h-8 rounded-lg bg-gray-200" />
                        <div className="space-y-1.5">
                          <div className="w-28 h-3.5 bg-gray-200 rounded" />
                          <div className="w-20 h-2.5 bg-gray-200 rounded" />
                        </div>
                      </div>
                      <div className="w-16 h-4 bg-gray-200 rounded" />
                    </div>

                    {/* Skeleton Loading Card 2 */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-gray-200" />
                        <div className="w-8 h-8 rounded-lg bg-gray-200" />
                        <div className="space-y-1.5">
                          <div className="w-32 h-3.5 bg-gray-200 rounded" />
                          <div className="w-24 h-2.5 bg-gray-200 rounded" />
                        </div>
                      </div>
                      <div className="w-14 h-4 bg-gray-200 rounded" />
                    </div>

                    <div className="flex items-center justify-center gap-2 py-1 text-xs text-gray-400">
                      <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                      <span>Sedang menghitung tarif kurir & ongkir terbaik...</span>
                    </div>
                  </div>
                ) : shippingOptions.length === 0 ? (
                  <div className="text-xs text-gray-400 py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                    Pilih alamat dulu untuk melihat opsi pengiriman
                  </div>
                ) : (() => {
                  const logoMap: Record<string, string> = {
                    "gosend": "/couriers/gosend.svg",
                    "grabexpress": "/couriers/grab.svg",
                    "lalamove": "/couriers/lalamove.svg",
                    "sicepat-reg": "/couriers/sicepat.svg",
                    "jnt-ez": "/couriers/jnt.svg",
                    "anteraja-reg": "/couriers/anteraja.svg",
                    "ninja-xpress": "/couriers/ninja.svg",
                  };
                  const extraLogoMap: Record<string, string> = {
                    "jne": "/couriers/jne.svg",
                    "tiki": "/couriers/tiki.svg",
                    "pos": "/couriers/pos.svg",
                  };
                  const getLogo = (opt: any) => {
                    const idKey = opt.id.startsWith("ekspedisi-jne") ? "jne"
                      : opt.id.startsWith("ekspedisi-tiki") ? "tiki"
                      : opt.id.startsWith("ekspedisi-pos") ? "pos"
                      : opt.id;
                    return logoMap[opt.id] ?? extraLogoMap[idKey] ?? null;
                  };

                  const sorted = [...shippingOptions].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
                  const cheapest = sorted[0];
                  const rest = sorted.slice(1);

                  const renderOption = (opt: any) => {
                    const logo = getLogo(opt);
                    const isLokal = opt.type === "lokal";
                    return (
                      <label key={opt.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${selectedShippingId === opt.id ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping_courier_selection"
                            value={opt.id}
                            checked={selectedShippingId === opt.id}
                            onChange={() => {
                              setSelectedShippingId(opt.id);
                              selectedShippingIdRef.current = opt.id;
                              setShippingCost(opt.price);
                            }}
                            className="accent-orange-500"
                          />
                          {logo ? (
                            <img src={logo} alt={opt.name} className="h-7 w-20 object-contain rounded" />
                          ) : isLokal && opt.vehicle === 'mobil' ? (
                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-orange-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 17H3v-5l2-5h14l2 5v5h-2"/>
                              <circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>
                              <path d="M5 17h3m8 0h-3M6 12h12"/>
                            </svg>
                          ) : isLokal ? (
                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-orange-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/>
                              <path d="M8 17.5h7M15 17.5l-1-5h-3l-2-4H7l-1.5 2.5M15 12.5l2-3h2l1 3-2 2.5"/>
                              <path d="M12 7.5h3"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="1.5"/><circle cx="18.5" cy="18.5" r="1.5"/>
                            </svg>
                          )}
                          <div>
                            {isLokal && <p className="text-sm font-semibold text-gray-800">{opt.name}</p>}
                            <p className="text-xs text-gray-500">{opt.estimation}{opt.distance_km ? ` · ${opt.distance_km} km` : ""}</p>
                            {opt.note && <p className="text-[10px] text-orange-500">{opt.note}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-800">{opt.price !== null ? formatRupiah(opt.price) : "Cek app"}</span>
                          {opt.price === cheapest.price && rest.length > 0 && (
                            <p className="text-[10px] text-green-600 font-semibold">Termurah</p>
                          )}
                        </div>
                      </label>
                    );
                  };

                  return (
                    <>
                      {renderOption(cheapest)}
                      {rest.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowAllShipping(!showAllShipping)}
                            className="w-full flex items-center justify-center gap-1 text-xs text-orange-600 font-semibold py-2 hover:text-orange-700 transition-colors"
                          >
                            {showAllShipping ? "Sembunyikan opsi lain" : `Lihat ${rest.length} opsi lain`}
                            <svg className={`w-3.5 h-3.5 transition-transform ${showAllShipping ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {showAllShipping && (
                            <div className="space-y-2">
                              {rest.map(renderOption)}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

          </div>

          {/* 3. Metode Pembayaran */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>3</span>
              Metode Pembayaran
            </h2>

            <div className="space-y-3">
              {/* Opsi 1: Otomatis (Midtrans) */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "midtrans" ? "border-green-600 bg-green-50/40" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method_choice"
                  value="midtrans"
                  checked={paymentMethod === "midtrans"}
                  onChange={() => setPaymentMethod("midtrans")}
                  className="mt-0.5 accent-green-700"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">Pembayaran Otomatis (Midtrans)</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Konfirmasi Otomatis</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Bayar via QRIS Dinamis (GoPay, OVO, ShopeePay, DANA), Virtual Account Bank (BCA, BRI, BNI, Mandiri), dll.
                  </p>
                </div>
              </label>

              {/* Opsi 2: Langsung ke Toko (Manual QRIS UMKM) — Hanya tampil jika toko sudah upload QRIS / rekening */}
              {hasDirectPaymentSupport && (
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === "manual_umkm" ? "border-green-600 bg-green-50/40" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method_choice"
                    value="manual_umkm"
                    checked={paymentMethod === "manual_umkm"}
                    onChange={() => setPaymentMethod("manual_umkm")}
                    className="mt-0.5 accent-green-700"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">Bayar Langsung ke Toko (QRIS / Rekening UMKM)</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Langsung ke Penjual</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Scan QRIS statis toko atau transfer rekening bank UMKM, lalu unggah bukti pembayaran untuk diverifikasi penjual.
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* 4. Catatan */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>4</span>
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
                  <span className="line-clamp-1 flex-1 mr-1">
                    {item.product?.name} {item.variant && `(${item.variant.product_variant?.name ? `${item.variant.product_variant.name}: ${item.variant.value}` : (item.variant.value || item.variant.name)})`} ×{item.quantity}
                  </span>
                  <span className="shrink-0">{formatRupiah(getProductPrice(item) * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatRupiah(finalSubtotal)}</span>
              </div>
              {/* Diskon Voucher yang Dipilih */}
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span className="flex items-center gap-1"><i className="ti ti-ticket" /> Diskon Voucher</span>
                  <span>-{formatRupiah(voucherDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-500">
                <span>Ongkir</span>
                <span>
                  {deliveryType === "pickup" ? "Gratis (Ambil sendiri)" :
                    loadingPreview ? "Menghitung..." :
                    shippingCost !== null ? formatRupiah(shippingCost) : "-"}
                </span>
              </div>

              {apiServiceFee > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Biaya Layanan</span>
                  <span>{formatRupiah(apiServiceFee)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
                <span>Total</span>
                <span style={{ color: "var(--primary)" }}>
                  {formatRupiah(grandTotal)}
                </span>
              </div>
              </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || loadingPreview || (deliveryType === "delivered" && (!selectedAddressId || shippingCost === null))}
              className="mt-5 w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "var(--primary)" }}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Membuat Pesanan...</span>
                </>
              ) : loadingPreview ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menghitung Ongkir...</span>
                </>
              ) : (
                "Lanjut ke Pembayaran →"
              )}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              {paymentMethod === "manual_umkm" ? "Bayar langsung ke QRIS / Rekening Penjual" : "Pembayaran aman via Midtrans BUMDes"}
            </p>
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

      <ConfirmDialog
        open={confirmRemoveId !== null}
        title="Hapus Produk?"
        description="Apakah Anda yakin ingin menghapus produk ini dari daftar pesanan?"
        confirmLabel="Ya, Hapus"
        variant="danger"
        loading={deletingItem}
        onConfirm={async () => {
          if (confirmRemoveId !== null) {
            await handleRemoveItem(confirmRemoveId);
            setConfirmRemoveId(null);
          }
        }}
        onClose={() => setConfirmRemoveId(null)}
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
                  <p className="text-xs text-green-600 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg> Koordinat tersimpan ({Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)})</p>
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
