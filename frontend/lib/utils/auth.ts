export const ROLE_HOME: Record<string, string> = {
  super_admin:  '/admin',
  admin_bumdes: '/bumdes',
  umkm:         '/dashboard',
  customer:     '/produk',
  pengirim:     '/pengirim',
}

export function getRoleHome(role: string): string {
  return ROLE_HOME[role] ?? '/'
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 hari

export function setAuthCookies(token: string, role: string) {
  document.cookie = `bumdesmart-token=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
  document.cookie = `bumdesmart-role=${role}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export function clearAuthCookies() {
  document.cookie = 'bumdesmart-token=; path=/; max-age=0'
  document.cookie = 'bumdesmart-role=; path=/; max-age=0'
}
