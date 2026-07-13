import api from './axios'

export interface AddressData {
  id?: number
  label?: string
  recipient_name: string
  phone: string
  address: string
  city: string
  province: string
  postal_code: string
  latitude?: number | null
  longitude?: number | null
  is_default?: boolean
}

export const addressApi = {
  list: () => api.get('/addresses'),
  store: (data: AddressData) => api.post('/addresses', data),
  update: (id: number, data: AddressData) => api.put(`/addresses/${id}`, data),
  destroy: (id: number) => api.delete(`/addresses/${id}`),
  setDefault: (id: number) => api.put(`/addresses/${id}/default`),
}
