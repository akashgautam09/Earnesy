'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Coffee,
  ExternalLink,
  ShieldCheck,
  Check,
  CalendarDays,
  HeartHandshake,
  ArrowUpRight,
  ArrowRight,
  UsersRound,
  Coins,
  Loader2,
  ReceiptText,
} from 'lucide-react'
import AppPageHeader from '@/components/AppPageHeader'
import AppStatCard from '@/components/AppStatCard'

export default function MyMembershipsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('memberships') // 'memberships' | 'coffees'

  useEffect(() => {
    const loadMyMemberships = async () => {
      try {
        const response = await fetch('/api/my-memberships')
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Failed to load your memberships')
        }
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadMyMemberships()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        <Loader2 size={18} className="animate-spin text-[var(--primary)] mr-2" />
        Loading your memberships...
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-sm text-red-700">
        {error}
      </div>
    )
  }

  const memberships = data?.memberships || []
  const coffees = data?.coffees || []
  const stats = data?.stats || {
    activeMembershipsCount: 0,
    totalCoffeesCount: 0,
    totalContributed: 0,
    creatorsSupportedCount: 0,
  }

  return (
    <div className="min-h-screen bg-[#f4ecef5c] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-7">
        <AppPageHeader
          eyebrow="Supporter Hub"
          title="My Memberships & Support"
          description="Manage the creators you support, access your exclusive perks, and jump directly into Discord VIP communities."
          action={
            <Link
              href="/"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:opacity-90"
            >
              <span>Explore Creators</span>
              <ArrowRight size={15} />
            </Link>
          }
        />

        {/* Top Summary KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AppStatCard
            icon={HeartHandshake}
            label="Active Memberships"
            value={stats.activeMembershipsCount}
            detail={`${stats.creatorsSupportedCount} creators backed`}
          />
          <AppStatCard
            icon={Coins}
            label="Total Contributed"
            value={`₹${stats.totalContributed.toLocaleString('en-IN')}`}
            detail="Lifetime support given"
          />
          <AppStatCard
            icon={Coffee}
            label="Coffees Sent"
            value={stats.totalCoffeesCount}
            detail="One-time appreciative tips"
          />
          <AppStatCard
            icon={UsersRound}
            label="Creators Backed"
            value={stats.creatorsSupportedCount}
            detail="Independent makers supported"
          />
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveTab('memberships')}
            className={`relative flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
              activeTab === 'memberships'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            <Sparkles size={16} />
            <span>Active Memberships</span>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
              {memberships.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coffees')}
            className={`relative flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
              activeTab === 'coffees'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            <Coffee size={16} />
            <span>One-Time Coffees</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              {coffees.length}
            </span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: ACTIVE MEMBERSHIPS */}
        {/* ========================================================= */}
        {activeTab === 'memberships' && (
          <div className="space-y-5">
            {memberships.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_4px_20px_rgba(25,25,25,0.03)] transition hover:shadow-md"
                  >
                    <div>
                      {/* Creator Header */}
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/${membership.creator.username}`}
                          className="flex items-center gap-3 group"
                        >
                          {membership.creator.profileUrl ? (
                            <img
                              src={membership.creator.profileUrl}
                              alt=""
                              className="h-12 w-12 rounded-full border border-[var(--border)] object-cover shadow-xs"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 font-bold text-white shadow-xs">
                              {membership.creator.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <h3 className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition flex items-center gap-1">
                              <span>{membership.creator.name}</span>
                              <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition" />
                            </h3>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              @{membership.creator.username}
                            </p>
                          </div>
                        </Link>

                        {/* Tier Title Badge */}
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 shrink-0">
                          💎 {membership.tierTitle}
                        </span>
                      </div>

                      {/* Creator Headline / Tagline if available */}
                      {membership.creator.title && (
                        <p className="mt-2.5 text-xs text-slate-600 line-clamp-1 italic">
                          &quot;{membership.creator.title}&quot;
                        </p>
                      )}

                      {/* Subscription Info Box */}
                      <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--muted)]/50 p-3 text-xs">
                        <div>
                          <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                            Plan
                          </span>
                          <p className="font-bold text-[var(--foreground)]">
                            ₹{membership.tierPrice}{' '}
                            <span className="font-normal text-slate-400">/ month</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                            Subscribed
                          </span>
                          <p className="flex items-center gap-1 text-slate-600 font-medium">
                            <CalendarDays size={12} />
                            {new Date(membership.joinedAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Included Perks Checklist */}
                      {membership.perks && membership.perks.length > 0 && (
                        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Your Unlocked Perks:
                          </p>
                          <ul className="space-y-1">
                            {membership.perks.map((perk, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                                <Check size={13} className="mt-0.5 text-emerald-600 shrink-0" />
                                <span>{perk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Discord Perk Status & Action Buttons */}
                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-3">
                      {/* Discord Role Status Pill */}
                      {membership.discordRoleAssigned ? (
                        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800 font-medium">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-emerald-600" />
                            <span>Discord VIP Role Active</span>
                          </span>
                          <span className="text-[11px] text-emerald-600 font-semibold">Synced ✅</span>
                        </div>
                      ) : membership.creator.hasDiscord ? (
                        <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1.5 text-xs text-indigo-900 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Sparkles size={13} className="text-[#5865F2]" />
                            <span>Discord Community Available</span>
                          </span>
                        </div>
                      ) : null}

                      {/* Action Links */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${membership.creator.username}?tab=feed`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] py-2 text-xs font-semibold text-white shadow-xs transition hover:opacity-90"
                        >
                          <Sparkles size={13} />
                          <span>View Exclusive Posts</span>
                        </Link>

                        {membership.creator.discordInviteUrl && (
                          <a
                            href={membership.creator.discordInviteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-[#5865F2] hover:bg-indigo-50 transition"
                            title="Join Discord Server"
                          >
                            <span>Discord</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-12 text-center shadow-xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <Sparkles size={26} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  You haven&apos;t joined any creator memberships yet
                </h3>
                <p className="mx-auto mt-1.5 max-w-sm text-xs text-slate-500">
                  Support your favorite creators monthly to unlock members-only posts, custom Discord VIP roles, and behind-the-scenes content.
                </p>
                <div className="mt-6">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:opacity-90"
                  >
                    <span>Browse Creators</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ONE-TIME COFFEE TIPS */}
        {/* ========================================================= */}
        {activeTab === 'coffees' && (
          <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_4px_20px_rgba(25,25,25,0.03)]">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold text-[var(--foreground)]">Coffee Tips Sent</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                A history of your one-time appreciative contributions.
              </p>
            </div>

            {coffees.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {coffees.map((coffee) => (
                  <div
                    key={coffee.id}
                    className="flex flex-col gap-3 px-5 py-4 transition hover:bg-[var(--muted)]/20 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
                        <Coffee size={18} />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/${coffee.creator.username}`}
                            className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition flex items-center gap-1"
                          >
                            <span>{coffee.creator.name}</span>
                            <ArrowUpRight size={13} className="text-slate-400" />
                          </Link>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            @{coffee.creator.username}
                          </span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                          <CalendarDays size={12} />
                          {new Date(coffee.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end sm:gap-4">
                      <p className="text-base font-bold text-slate-900">
                        ₹{Math.round((coffee.amount || 0) / 100)}
                      </p>
                      <Link
                        href={`/${coffee.creator.username}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                      >
                        <span>Support again</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                  <Coffee size={22} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[var(--foreground)]">
                  No coffees sent yet
                </h3>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  When you send a one-time coffee tip to creators, it will be listed here.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
