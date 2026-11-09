'use client'

import Link from 'next/link'
import { Coffee, Compass, House, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent)] text-[var(--primary)] shadow-sm">
        <Coffee size={38} className="stroke-[2.2]" />
        <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white shadow-xs">
          404
        </span>
      </div>

      <h1 className="text-3xl   tracking-tight text-[var(--foreground)] sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm text-[var(--muted-foreground)] sm:text-base leading-relaxed">
        The creator page, post, or link you are looking for doesn&apos;t exist or has moved.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:opacity-95"
        >
          <House size={16} />
          <span>Back to Home</span>
        </Link>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]"
        >
          <Compass size={16} className="text-[var(--primary)]" />
          <span>Explore Creators</span>
        </Link>
      </div>
    </div>
  )
}
