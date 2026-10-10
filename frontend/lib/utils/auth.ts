export const ROLE_HOME: Record<string, string> = {
  super_admin:  '/admin',
  admin_bumdes: '/bumdes',
  umkm:         '/seller',
  customer:     '/produk',
  pengirim:     '/pengirim',
}

export function getRoleHome(role: string): string {
  return ROLE_HOME[role] ?? '/'
}

const COOKIE_MAX_AGE_DEFAULT = 60 * 60 * 24 * 7 // 7 hari
const COOKIE_MAX_AGE_REMEMBER = 60 * 60 * 24 * 365 // 1 tahun

export function setAuthCookies(token: string, role: string, remember: boolean = false) {
  const maxAge = remember ? COOKIE_MAX_AGE_REMEMBER : COOKIE_MAX_AGE_DEFAULT
  document.cookie = `BumDesMartNukita-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
  document.cookie = `BumDesMartNukita-role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function clearAuthCookies() {
  document.cookie = 'BumDesMartNukita-token=; path=/; max-age=0'
  document.cookie = 'BumDesMartNukita-role=; path=/; max-age=0'
}
