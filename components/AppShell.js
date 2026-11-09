'use client'

import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import AnnouncementBanner from '@/components/AnnouncementBanner'

const workspaceRoutes = ['/dashboard', '/profile', '/memberships', '/my-memberships', '/payouts']

const isWorkspaceRoute = (pathname) => {
  if (!pathname) return false
  // /post is the creator workspace to publish posts, but /post/[id] is a public standalone post page
  if (pathname === '/post') return true
  return workspaceRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

const isAdminRoute = (pathname) => {
  if (!pathname) return false
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export default function AppShell({ children }) {
  const pathname = usePathname()
  const { isLoaded, isSignedIn } = useUser()

  // 1. Admin Back-office: Dedicated admin layout without the public consumer navbar
  if (isAdminRoute(pathname)) {
    return (
      <div className="min-h-screen bg-[#f4ecef5c] text-slate-900">
        {children}
      </div>
    )
  }

  // 2. Creator Workspace: Show sidebar when authenticated on workspace routes
  const showSidebar = Boolean(isLoaded && isSignedIn && isWorkspaceRoute(pathname))

  if (!showSidebar) {
    return (
      <>
        <AnnouncementBanner />
        <Navbar />
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">{children}</div>
      </>
    )
  }

  return (
    <>
      <AnnouncementBanner />
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] md:flex">
        <Sidebar />
        <main className="min-w-0 flex-1 text-[var(--foreground)]">{children}</main>
      </div>
    </>
  )
}
