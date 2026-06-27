import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROLE_HOME: Record<string, string> = {
  super_admin:  '/admin',
  admin_bumdes: '/bumdes',
  umkm:         '/dashboard',
  customer:     '/produk',
  pengirim:     '/pengirim',
}

// path prefix → required role
const PATH_ROLE: Record<string, string> = {
  '/admin':     'super_admin',
  '/bumdes':    'admin_bumdes',
  '/dashboard': 'umkm',
  '/user':      'customer',
  '/pengirim':  'pengirim',
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('bumdesmart-token')?.value
  const role = request.cookies.get('bumdesmart-role')?.value
  const isLoggedIn = !!token && !!role

  // Sudah login → jangan masuk ke /login
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/', request.url))
  }

  // Cek apakah path ini protected
  const matchedBase = Object.keys(PATH_ROLE).find((p) => pathname.startsWith(p))
  if (!matchedBase) return NextResponse.next()

  // Belum login → ke login
  if (!isLoggedIn) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Role salah → ke home role-nya
  if (PATH_ROLE[matchedBase] !== role) {
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? '/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/bumdes/:path*',
    '/dashboard/:path*',
    '/user/:path*',
    '/pengirim/:path*',
  ],
}
