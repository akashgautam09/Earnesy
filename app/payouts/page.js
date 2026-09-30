'use client'

import { useEffect, useState } from 'react'
import { ArrowDownToLine, CalendarDays, Coins, ReceiptText } from 'lucide-react'

const formatAmount = (amount) => `₹${(Number(amount || 0) / 100).toLocaleString('en-IN')}`

export default function PayoutsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading payouts...</div>
  if (error) return <div className="mx-auto max-w-4xl px-6 py-12 text-sm text-red-700">{error}</div>

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="border-b border-[var(--border)] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Payouts</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Payment history</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Track completed support and your total creator earnings.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><Coins className="text-[var(--primary)]" size={20} /><p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Total earnings</p><p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{formatAmount(data?.stats?.totalEarnings)}</p></div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><ReceiptText className="text-[var(--primary)]" size={20} /><p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Completed payments</p><p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{data?.payments?.length || 0}</p></div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><ArrowDownToLine className="text-[var(--primary)]" size={20} /><p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Supporters</p><p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{data?.stats?.supporters || 0}</p></div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="border-b border-[var(--border)] px-5 py-4"><h2 className="font-semibold text-[var(--foreground)]">Recent payments</h2></div>
          {data?.payments?.length ? (
            <div className="divide-y divide-[var(--border)]">
              {data.payments.map((payment) => (
                <div key={payment.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-medium text-[var(--foreground)]">{payment.from}</p><p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted-foreground)]"><CalendarDays size={13} />{new Date(payment.createdAt).toLocaleDateString()}</p></div>
                  <p className="font-semibold text-emerald-700">{formatAmount(payment.amount)}</p>
                </div>
              ))}
            </div>
          ) : <p className="px-5 py-10 text-center text-sm text-[var(--muted-foreground)]">Completed payments will appear here.</p>}
        </section>
      </div>
    </div>
  )
}
