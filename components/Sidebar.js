'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import {
  House,
  Globe,
  LayoutDashboard,
  CircleUserRound,
  UsersRound,
  PenLine,
  WalletCards,
  LogOut,
  Coffee,
} from 'lucide-react'

const navigation = [
  { label: 'Home', href: '/', icon: House },
  { label: 'My Page', href: null, icon: Globe },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Profile', href: '/profile', icon: CircleUserRound },
  { label: 'Memberships', href: '/memberships', icon: UsersRound },
  { label: 'Post', href: '/post', icon: PenLine },
  { label: 'Payouts', href: '/payouts', icon: WalletCards },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerk()
  const [myPageHref, setMyPageHref] = useState('/dashboard')
  const [localUsername, setLocalUsername] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadProfileLink = async () => {
      const response = await fetch('/api/profile')
      const data = await response.json().catch(() => null)
      const username = data?.user?.username?.trim()

      if (!cancelled && response.ok && username) {
        setMyPageHref(`/${encodeURIComponent(username)}`)
        setLocalUsername(username)
      }
    }

    loadProfileLink()
    return () => {
      cancelled = true
    }
  }, [])

  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Creator'
  const username = localUsername ? `@${localUsername}` : 'Set up your public page'

  return (
    <aside className="sticky top-0 z-40 w-full shrink-0 border-b border-[var(--border)] bg-[var(--card)] md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-full flex-col gap-5 px-3 py-4 sm:px-4 md:gap-6 md:px-5 md:py-6">
        {/* Brand Header */}
        <Link
          href="/"
          className="group hidden items-center gap-3 px-2 transition md:flex"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-sm transition group-hover:scale-105">
            <Coffee size={19} className="stroke-[2.2]" />
          </div>
        </Link>

        {/* User Card */}
        <Link
          href="/profile"
          className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 p-3 transition hover:bg-[var(--muted)]"
        >
          <img
            src={user?.imageUrl || '/tea.gif'}
            alt={displayName}
            className="h-10 w-10 rounded-full border border-[var(--border)] object-cover shadow-xs"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">{displayName}</p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">{username}</p>
          </div>
        </Link>

        {/* Section Heading */}
        <p className="px-3 font-bold uppercase tracking-wider text-lg text-[var(--primary)]">
          Workspace
        </p>

        {/* Navigation Items */}
        <nav
          aria-label="Creator navigation"
          className="-mx-1 flex min-w-0 gap-1.5 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-1 md:flex-col md:gap-1.5 md:overflow-visible md:px-0"
        >
          {navigation.map(({ label, href, icon: Icon }) => {
            const destination = href || myPageHref
            const active =
              href === '/'
                ? pathname === '/'
                : href === null
                  ? destination !== '/dashboard' && pathname === destination
                  : pathname === href || pathname.startsWith(`${href}/`)

            return (
              <Link
                key={label}
                href={destination}
                className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-lg font-normal transition-all sm:px-3.5 md:w-full ${active
                  ? 'bg-[var(--primary)]/10 font-semibold text-[var(--primary)] shadow-xs'
                  : 'text-gray-800 hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                aria-current={active ? 'page' : undefined}>
                <Icon
                  size={25}
                  strokeWidth={active ? 2.2 : 1.9}
                  className={active ? 'text-[var(--primary)]' : 'font-semibold'}
                />
                <span className="truncate font-sans tracking-tight">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sign Out Action */}
        <div className="mt-auto hidden border-t border-[var(--border)] pt-4 md:block">
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: '/' })}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-all hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
          >
            <LogOut size={19} strokeWidth={1.9} />
            <span className="tracking-tight">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}