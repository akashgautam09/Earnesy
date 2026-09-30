'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import {
  CircleUserRound,
  House,
  LayoutDashboard,
  LogOut,
  PenLine,
  ReceiptText,
  UsersRound,
  WalletCards,
} from 'lucide-react'

const navigation = [
  { label: 'Home', href: '/', icon: House },
  { label: 'My Page', href: null, icon: CircleUserRound },
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
      <div className="flex h-full flex-col px-4 py-4 md:px-5 md:py-6">
        <Link href="/" className="mb-5 hidden px-2 text-xl font-semibold tracking-[0.08em] text-[var(--foreground)] md:block">
          Earnesy
        </Link>

        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-3">
          <img src={user?.imageUrl || '/tea.gif'} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">{displayName}</p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">{username}</p>
          </div>
        </div>

        <nav aria-label="Creator navigation" className="flex gap-1 overflow-x-auto pb-1 md:block md:space-y-1 md:overflow-visible">
          {navigation.map(({ label, href, icon: Icon }) => {
            const destination = href || myPageHref
            const active = href === '/'
              ? pathname === '/'
              : href === null
                ? destination !== '/dashboard' && pathname === destination
                : pathname === href || pathname.startsWith(`${href}/`)

            return (
              <Link
                key={label}
                href={destination}
                className={`flex min-w-max items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:w-full ${active ? 'bg-[var(--accent)] text-[var(--primary)]' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto hidden border-t border-[var(--border)] pt-4 md:block">
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: '/' })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <LogOut size={18} strokeWidth={1.8} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}