'use client'

import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

const workspaceRoutes = ['/dashboard', '/profile', '/memberships', '/my-memberships', '/payouts']

const isWorkspaceRoute = (pathname) => {
  if (!pathname) return false
  // /post is the creator workspace to publish posts, but /post/[id] is a public standalone post page
  if (pathname === '/post') return true
  return workspaceRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export default function AppShell({ children }) {
  const pathname = usePathname()
  const { isLoaded, isSignedIn } = useUser()

  // Only show the creator workspace sidebar when authenticated AND on a designated workspace route
  const showSidebar = Boolean(isLoaded && isSignedIn && isWorkspaceRoute(pathname))

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
