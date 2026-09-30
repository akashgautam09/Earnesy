'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

const appRoutes = ['/dashboard', '/profile', '/memberships', '/post', '/payouts']

const hasSidebar = (pathname) => appRoutes.some(
  (route) => pathname === route || pathname.startsWith(`${route}/`)
)

export default function AppShell({ children }) {
  const pathname = usePathname()
  const showSidebar = hasSidebar(pathname)

  if (!showSidebar) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">{children}</div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 text-[var(--foreground)]">{children}</main>
    </div>
  )
}