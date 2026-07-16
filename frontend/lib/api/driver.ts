/**
 * driver.ts — API client & shared types untuk fitur pengirim (kurir).
 * Import seluruh fungsi & tipe yang terkait driver dari file ini.
 */

import api from "./axios";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DriverOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: string;
  quantity: number;
  sub_total: string;
  product?: {
    id: number;
    name: string;
    weight: number;
    images?: { id: number; file_path: string }[];
  };
}

export interface DriverPickupPoint {
  name: string;
  address: string | null;
  phone: string | null;
  lat: string | null;
  lng: string | null;
}

export interface DriverDeliveryPoint {
  recipient_name: string;
  phone: string | null;
  label: string;
  address: string | null;
  city: string | null;
  province: string | null;
  lat: string | null;
  lng: string | null;
}

export interface DriverOrder {
  id: number;
  order_code: string;
  status: string;
  delivery_type: string;
  sub_total: string;
  shipping_cost: string;
  total: string;
  total_weight_gram: number;
  total_weight_kg: number;
  distance_km: number | null;
  distance_driver_to_pickup?: number | null;
  earning: number;
  notes: string | null;
  created_at: string;
  items: DriverOrderItem[];
  pickup_from: DriverPickupPoint;
  deliver_to: DriverDeliveryPoint;
}

export interface DriverStats {
  is_available: boolean;
  rating: string;
  total_deliveries: number;
  today_deliveries: number;
  available_orders: number;
  balance: {
    available: number;
    pending: number;
    withdrawn: number;
  };
}

// ─── Query params untuk filter radius ────────────────────────────────────────

export interface AvailableOrdersParams {
  lat?: number | null;
  lng?: number | null;
  radius?: number | null;
}

// ─── API functions ────────────────────────────────────────────────────────────

export const driverApi = {
  /** Statistik & info profil driver */
  stats: () => api.get<{ data: DriverStats }>("/driver/stats"),

  /** Daftar pesanan tersedia (belum diambil kurir mana pun) */
  availableOrders: ({ lat, lng, radius }: AvailableOrdersParams = {}) => {
    const params = new URLSearchParams();
    if (lat != null) params.set("lat", String(lat));
    if (lng != null) params.set("lng", String(lng));
    if (radius != null) params.set("radius", String(radius));
    const qs = params.toString();
    return api.get<{ data: DriverOrder[] }>(`/driver/orders/available${qs ? `?${qs}` : ""}`);
  },

  /** Daftar pesanan yang sedang aktif dikerjakan kurir ini */
  activeOrders: () => api.get<{ data: DriverOrder[] }>("/driver/orders/active"),

  /** Detail satu pesanan (tersedia atau milik kurir ini) */
  showOrder: (id: number) => api.get<{ data: DriverOrder }>(`/driver/orders/${id}`),

  /** Kurir mengambil pesanan */
  acceptOrder: (id: number) => api.post(`/driver/orders/${id}/accept`),

  /** Update status pengiriman (shipped / delivered) */
  updateStatus: (id: number, data: FormData | { status: "picking_up" | "shipped" | "delivered" }) => {
    if (data instanceof FormData) {
      data.append("_method", "PATCH");
      return api.post(`/driver/orders/${id}/status`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    }
    return api.patch(`/driver/orders/${id}/status`, data);
  },

  /** Toggle ketersediaan kurir (online/offline) */
  toggleAvailability: () => api.patch("/driver/profile/availability"),

  /** Profil kurir */
  profile: () => api.get("/driver/profile"),

  /** Update profil kurir */
  updateProfile: (data: Record<string, unknown>) => api.put("/driver/profile", data),
};
