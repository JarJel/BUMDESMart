// ===== USER =====
export interface User {
  id: number
  name: string
  email: string
  role: 'super_admin' | 'admin_bumdes' | 'umkm' | 'customer'
  phone: string
  avatar: string | null
  status: 'active' | 'inactive'
}

// ===== UMKM =====
export interface UmkmProfile {
  id: number
  user_id: number
  nama_umkm: string
  alamat: string
  kota: string
  provinsi: string
  logo: string | null
  deskripsi: string
  status: 'pending' | 'active' | 'rejected'
}

// ===== PRODUK =====
export interface Product {
  id: number
  umkm_id: number
  category_id: number
  nama: string
  slug: string
  deskripsi: string
  harga: number
  stok: number
  satuan: string
  order_type: 'ready_stock' | 'made_to_order'
  product_type: string
  price_fluctuating: boolean
  status: 'active' | 'inactive'
  images: ProductImage[]
  variants: ProductVariant[]
}

export interface ProductImage {
  id: number
  image_url: string
  is_primary: boolean
}

export interface ProductVariant {
  id: number
  nama: string
  sku: string
  harga: number | null
  stok: number
}

// ===== ORDER =====
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'waiting_confirmation'
  | 'in_production'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export interface Order {
  id: number
  order_code: string
  status: OrderStatus
  subtotal: number
  ongkir: number
  diskon: number
  total: number
  items: OrderItem[]
  payment: Payment | null
  shipment: Shipment | null
}

export interface OrderItem {
  id: number
  product_id: number
  nama_produk: string
  harga: number
  qty: number
  subtotal: number
}

// ===== PAYMENT =====
export interface Payment {
  id: number
  order_id: number
  metode: string
  status: 'pending' | 'success' | 'failed' | 'expired' | 'refunded'
  amount: number
  paid_at: string | null
}

// ===== SHIPMENT =====
export interface Shipment {
  id: number
  resi: string
  status: 'pending' | 'processed' | 'shipped' | 'delivered' | 'cancelled'
  shipped_at: string | null
  delivered_at: string | null
}

// ===== API RESPONSE =====
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
