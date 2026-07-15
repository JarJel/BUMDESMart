"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { clearAuthCookies } from "@/lib/utils/auth"

export type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
}

type Props = {
  children: React.ReactNode
  navItems: NavItem[]
  roleLabel: string
  accent: string
  quickAction?: React.ReactNode
}

function isActive(pathname: string, href: string): boolean {
  const depth = href.split('/').filter(Boolean).length
  return depth <= 1 ? pathname === href : pathname.startsWith(href)
}

function initials(name?: string | null): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function DashboardShell({ children, navItems, roleLabel, accent, quickAction }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, loading } = useAuth()

  const handleLogout = async () => {
    localStorage.removeItem('token')
    clearAuthCookies()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-gray-300 rounded-full animate-spin" style={{ borderTopColor: accent }} />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh bg-gray-50 lg:h-screen lg:overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="hidden w-56 shrink-0 bg-white border-r border-gray-100 lg:flex lg:flex-col">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <img src="/logo.png" alt="BUMDESmart" className="h-8 w-auto" />
            <span className="font-bold text-sm" style={{ color: accent }}>BUMDESmart</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 pl-0.5">{roleLabel}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
                style={active ? { background: accent } : {}}
              >
                <span className={active ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Optional CTA */}
        {quickAction && <div className="px-3 pb-3">{quickAction}</div>}

        {/* Logout */}
        <div className="border-t border-gray-100 px-4 py-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-600 py-1.5 w-full"
          >
            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar
          </button>
        </div>

        {/* User info */}
        <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: accent }}
          >
            {initials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.name ?? '—'}</p>
            <p className="text-xs text-gray-400 truncate">{roleLabel}</p>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex min-h-dvh flex-1 flex-col min-w-0 lg:min-h-0">
        {/* Mobile topbar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-gray-100 bg-white/95 px-4 backdrop-blur lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <img src="/logo.png" alt="BUMDESmart" className="h-8 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold" style={{ color: accent }}>BUMDESmart</p>
              <p className="truncate text-xs text-gray-400">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative rounded-xl p-2 text-gray-400 hover:bg-gray-50">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: accent }}
            >
              {initials(user?.name)}
            </div>
          </div>
        </header>

        {/* Topbar */}
        <header className="hidden h-14 bg-white border-b border-gray-100 items-center gap-4 px-5 shrink-0 lg:flex">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
            />
          </div>
          <button className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</main>

        {/* Mobile navigation */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 grid border-t border-gray-100 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
          {navItems.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors ${
                  active ? 'text-white' : 'text-gray-500 hover:bg-gray-50'
                }`}
                style={active ? { background: accent } : {}}
              >
                <span className={active ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
