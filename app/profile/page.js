'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { ArrowUpRight, BadgeCheck, CalendarDays, Coins, ExternalLink, HeartHandshake, UsersRound } from 'lucide-react'
import AppPageHeader from '@/components/AppPageHeader'
import AppStatCard from '@/components/AppStatCard'

const formatAmount = (amount) => `₹${(Number(amount || 0) / 100).toLocaleString('en-IN')}`
const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recently'

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
      <div className="mx-auto max-w-6xl space-y-7">
        <AppPageHeader
          eyebrow="Profile"
          title="Your creator profile"
          description="A clear view of your audience, earnings, and membership."
          action={<Link href="/dashboard" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
            Edit profile <ArrowUpRight size={16} />
          </Link>}
        />

        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[0_8px_24px_rgba(25,25,25,0.03)]">
          <div className="relative h-32 bg-[var(--muted)] sm:h-44">
            {profile?.coverUrl ? <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[linear-gradient(110deg,var(--muted),var(--accent))]" />}
          </div>
          <div className="relative px-5 pb-5 sm:px-7 sm:pb-7">
            <img src={profile?.profileUrl || clerkUser?.imageUrl || '/tea.gif'} alt="" className="-mt-12 h-24 w-24 rounded-full border-4 border-[var(--card)] bg-[var(--muted)] object-cover sm:-mt-14 sm:h-28 sm:w-28" />
            <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">{displayName}</h2><BadgeCheck size={18} className="text-[var(--primary)]" /></div>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">@{profile?.username || 'yourusername'}</p>
                <p className="mt-3 break-all text-sm text-[var(--muted-foreground)]">{profile?.email || clerkUser?.primaryEmailAddress?.emailAddress}</p>
              </div>
              <Link href={profile?.username ? `/${encodeURIComponent(profile.username)}` : '/dashboard'} className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[var(--primary)] hover:underline lg:self-auto">
                View public page <ExternalLink size={15} />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <AppStatCard icon={Coins} label="Total earnings" value={formatAmount(stats.totalEarnings)} />
          <AppStatCard icon={UsersRound} label="Supporters" value={stats.supporters || 0} />
          <AppStatCard icon={HeartHandshake} label="Membership" value={stats.membership?.plan || 'Free creator'} detail={stats.membership?.status || 'Active'} />
        </section>

        <section className="grid gap-4 border-t border-[var(--border)] pt-7 sm:grid-cols-2">
          <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]"><CalendarDays size={17} className="text-[var(--primary)]" /><span>Creator since <strong className="font-medium text-[var(--foreground)]">{formatDate(stats.membership?.since)}</strong></span></div>
          <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]"><BadgeCheck size={17} className="text-[var(--primary)]" /><span>Identity and payments are connected securely</span></div>
        </section>
      </div>
    </div>
  )
}
