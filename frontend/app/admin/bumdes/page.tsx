"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface BumdesProfile {
  id: number;
  name: string;
  slug: string;
  village: string;
  city: string;
  province: string;
  phone: string | null;
  email: string | null;
  status: "active" | "inactive";
  user: { name: string; email: string };
}

const emptyForm = {
  name: "",
  village: "",
  district: "",
  city: "",
  province: "",
  postal_code: "",
  phone: "",
  email: "",
  description: "",
  admin_name: "",
  admin_email: "",
  admin_password: "",
};

export default function AdminBumdesPage() {
  const [list, setList] = useState<BumdesProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchList = async () => {
    try {
      const res = await axios.get(`${API}/bumdes`);
      setList(res.data.data ?? []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await axios.post(`${API}/super-admin/bumdes`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("BUMDes berhasil didaftarkan!");
      setForm(emptyForm);
      setShowForm(false);
      fetchList();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gagal mendaftarkan BUMDes.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (bumdes: BumdesProfile) => {
    try {
      await axios.put(
        `${API}/super-admin/bumdes/${bumdes.id}`,
        { status: bumdes.status === "active" ? "inactive" : "active" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchList();
    } catch {}
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kelola BUMDes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Daftarkan dan kelola BUMDes yang tergabung di platform</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#6366f1" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Daftarkan BUMDes
        </button>
      </div>

      {/* Success */}
      {success && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">{success}</div>
      )}

      {/* Form Tambah */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-5">Form Pendaftaran BUMDes</h2>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Info BUMDes */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-3">Informasi BUMDes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "name", label: "Nama BUMDes", required: true },
                  { name: "village", label: "Desa", required: true },
                  { name: "district", label: "Kecamatan" },
                  { name: "city", label: "Kota/Kabupaten", required: true },
                  { name: "province", label: "Provinsi", required: true },
                  { name: "postal_code", label: "Kode Pos" },
                  { name: "phone", label: "Nomor Telepon" },
                  { name: "email", label: "Email BUMDes" },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name={f.name}
                      value={(form as any)[f.name]}
                      onChange={handleChange}
                      required={f.required}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Akun Admin BUMDes */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-3">Akun Admin BUMDes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "admin_name", label: "Nama Admin", required: true },
                  { name: "admin_email", label: "Email Admin", required: true },
                  { name: "admin_password", label: "Password", required: true },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {f.label} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={f.name === "admin_password" ? "password" : "text"}
                      name={f.name}
                      value={(form as any)[f.name]}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-gray-50"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#6366f1" }}
              >
                {submitting ? "Menyimpan..." : "Daftarkan BUMDes"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List BUMDes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Daftar BUMDes Terdaftar</p>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Memuat data...</div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">Belum ada BUMDes terdaftar.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {list.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{b.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.village}, {b.city}, {b.province}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Admin: {b.user?.name} · {b.user?.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${b.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {b.status === "active" ? "Aktif" : "Nonaktif"}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(b)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                  >
                    {b.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
