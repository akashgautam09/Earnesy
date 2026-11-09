'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

// ─── Helpers ────────────────────────────────────────────────────────────────

const rupees = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const shortDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

const statusBadge = (status) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-1 ${accent ? 'ring-2 ring-blue-500' : ''}`}>
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

// ─── Process Payout Modal ────────────────────────────────────────────────────

function ProcessPayoutModal({ payout, onClose, onSuccess }) {
  const [action, setAction] = useState('completed')
  const [referenceId, setReferenceId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (action === 'completed' && !referenceId.trim()) {
      setError('Reference ID (UTR / transaction ID) is required for completed payouts.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payout.id,
          status: action,
          referenceId: referenceId.trim(),
          notes: notes.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to update payout')
        return
      }
      onSuccess(data.message)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Process Payout</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-5 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Creator</span>
            <span className="font-semibold text-gray-900 dark:text-white">@{payout.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold text-blue-600">{rupees(payout.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Method</span>
            <span className="text-gray-900 dark:text-white capitalize">{payout.payoutMethod}</span>
          </div>
          {payout.payoutMethod === 'upi' && payout.payoutDetails?.upiId && (
            <div className="flex justify-between">
              <span className="text-gray-500">UPI ID</span>
              <span className="font-mono text-gray-900 dark:text-white text-xs">{payout.payoutDetails.upiId}</span>
            </div>
          )}
          {payout.payoutMethod === 'bank' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">Account</span>
                <span className="font-mono text-xs text-gray-900 dark:text-white">{payout.payoutDetails?.accountNumber || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IFSC</span>
                <span className="font-mono text-xs text-gray-900 dark:text-white">{payout.payoutDetails?.ifsc || '—'}</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Requested</span>
            <span className="text-gray-900 dark:text-white">{shortDate(payout.createdAt)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
            <div className="flex gap-3">
              {['completed', 'rejected'].map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value={s}
                    checked={action === s}
                    onChange={() => setAction(s)}
                    className="accent-blue-600"
                  />
                  <span className={`capitalize font-medium text-sm ${s === 'completed' ? 'text-green-600' : 'text-red-500'}`}>{s}</span>
                </label>
              ))}
            </div>
          </div>

          {action === 'completed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                UTR / Transaction ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. 123456789012"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={action === 'completed'}
              />
              <p className="text-xs text-gray-400 mt-1">The UTR or reference ID of your bank/UPI transfer to this creator.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any internal notes..."
              rows={2}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${
                action === 'completed'
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                  : 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
              }`}
            >
              {loading ? 'Processing…' : action === 'completed' ? '✓ Mark Paid' : '✗ Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const [stats, setStats] = useState(null)
  const [recentPayments, setRecentPayments] = useState([])
  const [topCreators, setTopCreators] = useState([])
  const [payoutRequests, setPayoutRequests] = useState([])
  const [payoutFilter, setPayoutFilter] = useState('pending')
  const [payoutTotal, setPayoutTotal] = useState(0)
  const [payoutPage, setPayoutPage] = useState(1)
  const [payoutTotalPages, setPayoutTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [payoutsLoading, setPayoutsLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [selectedPayout, setSelectedPayout] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'payouts'

  const showToast = (msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 4000)
  }

  // Load platform stats
  const loadStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load stats')
        return
      }
      setStats(data.stats)
      setRecentPayments(data.recentPayments || [])
      setTopCreators(data.topCreators || [])
    } catch {
      setError('Network error while loading stats.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load payout requests
  const loadPayouts = useCallback(async (filter, page) => {
    setPayoutsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (filter !== 'all') params.set('status', filter)
      const res = await fetch(`/api/admin/payouts?${params}`)
      const data = await res.json()
      if (!res.ok || !data.success) return
      setPayoutRequests(data.payoutRequests || [])
      setPayoutTotal(data.total || 0)
      setPayoutTotalPages(data.totalPages || 1)
    } catch {
      // silent
    } finally {
      setPayoutsLoading(false)
    }
  }, [])

  useEffect(() => {
    window.setTimeout(() => loadStats(), 0)
  }, [loadStats])

  useEffect(() => {
    if (activeTab === 'payouts') {
      window.setTimeout(() => loadPayouts(payoutFilter, payoutPage), 0)
    }
  }, [activeTab, payoutFilter, payoutPage, loadPayouts])

  const handlePayoutSuccess = (message) => {
    setSelectedPayout(null)
    showToast(message)
    loadPayouts(payoutFilter, payoutPage)
    loadStats()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading admin panel…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center shadow-lg max-w-md w-full">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in">
          ✓ {toast}
        </div>
      )}

      {/* Modal */}
      {selectedPayout && (
        <ProcessPayoutModal
          payout={selectedPayout}
          onClose={() => setSelectedPayout(null)}
          onSuccess={handlePayoutSuccess}
        />
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">A</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Earnesy Admin</h1>
              <p className="text-xs text-gray-400">Platform Owner Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats?.pendingPayoutRequests > 0 && (
              <button
                onClick={() => { setActiveTab('payouts'); setPayoutFilter('pending') }}
                className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700 rounded-xl px-3 py-1.5 text-xs font-semibold hover:bg-yellow-100 transition-colors"
              >
                <span className="w-4 h-4 bg-yellow-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                  {stats.pendingPayoutRequests}
                </span>
                Pending Payouts
              </button>
            )}
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors"
            >
              ← Back to Site
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 border-b border-transparent">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'payouts', label: `Payout Requests${stats?.pendingPayoutRequests > 0 ? ` (${stats.pendingPayoutRequests})` : ''}` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Creators" value={stats?.totalCreators?.toLocaleString() || '0'} sub="registered users" />
              <StatCard label="Total Payments" value={stats?.totalPayments?.toLocaleString() || '0'} sub="successful transactions" />
              <StatCard
                label="Platform Revenue (2%)"
                value={rupees(stats?.totalPlatformRevenue)}
                sub="your earnings from fees"
                accent
              />
              <StatCard
                label="Gross Volume"
                value={rupees(stats?.totalGrossRevenue)}
                sub="total fan contributions"
              />
            </div>

            {/* Payout summary row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="Pending Payout Requests"
                value={stats?.pendingPayoutRequests || '0'}
                sub={`${rupees(stats?.pendingPayoutAmount)} awaiting transfer`}
              />
              <StatCard
                label="Completed Payouts"
                value={stats?.completedPayoutRequests || '0'}
                sub={`${rupees(stats?.completedPayoutAmount)} paid out`}
              />
              <StatCard
                label="Creator Net Earnings"
                value={rupees(stats?.totalCreatorPayouts)}
                sub="after platform 2% fee"
              />
            </div>

            {/* Two columns: recent payments + top creators */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Recent Payments */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Payments</h2>
                </div>
                {recentPayments.length === 0 ? (
                  <div className="px-5 py-10 text-center text-gray-400 text-sm">No payments yet</div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {recentPayments.map((p) => (
                      <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white truncate">
                            <span className="font-medium">{p.from || 'Anonymous'}</span>
                            <span className="text-gray-400 mx-1">→</span>
                            <span className="font-medium">@{p.to}</span>
                            {p.tierTitle && <span className="ml-1 text-xs text-blue-500">({p.tierTitle})</span>}
                          </p>
                          <p className="text-xs text-gray-400">{shortDate(p.createdAt)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{rupees(p.amount)}</p>
                          <p className="text-xs text-green-600">+{rupees(p.platformFee)} fee</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Creators */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Top Creators by Earnings</h2>
                </div>
                {topCreators.length === 0 ? (
                  <div className="px-5 py-10 text-center text-gray-400 text-sm">No data yet</div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {topCreators.map((c, i) => (
                      <div key={c.username} className="px-5 py-3 flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/${c.username}`}
                            target="_blank"
                            className="text-sm font-medium text-blue-600 hover:underline truncate block"
                          >
                            @{c.username}
                          </Link>
                          <p className="text-xs text-gray-400">{c.paymentCount} payments</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{rupees(c.grossEarnings)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PAYOUTS TAB ──────────────────────────────────────────────── */}
        {activeTab === 'payouts' && (
          <div className="space-y-5">
            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'pending', label: '⏳ Pending' },
                { id: 'completed', label: '✓ Completed' },
                { id: 'rejected', label: '✗ Rejected' },
                { id: 'all', label: 'All' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setPayoutFilter(f.id); setPayoutPage(1) }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    payoutFilter === f.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-blue-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="ml-auto text-sm text-gray-400">{payoutTotal} requests</span>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {payoutsLoading ? (
                <div className="py-16 text-center">
                  <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : payoutRequests.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">
                  No {payoutFilter !== 'all' ? payoutFilter : ''} payout requests
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Creator</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Method</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Requested</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref ID</th>
                        {payoutFilter === 'pending' && (
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {payoutRequests.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-5 py-3">
                            <Link href={`/${r.username}`} target="_blank" className="font-medium text-blue-600 hover:underline">
                              @{r.username}
                            </Link>
                          </td>
                          <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{rupees(r.amount)}</td>
                          <td className="px-5 py-3 capitalize text-gray-700 dark:text-gray-300">{r.payoutMethod}</td>
                          <td className="px-5 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">
                            {r.payoutMethod === 'upi'
                              ? r.payoutDetails?.upiId || '—'
                              : r.payoutDetails?.accountNumber
                                ? `${r.payoutDetails.accountNumber} / ${r.payoutDetails.ifsc}`
                                : '—'}
                          </td>
                          <td className="px-5 py-3">{statusBadge(r.status)}</td>
                          <td className="px-5 py-3 text-gray-500">{shortDate(r.createdAt)}</td>
                          <td className="px-5 py-3 text-xs font-mono text-gray-500">
                            {r.referenceId || <span className="text-gray-300">—</span>}
                          </td>
                          {payoutFilter === 'pending' && (
                            <td className="px-5 py-3">
                              {r.status === 'pending' ? (
                                <button
                                  onClick={() => setSelectedPayout(r)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Process
                                </button>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {payoutTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPayoutPage((p) => Math.max(1, p - 1))}
                  disabled={payoutPage === 1}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-500">
                  Page {payoutPage} of {payoutTotalPages}
                </span>
                <button
                  onClick={() => setPayoutPage((p) => Math.min(payoutTotalPages, p + 1))}
                  disabled={payoutPage === payoutTotalPages}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
