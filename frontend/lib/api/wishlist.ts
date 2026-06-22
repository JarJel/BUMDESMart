import api from './axios'

export interface WishlistItemData {
  id: number
  customer_id: number
  product_id: number
  created_at: string
  updated_at: string
  product?: {
    id: number
    name: string
    slug: string
    price: string | number
    stock: number
    weight: number
    umkm_profile?: {
      id: number
      name_umkm: string
    }
    images?: {
      id: number
      product_id: number
      image_path: string
    }[]
  }
}

export const wishlistApi = {
  list: () => api.get<{ success: boolean; data: WishlistItemData[] }>('/wishlist'),
  add: (productId: number) => 
    api.post<{ success: boolean; message: string; data: WishlistItemData }>('/wishlist', { 
      product_id: productId 
    }),
  remove: (productId: number) => 
    api.delete<{ success: boolean; message: string }>(`/wishlist/${productId}`),
}
