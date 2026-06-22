"use client"

import DashboardShell, { NavItem } from "@/components/layout/DashboardShell"

const ACCENT = "#2563eb"

const S = (d: string) => (
  <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
)

const NAV: NavItem[] = [
  {
    href: "/user",
    label: "Profil Saya",
    icon: S("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"),
  },
  {
    href: "/user/pesanan",
    label: "Pesanan Saya",
    icon: S("M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"),
  },
  {
    href: "/user/alamat",
    label: "Alamat",
    icon: S("M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"),
  },
  {
    href: "/user/wishlist",
    label: "Wishlist",
    icon: S("M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"),
  },
]

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV} roleLabel="Customer" accent={ACCENT}>
      {children}
    </DashboardShell>
  )
}
