import { useState, useEffect } from 'react'
import { User } from '@/types'
import { authApi } from '@/lib/api/auth'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authApi.me()
        .then((res) => setUser(res.data.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    const { token, user } = res.data.data
    localStorage.setItem('token', token)
    setUser(user)
    return user
  }

  const logout = async () => {
    await authApi.logout()
    localStorage.removeItem('token')
    setUser(null)
  }

  const isRole = (role: User['role']) => user?.role === role

  return { user, loading, login, logout, isRole }
}
