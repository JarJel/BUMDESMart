import api from './axios'

export interface CheckoutConfirmPayload {
  address_id: number
  delivery_type: 'delivered' | 'pickup'
  notes?: string
  product_id?: number
  quantity?: number
  variant_id?: number
  promotion_code?: string
  promotion_codes?: Record<number, string>
}

export interface CreatedOrder {
  order_id: number
  order_code: string
  total: number
}

export const checkoutApi = {
  preview: (params?: { 
    address_id?: number; 
    product_id?: number; 
    quantity?: number; 
    variant_id?: number;
    promotion_code?: string;
    promotion_codes?: Record<number, string>;
  }) =>
    api.get('/checkout/preview', { params }),

  confirm: (payload: CheckoutConfirmPayload) =>
    api.post('/checkout/confirm', payload),

  createPayment: (orderId: number) =>
    api.post(`/checkout/payment/${orderId}`),

  checkPaymentStatus: (orderId: number) =>
    api.get(`/checkout/payment/${orderId}/status`),
}

export const orderApi = {
  list: (params?: { status?: string }) => api.get('/orders', { params }),
  show: (id: number) => api.get(`/orders/${id}`),
  confirmDelivered: (id: number) => api.patch(`/orders/${id}/delivered`),
}
