'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownToLine,
  CalendarDays,
  Coins,
  ReceiptText,
  Coffee,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Percent,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
} from 'lucide-react'
import AppPageHeader from '@/components/AppPageHeader'
import AppStatCard from '@/components/AppStatCard'

const formatAmount = (amount) => `₹${(Number(amount || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function PayoutsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'coffee' | 'tier' | 'payouts'
  const [requestingPayout, setRequestingPayout] = useState(false)
  const [payoutMsg, setPayoutMsg] = useState('')

  const loadPayouts = async () => {
    try {
      const response = await fetch('/api/payouts')
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not load payouts')
      setData(result)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPayouts()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const handleRequestPayout = async () => {
    const minPayout = data?.minPayoutAmountPaise || 10000
    const available = data?.stats?.availableBalance || 0
    if (available < minPayout) return

    setRequestingPayout(true)
    setPayoutMsg('')

    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: available }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to submit payout request')

      setPayoutMsg(`Payout of ${formatAmount(available)} requested! Funds will be transferred to your account.`)
      await loadPayouts()
      setTimeout(() => setPayoutMsg(''), 5000)
    } catch (err) {
      setPayoutMsg(`Error: ${err.message}`)
      setTimeout(() => setPayoutMsg(''), 5000)
    } finally {
      setRequestingPayout(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">
        <Loader2 className="animate-spin text-[var(--primary)] mr-2" size={18} />
        Loading payouts & revenue...
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

  const payments = data?.payments || []
  const payoutRequests = data?.payoutRequests || []
  const coffeePayments = payments.filter((p) => !p.isTier)
  const tierPayments = payments.filter((p) => p.isTier)

  const filteredPayments =
    filter === 'coffee'
      ? coffeePayments
      : filter === 'tier'
        ? tierPayments
        : payments

  const totalGross = data?.stats?.grossEarnings || data?.stats?.totalEarnings || 0
  const platformFee = data?.stats?.platformFees || Math.round(totalGross * 0.02)
  const netEarnings = data?.stats?.netEarnings || (totalGross - platformFee)
  const availableBalance = data?.stats?.availableBalance || 0
  const totalPaidOut = data?.stats?.totalPaidOut || 0

  const hasPayoutAccount = Boolean(data?.payoutUpiId || data?.payoutAccountNumber)

  return (
    <div className="min-h-screen bg-[#f4ecef5c] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-7">
        <AppPageHeader
          eyebrow="Payouts & Revenue"
          title="Earnings & Payouts"
          description="Track incoming supporter contributions, your transparent 2% platform fee, and withdraw your earnings."
          action={
            <Link
              href="/memberships?tab=members"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-xs transition hover:bg-[var(--muted)]"
            >
              <Sparkles size={16} className="text-purple-600" />
              <span>Active Members</span>
              <ArrowRight size={15} />
            </Link>
          }
        />

        {/* Available Balance & Payout Withdrawal Card */}
        <section className="rounded-3xl border border-rose-200 bg-gradient-to-br from-white via-rose-50/30 to-amber-50/20 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1.5">
                <Wallet size={15} />
                <span>Available to Withdraw</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-[650] text-slate-900">
                {formatAmount(availableBalance)}
              </h2>
              <p className="text-xs text-slate-500">
                {hasPayoutAccount ? (
                  <span>
                    Linked account: <strong className="text-slate-800">{data?.payoutMethod === 'bank' ? `Bank (${data?.payoutAccountNumber?.slice(-4) || '****'})` : `UPI (${data?.payoutUpiId})`}</strong>
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold">
                    ⚠️ No payout method configured. <Link href="/dashboard" className="underline font-bold">Add your UPI ID in Dashboard</Link> to withdraw.
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRequestPayout}
                disabled={requestingPayout || availableBalance < (data?.minPayoutAmountPaise || 10000) || !hasPayoutAccount}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:opacity-90 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {requestingPayout ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Request Payout</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-slate-400">
                Minimum payout: {formatAmount(data?.minPayoutAmountPaise || 10000)} • Direct transfer
              </span>
            </div>
          </div>

          {payoutMsg && (
            <div className={`mt-4 rounded-xl p-3 text-xs font-semibold ${payoutMsg.startsWith('Error') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
              {payoutMsg}
            </div>
          )}
        </section>

        {/* 4-Stat Revenue Breakdown Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AppStatCard
            icon={Coins}
            label="Gross Fan Support"
            value={formatAmount(totalGross)}
            detail="100% total paid by supporters"
          />
          <AppStatCard
            icon={Percent}
            label="Platform Fee (2%)"
            value={`-${formatAmount(platformFee)}`}
            detail="Earnesy server & bot fee"
          />
          <AppStatCard
            icon={ReceiptText}
            label="Net Creator Earnings"
            value={formatAmount(netEarnings)}
            detail="Your 98% creator revenue"
          />
          <AppStatCard
            icon={ArrowDownToLine}
            label="Total Paid Out"
            value={formatAmount(totalPaidOut)}
            detail={`${payoutRequests.filter((r) => r.status === 'completed').length} completed payouts`}
          />
        </div>

        {/* Transactions & Payout Requests Card */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_4px_20px_rgba(25,25,25,0.03)]">
          <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">Transaction Activity</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {filter === 'payouts'
                  ? `Showing ${payoutRequests.length} payout requests`
                  : `Showing ${filteredPayments.length} of ${payments.length} supporter contributions`}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 p-1 text-xs font-semibold flex-wrap">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-md px-3 py-1.5 transition ${filter === 'all'
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
              >
                All ({payments.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('coffee')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${filter === 'coffee'
                    ? 'bg-[var(--card)] text-amber-700 shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
              >
                <Coffee size={13} />
                <span>Coffees ({coffeePayments.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('tier')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${filter === 'tier'
                    ? 'bg-[var(--card)] text-purple-700 shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
              >
                <Sparkles size={13} />
                <span>Memberships ({tierPayments.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('payouts')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${filter === 'payouts'
                    ? 'bg-[var(--card)] text-emerald-700 shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
              >
                <Wallet size={13} />
                <span>Payouts ({payoutRequests.length})</span>
              </button>
            </div>
          </div>

          {/* List Content */}
          {filter === 'payouts' ? (
            payoutRequests.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {payoutRequests.map((request) => (
                  <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 hover:bg-[var(--muted)]/20 transition">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Wallet size={18} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">Payout to {request.payoutMethod === 'bank' ? 'Bank Account' : 'UPI'}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${request.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : request.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                            {request.status === 'completed' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                            <span className="capitalize">{request.status}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Account: {request.payoutDetails?.upiId || request.payoutDetails?.accountNumber || 'Configured Account'} • Requested on {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:self-center">
                      <p className="text-base font-bold text-slate-900">
                        {formatAmount(request.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-14 text-center space-y-2">
                <Wallet className="mx-auto text-slate-400" size={28} />
                <h3 className="text-sm font-semibold text-slate-900">No payout requests yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When your available balance reaches ₹100, click &ldquo;Request Payout&rdquo; above to transfer funds to your account.
                </p>
              </div>
            )
          ) : filteredPayments.length > 0 ? (
            <div className="divide-y divide-[var(--border)]">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-[var(--muted)]/20 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Icon Bubble */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base ${payment.isTier
                          ? 'border border-purple-200 bg-purple-50 text-purple-700'
                          : 'border border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                    >
                      {payment.isTier ? <Sparkles size={18} /> : <Coffee size={18} />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[var(--foreground)]">
                          {payment.from || 'Anonymous Supporter'}
                        </span>

                        {payment.isTier ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                            💎 {payment.tierTitle || 'Membership Tier'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            ☕ One-time Coffee
                          </span>
                        )}

                        {payment.discordRoleAssigned && (
                          <span
                            title="Discord VIP Role assigned"
                            className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700"
                          >
                            <ShieldCheck size={12} />
                            Discord VIP
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={13} />
                          {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {payment.paymentId && (
                          <span className="font-mono text-[11px] opacity-75">
                            ID: {payment.paymentId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Net creator amount & 2% deduction display */}
                  <div className="text-right sm:self-center">
                    <p className="text-base font-bold text-emerald-700 sm:text-lg">
                      +{formatAmount(payment.creatorAmount || Math.round((payment.amount || 0) * 0.98))}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Gross: {formatAmount(payment.amount)} • Fee (2%): -{formatAmount(payment.platformFee || Math.round((payment.amount || 0) * 0.02))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                <ReceiptText size={22} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[var(--foreground)]">
                No payments found
              </h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {filter !== 'all'
                  ? `No ${filter === 'coffee' ? 'coffee' : 'membership'} transactions recorded yet.`
                  : 'Completed transactions will appear here as supporters support your page.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
