import api from './axios'

export interface NotificationData {
  id: number
  customer_id: number
  title: string
  content: string
  type: 'order' | 'promo' | 'wishlist' | 'info'
  is_read: boolean
  created_at: string
  updated_at: string
}

export const notificationApi = {
  list: () => api.get<{ success: boolean; data: NotificationData[] }>('/notifications'),
  markAsRead: (id: number) => api.put<{ success: boolean; message: string; data: NotificationData }>(`/notifications/${id}/read`),
  markAllAsRead: () => api.put<{ success: boolean; message: string }>('/notifications/read-all'),
  delete: (id: number) => api.delete<{ success: boolean; message: string }>(`/notifications/${id}`),
}
