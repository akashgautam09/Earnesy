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
} from 'lucide-react'
import AppPageHeader from '@/components/AppPageHeader'
import AppStatCard from '@/components/AppStatCard'

const formatAmount = (amount) => `₹${(Number(amount || 0) / 100).toLocaleString('en-IN')}`

export default function PayoutsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'coffee' | 'tier'

  useEffect(() => {
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

    loadPayouts()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">
        Loading payouts...
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
  const coffeePayments = payments.filter((p) => !p.isTier)
  const tierPayments = payments.filter((p) => p.isTier)

  const filteredPayments =
    filter === 'coffee'
      ? coffeePayments
      : filter === 'tier'
      ? tierPayments
      : payments

  const totalCoffeeEarnings = coffeePayments.reduce((acc, p) => acc + (p.amount || 0), 0)
  const totalTierEarnings = tierPayments.reduce((acc, p) => acc + (p.amount || 0), 0)

  return (
    <div className="min-h-screen bg-[#f4ecef5c] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-7">
        <AppPageHeader
          eyebrow="Payouts & Revenue"
          title="Payment History"
          description="Track incoming coffee tips, recurring tier memberships, and your total creator earnings."
          action={
            <Link
              href="/memberships?tab=members"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-xs transition hover:bg-[var(--muted)]"
            >
              <Sparkles size={16} className="text-purple-600" />
              <span>View Active Members</span>
              <ArrowRight size={15} />
            </Link>
          }
        />

        {/* Top Analytics Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <AppStatCard
            icon={Coins}
            label="Total Earnings"
            value={formatAmount(data?.stats?.totalEarnings)}
            detail={`☕ ${formatAmount(totalCoffeeEarnings)} tips • 💎 ${formatAmount(totalTierEarnings)} tiers`}
          />
          <AppStatCard
            icon={ReceiptText}
            label="Completed Payments"
            value={payments.length}
            detail={`${coffeePayments.length} coffees • ${tierPayments.length} memberships`}
          />
          <AppStatCard
            icon={ArrowDownToLine}
            label="Unique Supporters"
            value={data?.stats?.supporters || 0}
            detail="Direct contributions received"
          />
        </div>

        {/* Filter Pills and Transactions Card */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_4px_20px_rgba(25,25,25,0.03)]">
          <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">Transactions</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Showing {filteredPayments.length} of {payments.length} payments
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--muted)]/50 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-md px-3 py-1.5 transition ${
                  filter === 'all'
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                All ({payments.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('coffee')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                  filter === 'coffee'
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
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                  filter === 'tier'
                    ? 'bg-[var(--card)] text-purple-700 shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <Sparkles size={13} />
                <span>Memberships ({tierPayments.length})</span>
              </button>
            </div>
          </div>

          {/* Payments List */}
          {filteredPayments.length > 0 ? (
            <div className="divide-y divide-[var(--border)]">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-[var(--muted)]/20 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Icon Bubble */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base ${
                        payment.isTier
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

                  <div className="text-right sm:self-center">
                    <p className="text-base font-bold text-emerald-700 sm:text-lg">
                      +{formatAmount(payment.amount)}
                    </p>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-600">
                      Completed
                    </span>
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
