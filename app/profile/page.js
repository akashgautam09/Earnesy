'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { ArrowUpRight, BadgeCheck, Coins, HeartHandshake, UsersRound } from 'lucide-react'

const formatAmount = (amount) => `₹${(Number(amount || 0) / 100).toLocaleString('en-IN')}`

export default function ProfilePage() {
  const { user: clerkUser } = useUser()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load profile')
        setProfile(data.user)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading profile...</div>
  if (error) return <div className="mx-auto max-w-3xl px-6 py-12 text-sm text-red-700">{error}</div>

  const stats = profile?.stats || {}
  const displayName = profile?.name || clerkUser?.fullName || 'Creator'

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Profile</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Your creator profile</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">A clear view of your audience, earnings, and membership.</p>
          </div>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
            Edit profile <ArrowUpRight size={16} />
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.4fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <img src={profile?.profileUrl || clerkUser?.imageUrl || '/tea.gif'} alt="" className="h-24 w-24 rounded-full border-4 border-[var(--accent)] object-cover" />
            <h2 className="mt-5 text-2xl font-semibold text-[var(--foreground)]">{displayName}</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">@{profile?.username || 'yourusername'}</p>
            <p className="mt-4 break-all text-sm text-[var(--muted-foreground)]">{profile?.email || clerkUser?.primaryEmailAddress?.emailAddress}</p>
            <div className="mt-6 flex items-center gap-2 text-sm text-[var(--primary)]"><BadgeCheck size={17} /> Verified creator identity</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <Coins className="text-[var(--primary)]" size={20} />
              <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Total earnings</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{formatAmount(stats.totalEarnings)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <UsersRound className="text-[var(--primary)]" size={20} />
              <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Supporters</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{stats.supporters || 0}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <HeartHandshake className="text-[var(--primary)]" size={20} />
              <p className="mt-5 text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Membership</p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{stats.membership?.plan || 'Free creator'}</p>
              <p className="mt-1 text-xs text-emerald-700">{stats.membership?.status || 'Active'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
