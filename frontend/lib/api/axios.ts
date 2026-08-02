import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  maxRedirects: 0,
})

// Attach token otomatis setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle error global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.endsWith('/login')) {
      const hadToken = !!localStorage.getItem('token')
      localStorage.removeItem('token')
      if (typeof window !== 'undefined') {
        const { clearAuthCookies } = require('@/lib/utils/auth')
        clearAuthCookies()
        if (hadToken) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
