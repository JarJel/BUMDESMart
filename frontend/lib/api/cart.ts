import api from './axios'

export interface CartItemData {
  id: number
  cart_id: number
  product_id: number
  variant_id: number | null
  quantity: number
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
  variant?: {
    id: number
    name: string
    stock: number
    price: string | number
  } | null
}

export interface CartData {
  id: number
  customer_id: number
  created_at: string
  updated_at: string
  items: CartItemData[]
}

export const cartApi = {
  get: () => api.get<{ success: boolean; data: CartData }>('/cart'),
  add: (productId: number, quantity: number, variantId?: number | null) => 
    api.post<{ success: boolean; message: string; data: CartData }>('/cart', { 
      product_id: productId, 
      quantity, 
      variant_id: variantId 
    }),
  update: (cartItemId: number, quantity: number) => 
    api.put<{ success: boolean; message: string; data: CartData }>('/cart', { 
      cart_item_id: cartItemId, 
      quantity 
    }),
  remove: (cartItemId: number) => 
    api.delete<{ success: boolean; message: string; data: CartData }>('/cart', { 
      data: { cart_item_id: cartItemId } 
    }),
  clear: () => 
    api.delete<{ success: boolean; message: string; data: CartData }>('/cart'),
}
