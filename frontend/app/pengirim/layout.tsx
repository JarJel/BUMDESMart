"use client"

import DashboardShell, { NavItem } from "@/components/layout/DashboardShell"

const ACCENT = "#ea580c"

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
    href: "/pengirim/profil",
    label: "Profil",
    icon: S("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"),
  },
]

export default function PengirimLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={NAV} roleLabel="Pengirim" accent={ACCENT}>
      {children}
    </DashboardShell>
  )
}
