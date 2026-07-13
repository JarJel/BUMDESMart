"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/hooks/useAuth";
import { addressApi, AddressData } from "@/lib/api/address";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const tabs = ["Profil Saya", "Alamat", "Keamanan"];

export default function ProfilPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, refetch } = useAuth();
  const [tab, setTab] = useState("Profil Saya");
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
  });

  // States for addresses
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);
  const [deleteAddrId, setDeleteAddrId] = useState<number | undefined>(undefined);
  const [deletingAddr, setDeletingAddr] = useState(false);

  const [addressForm, setAddressForm] = useState<AddressData>({
    label: "Rumah",
    recipient_name: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    is_default: false,
  });

  // States for avatar
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("File harus berupa gambar.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Ukuran gambar maksimal 2MB.");
      return;
    }

    setAvatarUploading(true);
    setAvatarError("");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      await authApi.updateAvatar(formData);
      if (refetch) {
        await refetch();
      }
    } catch {
      setAvatarError("Gagal mengunggah foto profil.");
    } finally {
      setAvatarUploading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    authApi.getProfile()
      .then((res) => {
        const d = res.data.data;
        setForm({
          name: d.name || "",
          email: d.email || "",
          phone: d.customer?.phone || d.phone || "",
          date_of_birth: d.customer?.date_of_birth || "",
        });
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({
        name: form.name,
        phone: form.phone,
        date_of_birth: form.date_of_birth || undefined,
      });
      toast.success("Profil berhasil diperbarui.");
    } catch {
      toast.error("Gagal memperbarui profil.");
    } finally {
      setSaving(false);
    }
  };

  // Fetch Address List
  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await addressApi.list();
      setAddresses(res.data.data);
    } catch {
      console.error("Gagal memuat daftar alamat.");
    } finally {
      setAddressesLoading(false);
    }
  };

  // Sync addresses list fetch on tab change or mount
  useEffect(() => {
    if (tab === "Alamat" && user) {
      fetchAddresses();
    }
  }, [tab, user]);

  // Open modal for Adding Alamat
  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setAddressForm({
      label: "Rumah",
      recipient_name: "",
      phone: "",
      address: "",
      city: "",
      province: "",
      postal_code: "",
      is_default: false,
    });
    setAddressModalOpen(true);
  };

  // Open modal for Editing Alamat
  const handleOpenEditModal = (addr: AddressData) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label || "Rumah",
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      province: addr.province,
      postal_code: addr.postal_code,
      is_default: !!addr.is_default,
    });
    setAddressModalOpen(true);
  };

  // Save Address (Store or Update)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSaving(true);
    try {
      if (editingAddress?.id) {
        await addressApi.update(editingAddress.id, addressForm);
        toast.success("Alamat berhasil diperbarui.");
      } else {
        await addressApi.store(addressForm);
        toast.success("Alamat berhasil ditambahkan.");
      }
      await fetchAddresses();
      setAddressModalOpen(false);
    } catch {
      toast.error("Gagal menyimpan alamat. Periksa kembali form Anda.");
    } finally {
      setAddressSaving(false);
    }
  };

  // Set Address as Default
  const handleSetDefault = async (id?: number) => {
    if (!id) return;
    try {
      await addressApi.setDefault(id);
      await fetchAddresses();
    } catch {
      console.error("Gagal menyetel alamat utama.");
    }
  };

  // Delete Address
  const handleDeleteAddress = (id?: number) => {
    if (!id) return;
    setDeleteAddrId(id);
  };

  const executeDeleteAddr = async () => {
    if (!deleteAddrId) return;
    setDeletingAddr(true);
    try {
      await addressApi.destroy(deleteAddrId);
      await fetchAddresses();
    } catch {
      toast.error("Gagal menghapus alamat.");
    } finally {
      setDeletingAddr(false);
      setDeleteAddrId(undefined);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : "?";

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center text-sm text-gray-500">
        {authLoading ? "Memuat..." : ""}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Akun Saya</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-56 shrink-0 space-y-3">
          {/* Avatar card */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="relative w-16 h-16 mx-auto mb-3 group">
              {user?.avatar ? (
                <img
                  src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:8000${user.avatar}`}
                  alt={form.name}
                  className="w-16 h-16 rounded-full object-cover border border-gray-100"
                />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white border border-gray-100" style={{ background: "var(--primary)" }}>
                  {getInitial(form.name)}
                </div>
              )}
              {/* Overlay edit button */}
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-white text-[10px] font-semibold">Ubah</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={avatarUploading}
                />
              </label>
            </div>

            {avatarError && (
              <p className="text-[10px] text-red-500 mb-1 leading-tight">{avatarError}</p>
            )}
            {avatarUploading && (
              <p className="text-[10px] text-gray-400 mb-1 leading-tight">Mengunggah...</p>
            )}

            <p className="font-semibold text-gray-900 text-sm">{form.name || "-"}</p>
            <p className="text-xs text-gray-500 truncate mb-1">{form.email || "-"}</p>
            <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: "var(--primary-muted)", color: "var(--primary-dark)" }}>
              {user?.role || "customer"}
            </span>
          </div>

          {/* Nav */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-gray-50 last:border-0 ${tab === item ? "font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                style={tab === item ? { color: "var(--primary)", background: "var(--primary-muted)" } : {}}
              >
                {item === "Profil Saya"} {item === "Alamat"} {item === "Keamanan"} {item}
              </button>
            ))}
            <Link href="/pesanan" className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 border-b border-gray-50">
               Pesanan Saya
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Keluar
            </button>
          </div>
        </div>

        {/* Konten */}
        <div className="flex-1">
          {tab === "Profil Saya" && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-5">Informasi Pribadi</h2>
              {loading ? (
                <p className="text-sm text-gray-500">Memuat data profil...</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                      style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      disabled
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">No. Telepon</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Masukkan nomor telepon"
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                      style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Lahir</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={form.date_of_birth}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                      style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties}
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    style={{ background: "var(--primary)" }}
                  >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "Alamat" && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">Alamat Tersimpan</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Kelola alamat pengiriman belanjaan Anda</p>
                </div>
                <button
                  onClick={handleOpenAddModal}
                  className="text-xs font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90 transition-all cursor-pointer"
                  style={{ background: "var(--primary)" }}
                >
                  + Tambah Alamat
                </button>
              </div>

              {addressesLoading ? (
                <p className="text-sm text-gray-500">Memuat daftar alamat...</p>
              ) : addresses.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <p className="text-sm font-medium">Belum ada alamat tersimpan.</p>
                  <p className="text-xs mt-1">Silakan tambahkan alamat pengiriman pertama Anda.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 ${addr.is_default
                          ? "border-green-600/30 bg-green-50/10 shadow-sm"
                          : "border-gray-100 hover:border-gray-200"
                        }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 capitalize">{addr.label}</span>
                          {addr.is_default && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-green-700 bg-green-100 uppercase tracking-wide">
                              Utama
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!addr.is_default && (
                            <button
                              onClick={() => handleSetDefault(addr.id)}
                              className="text-xs text-green-700 font-semibold hover:underline cursor-pointer px-2 py-1 border-0 bg-transparent"
                            >
                              Jadikan Utama
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(addr)}
                            className="text-xs text-gray-500 font-semibold hover:text-gray-700 cursor-pointer px-2 py-1 border-0 bg-transparent"
                          >
                            Ubah
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-xs text-red-500 font-semibold hover:text-red-700 cursor-pointer px-2 py-1 border-0 bg-transparent"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>

                      <div className="text-sm text-gray-800 space-y-1">
                        <p className="font-semibold">{addr.recipient_name} <span className="text-gray-400 font-normal">| {addr.phone}</span></p>
                        <p className="text-gray-600 leading-relaxed">{addr.address}</p>
                        <p className="text-gray-500 text-xs">
                          {addr.city}, {addr.province}, {addr.postal_code}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Address Form Modal */}
          {addressModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all animate-fade-in">
              <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-lg p-6 shadow-xl mx-4 relative overflow-hidden animate-slide-up">
                <button
                  onClick={() => setAddressModalOpen(false)}
                  className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {editingAddress ? "Ubah Alamat" : "Tambah Alamat Baru"}
                </h3>
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Label Alamat</label>
                      <input
                        type="text"
                        required
                        placeholder="Rumah, Kantor, dsb."
                        value={addressForm.label}
                        onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Penerima</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama lengkap penerima"
                        value={addressForm.recipient_name}
                        onChange={(e) => setAddressForm({ ...addressForm, recipient_name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">No. Telepon</label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 08123456789"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Alamat Lengkap</label>
                    <textarea
                      required
                      placeholder="Nama jalan, gedung, RT/RW, nomor rumah"
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Kota/Kabupaten</label>
                      <input
                        type="text"
                        required
                        placeholder="Kota"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Provinsi</label>
                      <input
                        type="text"
                        required
                        placeholder="Provinsi"
                        value={addressForm.province}
                        onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Kode Pos</label>
                      <input
                        type="text"
                        required
                        placeholder="Kode Pos"
                        value={addressForm.postal_code}
                        onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={addressForm.is_default}
                      onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                      className="w-4 h-4 accent-green-600 rounded cursor-pointer animate-pulse"
                    />
                    <label htmlFor="is_default" className="text-xs text-gray-600 font-medium select-none cursor-pointer">
                      Jadikan sebagai alamat utama
                    </label>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setAddressModalOpen(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:bg-gray-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={addressSaving}
                      className="px-5 py-2 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer border-0"
                      style={{ background: "var(--primary)" }}
                    >
                      {addressSaving ? "Menyimpan..." : "Simpan Alamat"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {tab === "Keamanan" && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-5">Ubah Kata Sandi</h2>
              <div className="space-y-4">
                {["Kata Sandi Lama", "Kata Sandi Baru", "Konfirmasi Kata Sandi Baru"].map((f) => (
                  <div key={f}>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{f}</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2" style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties} />
                  </div>
                ))}
                <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "var(--primary)" }}>
                  Update Kata Sandi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteAddrId !== undefined}
        title="Hapus Alamat?"
        description="Alamat yang dihapus tidak dapat dikembalikan."
        confirmLabel="Ya, Hapus"
        loading={deletingAddr}
        onConfirm={executeDeleteAddr}
        onClose={() => setDeleteAddrId(undefined)}
      />
    </div>
  );
}
