import api from './axios'

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/login', data),

  register: (data: {
    name: string
    email: string
    password: string
    password_confirmation: string
    phone: string
  }) => api.post('/register', data),

  logout: () => api.post('/logout'),

  getProfile: () => api.get('/profile'),

  updateProfile: (data: {
    name?: string
    phone?: string
    date_of_birth?: string
    gender?: string
  }) => api.put('/profile', data),

  forgotPassword: (email: string) =>
    api.post('/forgot-password', { email }),

  loginWithGoogle: (idToken: string) =>
    api.post('/auth/google', { id_token: idToken }),
}
