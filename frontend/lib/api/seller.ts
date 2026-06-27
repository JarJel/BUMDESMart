import api from './axios'

export interface SellerData {
  id: number
  user_id: number
  shop_name: string
  slug: string
  owner_name: string
  email: string | null
  phone: string | null
  logo: string | null
  banner: string | null
  description: string | null
  address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  status: string
  created_at: string
  updated_at: string
}

export const sellerApi = {
  list: (params?: { limit?: number; search?: string }) =>
    api.get<{ success: boolean; message: string; data: SellerData[] }>('/sellers', { params }),
  get: (idOrSlug: string | number) =>
    api.get<{ success: boolean; message: string; data: SellerData }>(`/sellers/${idOrSlug}`),
}
