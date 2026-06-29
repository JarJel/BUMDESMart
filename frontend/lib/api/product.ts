import api from './axios'
import { SellerData } from './seller'

export interface ProductImage {
  id: number
  product_id: number
  file_path: string
  is_primary: boolean
  sort_order: number
}

export interface ProductVariantOption {
  id: number
  variant_id: number
  value: string
  price_adjustment: string | number
  stock: number
}

export interface ProductVariant {
  id: number
  product_id: number
  name: string
  options?: ProductVariantOption[]
}

export interface ProductData {
  id: number
  umkm_profile_id: number
  category_id: number
  name: string
  slug: string
  description: string
  price: string | number
  stock: number
  weight: number
  has_variant: boolean
  is_digital: boolean
  sold_count: number
  status: string
  created_at: string
  updated_at: string
  primary_image?: ProductImage | null
  images?: ProductImage[]
  variants?: ProductVariant[]
  umkm_profile?: Partial<SellerData>
  category?: {
    id: number
    name: string
    slug: string
  }
}

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  next_page_url: string | null
  prev_page_url: string | null
  per_page: number
  to: number
  total: number
}

export const productApi = {
  list: (params?: { search?: string; category_id?: number; umkm_id?: number; page?: number }) =>
    api.get<{ success: boolean; message: string; data: PaginatedResponse<ProductData> }>('/products', { params }),
  get: (idOrSlug: string | number) =>
    api.get<{ success: boolean; message: string; data: ProductData }>(`/products/${idOrSlug}`),
}
