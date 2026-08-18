"use client"

import DashboardShell, { NavItem } from "@/components/layout/DashboardShell"

const ACCENT = "#E76F51"

const S = (d: string) => (
  <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
)

const NAV: NavItem[] = [
  {
    href: "/pengirim",
    label: "Dashboard",
    icon: S("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"),
  },
  {
    href: "/pengirim/pesanan",
    label: "Pesanan",
    icon: S("M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"),
  },
  {
    href: "/pengirim/riwayat",
    label: "Riwayat",
    icon: S("M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"),
  },
  {
    href: "/pengirim/saldo",
    label: "Saldo",
    icon: S("M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"),
  },
  {
    href: "/pengirim/profil",
    label: "Profil",
    icon: S("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"),
  },
  {
    href: "/pengirim/berita",
    label: "Berita & Event",
    icon: S("M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"),
  },
]

export default function PengirimLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV} roleLabel="Pengirim" accent={ACCENT}>
      {children}
    </DashboardShell>
  )
}
