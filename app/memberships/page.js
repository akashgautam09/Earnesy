'use client'

import Link from 'next/link'
import { BadgeCheck, HeartHandshake, Sparkles } from 'lucide-react'

export default function MembershipsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="border-b border-[var(--border)] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Memberships</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Build your supporter community</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Your creator account is ready for direct support. Membership tiers can be added when recurring plans are enabled.</p>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[var(--primary)]/30 bg-[var(--card)] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.16em] text-[var(--primary)]">Current plan</p><h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Free creator</h2></div><BadgeCheck className="text-[var(--primary)]" size={24} /></div>
            <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">Accept one-time support, share your public page, and keep your creator profile active.</p>
            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-700"><HeartHandshake size={17} /> Active membership</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"><Sparkles className="text-[var(--primary)]" size={22} /><h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">Coming next</h2><p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">Recurring membership tiers, benefits, and supporter-only posts will appear here when enabled.</p><Link href="/post" className="mt-5 inline-flex text-sm font-semibold text-[var(--primary)] hover:underline">Create a post <span className="ml-1">-&gt;</span></Link></div>
        </section>
      </div>
    </div>
  )
}
