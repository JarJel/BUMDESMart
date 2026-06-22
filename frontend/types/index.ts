// ===== USER =====
export interface User {
  id: number
  name: string
  email: string
  role: 'super_admin' | 'admin_bumdes' | 'umkm' | 'customer' | 'pengirim'
  phone: string | null
  avatar: string | null
  google_id: string | null
  status: 'active' | 'inactive' | 'suspended'
}

// ===== UMKM =====
export interface UmkmProfile {
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
  npwp: string | null
  nib: string | null
  status: 'pending' | 'active' | 'rejected' | 'suspended'
  verified_at: string | null
}

export interface UmkmDocument {
  id: number
  umkm_profile_id: number
  document_type: 'ktp' | 'npwp' | 'nib' | 'siup' | 'sktm' | 'other'
  document_number: string | null
  file_path: string
  notes: string | null
  expired_at: string | null
  status: 'pending' | 'verified' | 'rejected'
}

// ===== CATEGORY =====
export interface Category {
  id: number
  parent_id: number | null
  name: string
  slug: string
  description: string | null
  image: string | null
  sort_order: number
  is_active: boolean
  children?: Category[]
}

// ===== PRODUK =====
export interface Product {
  id: number
  umkm_profile_id: number
  category_id: number
  name: string
  slug: string
  description: string
  price: number
  stock: number
  weight: number
  has_variant: boolean
  is_digital: boolean
  sold_count: number
  status: 'active' | 'inactive' | 'draft'
  images: ProductImage[]
  variants: ProductVariant[]
  documents: ProductDocument[]
}

export interface ProductImage {
  id: number
  product_id: number
  file_path: string
  is_primary: boolean
  sort_order: number
}

export interface ProductDocument {
  id: number
  product_id: number
  document_type: string
  document_number: string | null
  issuer: string | null
  file_path: string
  issued_at: string | null
  expired_at: string | null
  status: 'active' | 'expired' | 'pending'
}

export interface ProductVariant {
  id: number
  product_id: number
  name: string
  sort_order: number
  options: ProductVariantOption[]
}

export interface ProductVariantOption {
  id: number
  product_variant_id: number
  value: string
  sku: string | null
  price: number
  stock: number
  weight: number | null
  is_active: boolean
  sort_order: number
}

// ===== ORDER =====
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export interface Order {
  id: number
  customer_id: number
  umkm_profile_id: number
  address_id: number
  promotion_id: number | null
  order_code: string
  sub_total: number
  shipping_cost: number
  discount: number
  total: number
  status: OrderStatus
  notes: string | null
  items: OrderItem[]
  payment: Payment | null
  shipment: Shipment | null
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  variant_option_id: number | null
  product_name: string
  product_price: number
  quantity: number
  sub_total: number
}

export interface OrderHistory {
  id: number
  order_id: number
  user_id: number
  status: string
  description: string | null
  created_at: string
}

// ===== PAYMENT =====
export interface Payment {
  id: number
  order_id: number
  xendit_invoice_id: string | null
  xendit_external_id: string
  payment_code: string
  channel: 'bank_transfer' | 'ewallet' | 'qris' | 'convenience_store' | 'credit_card' | 'cod' | null
  channel_code: string | null
  amount: number
  fee_amount: number
  xendit_data: Record<string, unknown> | null
  status: 'pending' | 'paid' | 'settled' | 'expired' | 'failed' | 'refunded'
  paid_at: string | null
  expired_at: string | null
  refunded_at: string | null
}

// ===== ADDRESS =====
export interface Address {
  id: number
  customer_id: number
  label: string | null
  recipient_name: string
  phone: string
  address_line: string
  city: string
  province: string
  postal_code: string
  is_default: boolean
}

// ===== SHIPMENT =====
export interface ShippingService {
  id: number
  courier_code: string
  service_code: string
  name: string
  description: string | null
  estimated_days: string | null
  is_active: boolean
}

export interface Shipment {
  id: number
  order_id: number
  shipping_service_id: number
  tracking_number: string | null
  weight: number | null
  shipping_cost: number
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned'
  notes: string | null
  shipped_at: string | null
  estimated_delivery_at: string | null
  delivered_at: string | null
  trackings: ShipmentTracking[]
}

export interface ShipmentTracking {
  id: number
  shipment_id: number
  status: string
  location: string | null
  notes: string
  event_time: string
}

// ===== PROMOTION =====
export interface Promotion {
  id: number
  umkm_profile_id: number
  code: string
  name: string
  description: string | null
  type: 'percentage' | 'fixed_amount' | 'free_shipping'
  value: number
  min_order_amount: number | null
  max_discount_amount: number | null
  start_date: string
  end_date: string
  usage_limit: number | null
  usage_count: number
  status: 'active' | 'inactive' | 'expired'
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
