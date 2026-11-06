'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Sparkles,
  Coffee,
  UsersRound,
  ArrowRight,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Compass,
  X,
} from 'lucide-react'

const CATEGORIES = [
  'All',
  'Tech & Coding',
  'Art & Design',
  'Writing',
  'Podcasts & Audio',
  'Gaming',
  'Education',
]

export default function ExplorePage() {
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const fetchCreators = async (query = '') => {
    try {
      setLoading(true)
      const url = query ? `/api/creators?query=${encodeURIComponent(query)}` : '/api/creators'
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load creators')
      setCreators(data.creators || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchCreators()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchCreators(searchQuery.trim())
  }

  const filteredCreators = creators.filter((creator) => {
    if (selectedCategory === 'All') return true
    const text = `${creator.name} ${creator.title} ${creator.bio}`.toLowerCase()
    const catWords = selectedCategory.toLowerCase().split('&').map((w) => w.trim())
    return catWords.some((w) => text.includes(w))
  })

  return (
    <div className="min-h-screen bg-[#f4ecef5c] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto pt-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
            <Compass size={14} />
            <span>Discover Creators</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore Independent Creators
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Support creators directly with a coffee or join their inner circle for exclusive updates, posts, and Discord VIP perks.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="pt-2 relative max-w-lg mx-auto">
            <div className="relative flex items-center">
              <Search size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, creative topic, or headline..."
                className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-24 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    fetchCreators('')
                  }}
                  className="absolute right-20 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 rounded-xl bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:opacity-90"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Category Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3.5 py-1.5 font-medium transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Creators Grid */}
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500">
            <Loader2 size={22} className="animate-spin inline mr-2 text-[var(--primary)]" />
            Discovering creators...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700 max-w-md mx-auto">
            {error}
          </div>
        ) : filteredCreators.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCreators.map((creator) => (
              <div
                key={creator.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md hover:border-[var(--primary)]/40"
              >
                <div>
                  {/* Card Cover Banner */}
                  <div className="relative h-24 bg-gradient-to-r from-purple-100 via-pink-50 to-amber-100">
                    {creator.coverUrl && (
                      <img
                        src={creator.coverUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  {/* Creator Info & Avatar */}
                  <div className="px-5 pb-5 pt-0">
                    <div className="relative -mt-8 flex items-end justify-between">
                      {creator.profileUrl ? (
                        <img
                          src={creator.profileUrl}
                          alt={creator.name}
                          className="h-16 w-16 rounded-full border-4 border-white object-cover shadow-sm bg-white"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-purple-500 to-indigo-600 text-lg font-bold text-white shadow-sm">
                          {creator.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {creator.hasDiscord && (
                        <span
                          title="Offers Discord VIP Role rewards"
                          className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700"
                        >
                          <ShieldCheck size={13} />
                          Discord VIP
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      <Link
                        href={`/${creator.username}`}
                        className="text-base font-bold text-slate-900 hover:text-[var(--primary)] transition flex items-center gap-1 group"
                      >
                        <span>{creator.name}</span>
                        <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition" />
                      </Link>
                      <p className="text-xs text-slate-400">@{creator.username}</p>
                    </div>

                    {creator.title ? (
                      <p className="mt-2 text-xs font-medium text-slate-700 line-clamp-2">
                        {creator.title}
                      </p>
                    ) : creator.bio ? (
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                        {creator.bio}
                      </p>
                    ) : null}

                    {/* Stats Pill Row */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      {creator.tiersCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-700 border border-purple-100">
                          <Sparkles size={12} />
                          {creator.tiersCount} Tiers (from ₹{creator.minTierPrice}/mo)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 border border-amber-100">
                          <Coffee size={12} />
                          One-time Coffees
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        <UsersRound size={12} />
                        {creator.supportersCount} supporters
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50">
                  <Link
                    href={`/${creator.username}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] py-2 text-xs font-semibold text-white shadow-xs transition hover:opacity-95"
                  >
                    <span>View Page & Support</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center max-w-md mx-auto">
            <Compass size={28} className="mx-auto text-slate-400" />
            <h3 className="mt-3 text-sm font-bold text-slate-900">No creators found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Try searching with different keywords or reset your category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
                fetchCreators('')
              }}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
