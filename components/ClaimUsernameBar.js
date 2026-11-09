'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Sparkles, UserCheck } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

export default function ClaimUsernameBar({ currentUsername }) {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  const activeUsername = currentUsername || user?.username || ''

  const handleClaim = (e) => {
    e.preventDefault()
    const trimmed = username.trim().toLowerCase()

    if (!trimmed) {
      setError('Please choose a username.')
      return
    }

    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters long.')
      return
    }

    if (!/^[a-z0-9_-]+$/.test(trimmed)) {
      setError('Only lowercase letters, numbers, hyphens, and underscores are allowed.')
      return
    }

    // Direct to sign-up (or dashboard if already signed in)
    if (isSignedIn) {
      router.push(`/${encodeURIComponent(trimmed)}`)
    } else {
      router.push(`/sign-up?username=${encodeURIComponent(trimmed)}`)
    }
  }

  // If user is already authenticated with a page
  if (isSignedIn && activeUsername) {
    return (
      <div className="w-full max-w-xl mx-auto rounded-2xl bg-white/90 border border-rose-100 p-4 sm:p-5 shadow-sm text-center space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--primary)] bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
          <UserCheck size={14} />
          <span>Creator Account Active</span>
        </div>
        <p className="text-sm sm:text-base font-semibold text-slate-900">
          Welcome back, <span className="text-[var(--primary)] font-bold">@{activeUsername}</span>!
        </p>
        <p className="text-xs text-slate-500">
          Your public creator page is live and ready for supporters.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <Link
            href={`/${encodeURIComponent(activeUsername)}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs sm:text-sm font-bold shadow-xs hover:opacity-90 transition active:scale-95"
          >
            <span>View Public Page</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs sm:text-sm font-bold transition active:scale-95"
          >
            <span>Creator Studio</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-3">
      <form onSubmit={handleClaim} className="relative">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-2xl p-1.5 sm:p-2 border border-slate-200 shadow-md shadow-slate-200/60 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 transition-all">
          <div className="flex items-center px-3.5 py-2 sm:py-2 text-slate-400 font-semibold text-sm sm:text-base select-none shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100">
            <span className="text-[var(--primary)] font-bold mr-0.5">earnesy.com/</span>
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
              setUsername(sanitized)
              if (error) setError('')
            }}
            placeholder="yourname"
            maxLength={30}
            className="flex-1 bg-transparent px-3 py-2.5 sm:py-2 text-sm sm:text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="mt-2 sm:mt-0 px-6 py-3 sm:py-3.5 bg-[var(--primary)] hover:opacity-90 text-white font-bold text-sm sm:text-base rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0 shadow-sm"
          >
            <Sparkles size={16} />
            <span>Claim My Page</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>

      {error ? (
        <p className="text-xs text-rose-600 font-medium text-center">{error}</p>
      ) : (
        <div className="flex items-center justify-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1">✨ Free forever</span>
          <span>•</span>
          <span className="flex items-center gap-1">⚡ 60-second setup</span>
          <span>•</span>
          <span className="flex items-center gap-1">💳 100% Direct payouts</span>
        </div>
      )}
    </div>
  )
}
