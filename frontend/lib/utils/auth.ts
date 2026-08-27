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

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 hari

export function setAuthCookies(token: string, role: string) {
  document.cookie = `BumDesMartNukita-token=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
  document.cookie = `BumDesMartNukita-role=${role}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export function clearAuthCookies() {
  document.cookie = 'BumDesMartNukita-token=; path=/; max-age=0'
  document.cookie = 'BumDesMartNukita-role=; path=/; max-age=0'
}
