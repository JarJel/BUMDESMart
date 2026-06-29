import { useState, useEffect, useCallback } from 'react'
import { User } from '@/types'
import { authApi } from '@/lib/api/auth'
import { clearAuthCookies } from '@/lib/utils/auth'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const res = await authApi.getProfile()
        setUser(res.data.data ?? res.data)
      } catch {
        localStorage.removeItem('token')
        clearAuthCookies()
        setUser(null)
      }
    } else {
      setUser(null)
      clearAuthCookies()
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUser()
    const onStorage = () => fetchUser()
    window.addEventListener('storage', onStorage)
    window.addEventListener('auth-change', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('auth-change', onStorage)
    }
  }, [fetchUser])

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    const { token, user } = res.data
    localStorage.setItem('token', token)
    setUser(user)
    return user
  }

  const logout = async () => {
    try { await authApi.logout() } catch {}
    localStorage.removeItem('token')
    clearAuthCookies()
    setUser(null)
    window.dispatchEvent(new Event('auth-change'))
  }

  const isRole = (role: User['role']) => user?.role === role

  return { user, loading, login, logout, isRole, refetch: fetchUser }
}
