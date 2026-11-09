'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, House } from 'lucide-react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Unhandled app error:', error)
  }, [error])

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="mb-6 flex h-18 w-18 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 shadow-xs">
        <AlertTriangle size={36} />
      </div>

      <h1 className="text-2xl   tracking-tight text-[var(--foreground)] sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-[var(--muted-foreground)] leading-relaxed">
        We encountered an unexpected error processing this page. Please try refreshing or return home.
      </p>

      <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:opacity-95"
        >
          <RotateCcw size={16} />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]"
        >
          <House size={16} />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  )
}
