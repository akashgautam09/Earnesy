'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import {
  Users,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Percent,
  Layers,
  ArrowUpRight,
  DollarSign,
  Coffee,
  Sparkles,
  Sliders,
  Megaphone,
  ShieldAlert,
  Save,
} from 'lucide-react'

// ─── Formatting Helpers ──────────────────────────────────────────────────────

const rupees = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const shortDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

const fullDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

// ─── Copy Button Component with Visual Feedback ──────────────────────────────

function CopyButton({ text, label = 'Copied' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e) => {
    e.stopPropagation()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${label}`}
      className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 p-1 rounded hover:bg-slate-100 transition-colors"
    >
      {copied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
    </button>
  )
}

// ─── Stat Card Component ────────────────────────────────────────────────────

function MetricCard({ title, value, subtext, icon: Icon, accent, alert }) {
  return (
    <div
      className={`rounded-2xl border p-5 transition-all shadow-xs ${
        accent
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
          : alert
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              accent
                ? 'bg-blue-600 text-white shadow-xs'
                : alert
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Icon size={17} />
          </div>
        )}
      </div>
      <div className="text-2xl font-black tracking-tight text-slate-950 mb-1">
        {value}
      </div>
      {subtext && <div className="text-xs text-slate-600 font-medium">{subtext}</div>}
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
      setError('Reference ID (UTR or transfer transaction ID) is required for completed payouts.')
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
        setError(data.error || 'Failed to update payout request')
        return
      }
      onSuccess(data.message)
    } catch {
      setError('Network error while processing payout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Process Creator Payout</h3>
              <p className="text-xs text-slate-600">Mark transfer status after sending funds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 rounded-lg p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Transfer Destination Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Creator Account:</span>
            <span className="font-bold text-slate-950">@{payout.username}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Payout Amount:</span>
            <span className="text-sm font-black text-blue-700">
              {rupees(payout.amount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Destination Method:</span>
            <span className="font-bold text-slate-900 uppercase tracking-wider">
              {payout.payoutMethod}
            </span>
          </div>
          {payout.payoutMethod === 'upi' && payout.payoutDetails?.upiId && (
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-medium">UPI ID:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-950 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {payout.payoutDetails.upiId}
                </span>
                <CopyButton text={payout.payoutDetails.upiId} label="UPI ID" />
              </div>
            </div>
          )}
          {payout.payoutMethod === 'bank' && (
            <>
              {payout.payoutDetails?.accountName && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-600 font-medium">Account Holder:</span>
                  <span className="font-bold text-slate-950">
                    {payout.payoutDetails.accountName}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Bank Account Number:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-950 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {payout.payoutDetails?.accountNumber || '—'}
                  </span>
                  <CopyButton text={payout.payoutDetails?.accountNumber} label="Account Number" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">IFSC Code:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-950 uppercase bg-white px-2 py-0.5 rounded border border-slate-200">
                    {payout.payoutDetails?.ifsc || '—'}
                  </span>
                  <CopyButton text={payout.payoutDetails?.ifsc} label="IFSC Code" />
                </div>
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              Resolution Action
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  action === 'completed'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="completed"
                  checked={action === 'completed'}
                  onChange={() => setAction('completed')}
                  className="accent-emerald-600"
                />
                <div>
                  <span className="font-bold text-emerald-900 block">
                    ✓ Mark as Paid
                  </span>
                  <span className="text-[11px] text-slate-600">Funds transferred</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  action === 'rejected'
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="rejected"
                  checked={action === 'rejected'}
                  onChange={() => setAction('rejected')}
                  className="accent-rose-600"
                />
                <div>
                  <span className="font-bold text-rose-900 block">
                    ✗ Reject Request
                  </span>
                  <span className="text-[11px] text-slate-600">Refunds to balance</span>
                </div>
              </label>
            </div>
          </div>

          {action === 'completed' && (
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Bank / UPI Reference ID (UTR) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. 431209823124 or IMPS1234..."
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white text-slate-950 font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required={action === 'completed'}
              />
              <p className="text-[11px] text-slate-600 mt-1">
                The UTR or reference number from your banking / UPI transfer.
              </p>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Internal Admin Note (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Transferred via HDFC netbanking; creator notified."
              rows={2}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-950 font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
            />
          </div>

          {error && (
            <div className="text-xs font-bold text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-300">
              {error}
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 py-2.5 font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-xl py-2.5 font-bold text-white shadow-xs transition ${
                action === 'completed'
                  ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400'
                  : 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400'
              }`}
            >
              {loading ? 'Processing…' : action === 'completed' ? '✓ Mark as Paid' : '✗ Reject Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Creator 360 Drawer Component ───────────────────────────────────────────

function CreatorDrawer({ creator, onClose, onUpdate }) {
  const [status, setStatus] = useState(creator?.status || 'active')
  const [canAcceptTips, setCanAcceptTips] = useState(creator?.canAcceptTips !== false)
  const [feeRate, setFeeRate] = useState(
    typeof creator?.customPlatformFee === 'number' ? String(creator.customPlatformFee) : ''
  )
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  if (!creator) return null

  const handleSaveControls = async () => {
    setSaving(true)
    setSaveMessage('')
    try {
      const parsedFee = feeRate.trim() === '' ? null : Number(feeRate.trim())
      const res = await fetch('/api/admin/creators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: creator.id,
          status,
          canAcceptTips,
          customPlatformFee: parsedFee,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setSaveMessage(data.error || 'Failed to update creator')
        return
      }
      setSaveMessage('Saved successfully!')
      if (onUpdate) {
        onUpdate({
          ...creator,
          status,
          canAcceptTips,
          customPlatformFee: parsedFee,
        })
      }
    } catch {
      setSaveMessage('Network error while saving changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={creator.profileUrl || '/tea.gif'}
              alt={creator.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div>
              <h3 className="text-sm font-bold text-slate-950 leading-tight">
                {creator.name}
              </h3>
              <p className="text-xs text-slate-600 font-semibold">@{creator.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Quick Links */}
          <div className="flex gap-2">
            <Link
              href={`/${creator.username}`}
              target="_blank"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-2.5 font-bold text-slate-800 hover:bg-slate-50 transition"
            >
              <span>View Public Page</span>
              <ExternalLink size={13} />
            </Link>
          </div>

          {/* Headline & Bio */}
          {creator.title && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Headline
              </span>
              <p className="text-slate-900 font-semibold">{creator.title}</p>
            </div>
          )}

          {creator.bio && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Bio
              </span>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                {creator.bio}
              </p>
            </div>
          )}

          {/* Performance Summary */}
          <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-500 block">Gross Volume</span>
              <span className="text-xs font-black text-slate-950">
                {rupees(creator.grossEarnings)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 block">Payments</span>
              <span className="text-xs font-black text-slate-950">
                {creator.paymentsCount}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 block">Active Tiers</span>
              <span className="text-xs font-black text-slate-950">
                {creator.tiersCount}
              </span>
            </div>
          </div>

          {/* Gateway & Payout Coordinates */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Payment & Payout Configuration
            </span>

            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">Razorpay Gateway:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  creator.hasGateway
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                {creator.hasGateway ? '✓ Connected' : '⚠ Unconfigured'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">Payout Target:</span>
              <span className="font-bold text-slate-950 uppercase">
                {creator.payoutMethod || 'upi'}
              </span>
            </div>

            {creator.payoutMethod === 'upi' ? (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block mb-0.5">UPI ID</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-950 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {creator.payoutUpiId || 'Not set'}
                  </span>
                  {creator.payoutUpiId && <CopyButton text={creator.payoutUpiId} label="UPI ID" />}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Account Name</span>
                  <span className="font-bold text-slate-950">
                    {creator.payoutAccountName || 'Not set'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Account Number</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-950 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {creator.payoutAccountNumber || 'Not set'}
                    </span>
                    {creator.payoutAccountNumber && (
                      <CopyButton text={creator.payoutAccountNumber} label="Account Number" />
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-0.5">IFSC</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-950 uppercase bg-white px-2 py-0.5 rounded border border-slate-200">
                      {creator.payoutIfsc || 'Not set'}
                    </span>
                    {creator.payoutIfsc && <CopyButton text={creator.payoutIfsc} label="IFSC Code" />}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Metadata */}
          <div className="border-t border-slate-200 pt-4 space-y-2 text-slate-700">
            <div className="flex justify-between">
              <span className="font-medium">Email:</span>
              <div className="flex items-center gap-1 text-slate-950 font-semibold font-mono">
                <span>{creator.email}</span>
                <CopyButton text={creator.email} label="Email" />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Category:</span>
              <span className="text-slate-950 font-bold">
                {creator.category || 'Uncategorized'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Joined:</span>
              <span className="text-slate-900 font-semibold">{shortDate(creator.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Discord Community:</span>
              <span className="text-slate-950 font-bold">
                {creator.hasDiscord ? '✓ Active' : 'Not linked'}
              </span>
            </div>
          </div>

          {/* Admin Moderation & Financial Controls */}
          <div className="border-t border-slate-200 pt-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Admin Controls & Moderation
              </span>
              {saveMessage && (
                <span
                  className={`text-[11px] font-bold ${
                    saveMessage.includes('successfully') ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {saveMessage}
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
              {/* Account Status Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Account Status</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {status === 'active' ? 'Creator is in good standing' : 'Account suspended (cannot accept tips)'}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                      status === 'active'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('suspended')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                      status === 'suspended'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    Suspend
                  </button>
                </div>
              </div>

              {/* Tipping / Checkout Killswitch */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Accepting Contributions</span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {canAcceptTips ? 'Supporters can send tips/memberships' : 'Checkout widget paused'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCanAcceptTips(!canAcceptTips)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition ${
                    canAcceptTips
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-900 border-amber-300'
                  }`}
                >
                  {canAcceptTips ? '✓ Enabled' : '⏸ Paused'}
                </button>
              </div>

              {/* Custom Platform Fee Override */}
              <div className="pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 block text-xs">Platform Fee Take Rate (%)</span>
                  <span className="text-[10px] text-slate-500 font-medium">Standard: 2%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={feeRate}
                    onChange={(e) => setFeeRate(e.target.value)}
                    placeholder="2 (Standard platform cut)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-950 font-bold outline-none focus:border-blue-600 transition"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Leave blank to use default 2%. Enter custom percentage (e.g., 0 for VIPs / partner waiver).
                </p>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveControls}
                disabled={saving}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={13} className="animate-spin text-white" />
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <span>Save Creator Settings</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'creators' | 'payouts' | 'transactions'

  // Overview Data
  const [stats, setStats] = useState(null)
  const [recentPayments, setRecentPayments] = useState([])
  const [topCreators, setTopCreators] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)

  // Creators Directory Data
  const [creators, setCreators] = useState([])
  const [creatorsTotal, setCreatorsTotal] = useState(0)
  const [creatorsPage, setCreatorsPage] = useState(1)
  const [creatorsTotalPages, setCreatorsTotalPages] = useState(1)
  const [creatorsLoading, setCreatorsLoading] = useState(false)
  const [creatorSearch, setCreatorSearch] = useState('')
  const [creatorGatewayFilter, setCreatorGatewayFilter] = useState('all') // 'all' | 'configured' | 'unconfigured' | 'payout_ready'
  const [selectedCreatorDrawer, setSelectedCreatorDrawer] = useState(null)

  // Payout Requests Queue Data
  const [payouts, setPayouts] = useState([])
  const [payoutsTotal, setPayoutsTotal] = useState(0)
  const [payoutsPage, setPayoutsPage] = useState(1)
  const [payoutsTotalPages, setPayoutsTotalPages] = useState(1)
  const [payoutsLoading, setPayoutsLoading] = useState(false)
  const [payoutFilter, setPayoutFilter] = useState('pending') // 'pending' | 'completed' | 'rejected' | 'all'
  const [selectedPayoutModal, setSelectedPayoutModal] = useState(null)

  // Transactions Ledger Data
  const [transactions, setTransactions] = useState([])
  const [txTotal, setTxTotal] = useState(0)
  const [txPage, setTxPage] = useState(1)
  const [txTotalPages, setTxTotalPages] = useState(1)
  const [txLoading, setTxLoading] = useState(false)
  const [txSearch, setTxSearch] = useState('')
  const [txTypeFilter, setTxTypeFilter] = useState('all') // 'all' | 'coffee' | 'tier'

  // Platform Settings State
  const [settings, setSettings] = useState(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    globalFeePercentage: '2',
    minPayoutAmountRupees: '100',
    maintenanceMode: false,
    announcementEnabled: false,
    announcementMessage: '',
    announcementLevel: 'info',
    announcementLink: '',
  })

  // Common UI State
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 4000)
  }

  // Load Overview Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to authenticate admin access')
        return
      }
      setStats(data.stats)
      setRecentPayments(data.recentPayments || [])
      setTopCreators(data.topCreators || [])
    } catch {
      setError('Could not load platform stats.')
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Load Creators Directory
  const loadCreators = useCallback(async (page = 1, search = '', gateway = 'all') => {
    setCreatorsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        gateway,
      })
      if (search.trim()) params.set('query', search.trim())

      const res = await fetch(`/api/admin/creators?${params}`)
      const data = await res.json()
      if (!res.ok || !data.success) return
      setCreators(data.creators || [])
      setCreatorsTotal(data.total || 0)
      setCreatorsTotalPages(data.totalPages || 1)
      setCreatorsPage(data.page || 1)
    } catch {
      // silent
    } finally {
      setCreatorsLoading(false)
    }
  }, [])

  // Load Payout Requests
  const loadPayouts = useCallback(async (status = 'pending', page = 1) => {
    setPayoutsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (status !== 'all') params.set('status', status)
      const res = await fetch(`/api/admin/payouts?${params}`)
      const data = await res.json()
      if (!res.ok || !data.success) return
      setPayouts(data.payoutRequests || [])
      setPayoutsTotal(data.total || 0)
      setPayoutsTotalPages(data.totalPages || 1)
      setPayoutsPage(data.page || 1)
    } catch {
      // silent
    } finally {
      setPayoutsLoading(false)
    }
  }, [])

  // Load Transactions Ledger
  const loadTransactions = useCallback(async (page = 1, search = '', type = 'all') => {
    setTxLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', type })
      if (search.trim()) params.set('query', search.trim())
      const res = await fetch(`/api/admin/payments?${params}`)
      const data = await res.json()
      if (!res.ok || !data.success) return
      setTransactions(data.payments || [])
      setTxTotal(data.total || 0)
      setTxTotalPages(data.totalPages || 1)
      setTxPage(data.page || 1)
    } catch {
      // silent
    } finally {
      setTxLoading(false)
    }
  }, [])

  // Load Platform Settings
  const loadSettings = useCallback(async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (!res.ok || !data.success) return
      setSettings(data.settings)
      setSettingsForm({
        globalFeePercentage: String(data.settings.globalFeePercentage ?? 2),
        minPayoutAmountRupees: String(Math.round((data.settings.minPayoutAmountPaise ?? 10000) / 100)),
        maintenanceMode: Boolean(data.settings.maintenanceMode),
        announcementEnabled: Boolean(data.settings.announcement?.enabled),
        announcementMessage: data.settings.announcement?.message || '',
        announcementLevel: data.settings.announcement?.level || 'info',
        announcementLink: data.settings.announcement?.link || '',
      })
    } catch {
      // silent
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSettingsSaving(true)
    try {
      const fee = Number(settingsForm.globalFeePercentage)
      const minPayoutPaise = Math.round(Number(settingsForm.minPayoutAmountRupees) * 100)

      const payload = {
        globalFeePercentage: Number.isNaN(fee) ? 2 : fee,
        minPayoutAmountPaise: Number.isNaN(minPayoutPaise) ? 10000 : minPayoutPaise,
        maintenanceMode: settingsForm.maintenanceMode,
        announcement: {
          enabled: settingsForm.announcementEnabled,
          message: settingsForm.announcementMessage,
          level: settingsForm.announcementLevel,
          link: settingsForm.announcementLink,
        },
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to update platform settings')
        return
      }
      setSettings(data.settings)
      showToast('Platform settings saved successfully!')
    } catch {
      showToast('Network error while saving settings')
    } finally {
      setSettingsSaving(false)
    }
  }

  // Effect handlers wrapped with setTimeout to avoid react-hooks/set-state-in-effect
  useEffect(() => {
    window.setTimeout(() => {
      loadStats()
    }, 0)
  }, [loadStats])

  useEffect(() => {
    if (activeTab === 'creators') {
      const timer = window.setTimeout(() => {
        loadCreators(creatorsPage, creatorSearch, creatorGatewayFilter)
      }, 250)
      return () => window.clearTimeout(timer)
    }
  }, [activeTab, creatorsPage, creatorGatewayFilter, loadCreators, creatorSearch])

  useEffect(() => {
    if (activeTab === 'payouts') {
      window.setTimeout(() => {
        loadPayouts(payoutFilter, payoutsPage)
      }, 0)
    }
  }, [activeTab, payoutFilter, payoutsPage, loadPayouts])

  useEffect(() => {
    if (activeTab === 'transactions') {
      const timer = window.setTimeout(() => {
        loadTransactions(txPage, txSearch, txTypeFilter)
      }, 250)
      return () => window.clearTimeout(timer)
    }
  }, [activeTab, txPage, txTypeFilter, loadTransactions, txSearch])

  useEffect(() => {
    if (activeTab === 'settings') {
      window.setTimeout(() => {
        loadSettings()
      }, 0)
    }
  }, [activeTab, loadSettings])

  const handlePayoutSuccess = (message) => {
    setSelectedPayoutModal(null)
    showToast(message)
    loadPayouts(payoutFilter, payoutsPage)
    loadStats()
  }

  // ── Access Denied State ───────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4ecef5c] p-6">
        <div className="bg-white rounded-3xl p-8 text-center shadow-lg max-w-md w-full border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <AlertCircle size={28} />
          </div>
          <h1 className="text-xl font-bold text-slate-950 mb-2">Access Restricted</h1>
          <p className="text-slate-600 text-xs mb-6 leading-relaxed font-medium">
            {error}. Make sure you are signed in with the authorized platform owner email configured in{' '}
            <code className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono font-bold border border-blue-200">
              ADMIN_EMAIL
            </code>
            .
          </p>
          <Link
            href="/"
            className="inline-block bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4ecef5c] text-slate-900 pb-20">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-emerald-800 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Payout Resolution Modal */}
      {selectedPayoutModal && (
        <ProcessPayoutModal
          payout={selectedPayoutModal}
          onClose={() => setSelectedPayoutModal(null)}
          onSuccess={handlePayoutSuccess}
        />
      )}

      {/* Creator 360 Detail Drawer */}
      {selectedCreatorDrawer && (
        <CreatorDrawer
          creator={selectedCreatorDrawer}
          onClose={() => setSelectedCreatorDrawer(null)}
          onUpdate={(updated) => {
            setSelectedCreatorDrawer(updated)
            setCreators((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
            showToast(`Saved moderation settings for @${updated.username}`)
          }}
        />
      )}

      {/* ── Top Header Navigation Shell ───────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-xs">
                E
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black tracking-tight text-slate-950">
                    Earnesy Platform Admin
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">Platform Control & Operations</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Real-time Data Sync Button */}
              <button
                type="button"
                onClick={() => {
                  loadStats()
                  if (activeTab === 'creators') loadCreators(creatorsPage, creatorSearch, creatorGatewayFilter)
                  if (activeTab === 'payouts') loadPayouts(payoutFilter, payoutsPage)
                  if (activeTab === 'transactions') loadTransactions(txPage, txSearch, txTypeFilter)
                  if (activeTab === 'settings') loadSettings()
                  showToast('Platform data refreshed')
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition border border-slate-200 shadow-xs"
                title="Sync and refresh platform metrics"
              >
                <RefreshCw
                  size={13}
                  className={
                    statsLoading || creatorsLoading || payoutsLoading || txLoading || settingsLoading
                      ? 'animate-spin text-blue-600'
                      : 'text-slate-600'
                  }
                />
                <span className="hidden sm:inline">Sync</span>
              </button>

              {stats?.pendingPayoutRequests > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('payouts')
                    setPayoutFilter('pending')
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"
                >
                  <Clock size={13} className="text-amber-700" />
                  <span>{stats.pendingPayoutRequests} Pending Payouts</span>
                </button>
              )}

              <Link
                href="/"
                className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition border border-slate-200 shadow-xs"
              >
                ← Public Site
              </Link>

              {/* Admin Profile & Sign Out */}
              <div className="pl-2 border-l border-slate-200 flex items-center">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-t border-slate-100 -mb-px overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              {
                id: 'creators',
                label: `Creators Directory${stats?.totalCreators ? ` (${stats.totalCreators})` : ''}`,
                icon: Users,
              },
              {
                id: 'payouts',
                label: `Payout Queue${stats?.pendingPayoutRequests > 0 ? ` (${stats.pendingPayoutRequests})` : ''}`,
                icon: CreditCard,
              },
              { id: 'transactions', label: 'Transactions Ledger', icon: Layers },
              { id: 'settings', label: 'Platform Settings', icon: Sliders },
            ].map((tab) => {
              const TabIcon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <TabIcon size={14} className={isActive ? 'text-blue-600' : 'text-slate-500'} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* ── Main Container ────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── TAB 1: OVERVIEW ───────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {statsLoading ? (
              <div className="py-24 text-center">
                <RefreshCw size={26} className="animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-xs text-slate-600 font-semibold">Aggregating platform metrics…</p>
              </div>
            ) : (
              <>
                {/* Primary Metric Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Platform Revenue (2%)"
                    value={rupees(stats?.totalPlatformRevenue)}
                    subtext="Your net cut from processed volume"
                    icon={Percent}
                    accent
                  />
                  <MetricCard
                    title="Gross Volume (GMV)"
                    value={rupees(stats?.totalGrossRevenue)}
                    subtext="Total fan contributions processed"
                    icon={DollarSign}
                  />
                  <MetricCard
                    title="Total Creators"
                    value={stats?.totalCreators?.toLocaleString() || '0'}
                    subtext="Registered creator accounts"
                    icon={Users}
                  />
                  <MetricCard
                    title="Total Payments"
                    value={stats?.totalPayments?.toLocaleString() || '0'}
                    subtext="Successful tips & memberships"
                    icon={CreditCard}
                  />
                </div>

                {/* Secondary Payout Health Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard
                    title="Pending Payout Queue"
                    value={rupees(stats?.pendingPayoutAmount)}
                    subtext={`${stats?.pendingPayoutRequests || 0} creators awaiting withdrawal`}
                    icon={Clock}
                    alert={Boolean(stats?.pendingPayoutRequests > 0)}
                  />
                  <MetricCard
                    title="Disbursed Payouts"
                    value={rupees(stats?.completedPayoutAmount)}
                    subtext={`${stats?.completedPayoutRequests || 0} successfully paid transfers`}
                    icon={CheckCircle2}
                  />
                  <MetricCard
                    title="Creator Net Earnings"
                    value={rupees(stats?.totalCreatorPayouts)}
                    subtext="Net 98% credited to creators"
                    icon={Sparkles}
                  />
                </div>

                {/* Two-Column Deep-Dive */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Top Creators Leaderboard */}
                  <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <h2 className="text-sm font-bold text-slate-950">
                        Top Earning Creators
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveTab('creators')}
                        className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                      >
                        <span>View all creators</span>
                        <ArrowUpRight size={13} />
                      </button>
                    </div>

                    {topCreators.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-500 font-medium">
                        No creator payments recorded yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {topCreators.map((creator, i) => (
                          <div
                            key={creator.username}
                            className="py-3 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-5 font-black text-slate-500 text-center">{i + 1}</span>
                              <div className="min-w-0">
                                <Link
                                  href={`/${creator.username}`}
                                  target="_blank"
                                  className="font-bold text-slate-950 hover:text-blue-700 truncate block"
                                >
                                  @{creator.username}
                                </Link>
                                <span className="text-[11px] text-slate-600 font-medium">
                                  {creator.paymentCount} contributions received
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-black text-slate-950 block">
                                {rupees(creator.grossEarnings)}
                              </span>
                              <span className="text-[11px] text-emerald-700 font-bold">
                                +{rupees(Math.round(creator.grossEarnings * 0.02))} fee
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Recent Platform Payments */}
                  <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-slate-950">
                            Recent Payment Activity
                          </h2>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                            Latest 10
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Snapshot of 10 most recent contributions across the platform
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('transactions')}
                        className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        <span>View full ledger</span>
                        <ArrowUpRight size={13} />
                      </button>
                    </div>

                    {recentPayments.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-500 font-medium">
                        No transactions recorded yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {recentPayments.map((p) => (
                          <div
                            key={p.id}
                            className="py-3 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                <span className="font-bold text-slate-950">
                                  {p.from || 'Supporter'}
                                </span>
                                <span className="text-slate-400 mx-1.5">→</span>
                                <span className="text-blue-700 font-bold">
                                  @{p.to}
                                </span>
                                {p.tierTitle && (
                                  <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                    {p.tierTitle}
                                  </span>
                                )}
                              </p>
                              <span className="text-[11px] text-slate-600 font-medium">{shortDate(p.createdAt)}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-black text-slate-950 block">
                                {rupees(p.amount)}
                              </span>
                              <span className="text-[11px] text-emerald-700 font-bold">
                                +{rupees(p.platformFee)} fee
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── TAB 2: CREATORS DIRECTORY ────────────────────────────────────── */}
        {activeTab === 'creators' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={creatorSearch}
                  onChange={(e) => {
                    setCreatorSearch(e.target.value)
                    setCreatorsPage(1)
                  }}
                  placeholder="Search creators by name, @username, or email…"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-950 font-medium outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              {/* Gateway Filter Switcher */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'All Creators' },
                  { id: 'configured', label: '⚡ Gateway Connected' },
                  { id: 'unconfigured', label: '⚠ Missing Gateway' },
                  { id: 'payout_ready', label: '🏦 Payout Set' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setCreatorGatewayFilter(f.id)
                      setCreatorsPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      creatorGatewayFilter === f.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Creators Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              {creatorsLoading ? (
                <div className="py-20 text-center">
                  <RefreshCw size={26} className="animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">Loading creators directory…</p>
                </div>
              ) : creators.length === 0 ? (
                <div className="py-20 text-center text-xs text-slate-500 font-medium">
                  No creators matching your query or filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[11px] font-bold">
                        <th className="px-5 py-3.5">Creator</th>
                        <th className="px-5 py-3.5">Contact</th>
                        <th className="px-5 py-3.5">Gateway Status</th>
                        <th className="px-5 py-3.5">Payout Target</th>
                        <th className="px-5 py-3.5">Gross Volume</th>
                        <th className="px-5 py-3.5">Payments</th>
                        <th className="px-5 py-3.5">Joined</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {creators.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={c.profileUrl || '/tea.gif'}
                                alt={c.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <span className="font-bold text-slate-950 block leading-tight">
                                  {c.name}
                                </span>
                                <span className="text-[11px] text-slate-600 font-medium">@{c.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-slate-800 font-medium">
                                {c.email}
                              </span>
                              <CopyButton text={c.email} label="Email" />
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              {c.status === 'suspended' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-300">
                                  ⛔ Suspended
                                </span>
                              ) : c.canAcceptTips === false ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300">
                                  ⏸ Tipping Paused
                                </span>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border ${
                                    c.hasGateway
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                      : 'bg-amber-100 text-amber-900 border-amber-300'
                                  }`}
                                >
                                  {c.hasGateway ? '✓ Active' : '⚠ Missing Gateway'}
                                </span>
                              )}
                              {typeof c.customPlatformFee === 'number' && (
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  {c.customPlatformFee}% Platform Fee
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {c.payoutMethod === 'upi' && c.payoutUpiId ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[11px] text-slate-900 font-semibold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                  {c.payoutUpiId}
                                </span>
                                <CopyButton text={c.payoutUpiId} label="UPI ID" />
                              </div>
                            ) : c.payoutMethod === 'bank' && c.payoutAccountNumber ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[11px] text-slate-900 font-semibold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                  {c.payoutAccountNumber} ({c.payoutIfsc})
                                </span>
                                <CopyButton text={c.payoutAccountNumber} label="Account" />
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">Not set</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-black text-slate-950">
                            {rupees(c.grossEarnings)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-800 font-semibold">
                            {c.paymentsCount}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 font-medium">{shortDate(c.createdAt)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedCreatorDrawer(c)}
                              className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 font-bold hover:bg-slate-100 transition text-[11px] shadow-xs"
                            >
                              View 360°
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {creatorsTotalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-700 font-medium pt-2">
                <span>
                  Showing page {creatorsPage} of {creatorsTotalPages} ({creatorsTotal} total creators)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCreatorsPage((p) => Math.max(1, p - 1))}
                    disabled={creatorsPage === 1}
                    className="p-2 rounded-xl border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatorsPage((p) => Math.min(creatorsTotalPages, p + 1))}
                    disabled={creatorsPage === creatorsTotalPages}
                    className="p-2 rounded-xl border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: PAYOUT REQUESTS QUEUE ─────────────────────────────────── */}
        {activeTab === 'payouts' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'pending', label: '⏳ Pending Review' },
                  { id: 'completed', label: '✓ Completed Transfers' },
                  { id: 'rejected', label: '✗ Rejected' },
                  { id: 'all', label: 'All Requests' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setPayoutFilter(f.id)
                      setPayoutsPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      payoutFilter === f.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-600">{payoutsTotal} requests found</span>
            </div>

            {/* Payouts Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              {payoutsLoading ? (
                <div className="py-20 text-center">
                  <RefreshCw size={26} className="animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">Loading payout queue…</p>
                </div>
              ) : payouts.length === 0 ? (
                <div className="py-20 text-center text-xs text-slate-500 font-medium">
                  No {payoutFilter !== 'all' ? payoutFilter : ''} payout requests in queue.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[11px] font-bold">
                        <th className="px-5 py-3.5">Creator</th>
                        <th className="px-5 py-3.5">Amount</th>
                        <th className="px-5 py-3.5">Method</th>
                        <th className="px-5 py-3.5">Destination Details (1-Click Copy)</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Requested</th>
                        <th className="px-5 py-3.5">UTR / Ref</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payouts.map((r) => (
                        <tr
                          key={r.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/${r.username}`}
                              target="_blank"
                              className="font-bold text-blue-700 hover:underline"
                            >
                              @{r.username}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 font-black text-slate-950">
                            {rupees(r.amount)}
                          </td>
                          <td className="px-5 py-3.5 uppercase font-bold text-[11px] text-slate-700">
                            {r.payoutMethod}
                          </td>
                          <td className="px-5 py-3.5">
                            {r.payoutMethod === 'upi' ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-950 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                  {r.payoutDetails?.upiId || '—'}
                                </span>
                                {r.payoutDetails?.upiId && (
                                  <CopyButton text={r.payoutDetails.upiId} label="UPI ID" />
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-950 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                  {r.payoutDetails?.accountNumber || '—'} ({r.payoutDetails?.ifsc})
                                </span>
                                {r.payoutDetails?.accountNumber && (
                                  <CopyButton
                                    text={r.payoutDetails.accountNumber}
                                    label="Account Number"
                                  />
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                                r.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : r.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                                    : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 font-medium">{shortDate(r.createdAt)}</td>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-slate-800 font-semibold">
                            {r.referenceId ? (
                              <div className="flex items-center gap-1">
                                <span>{r.referenceId}</span>
                                <CopyButton text={r.referenceId} label="UTR" />
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {r.status === 'pending' ? (
                              <button
                                type="button"
                                onClick={() => setSelectedPayoutModal(r)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition"
                              >
                                Process
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {payoutsTotalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-700 font-medium pt-2">
                <span>
                  Showing page {payoutsPage} of {payoutsTotalPages} ({payoutsTotal} total requests)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutsPage((p) => Math.max(1, p - 1))}
                    disabled={payoutsPage === 1}
                    className="p-2 rounded-xl border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutsPage((p) => Math.min(payoutsTotalPages, p + 1))}
                    disabled={payoutsPage === payoutsTotalPages}
                    className="p-2 rounded-xl border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: TRANSACTIONS LEDGER ───────────────────────────────────── */}
        {activeTab === 'transactions' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Header & Subtitle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-950">Transactions Ledger</h2>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    Newest First
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Showing recent transactions · Paginated at 20 per page · {txTotal} total platform payments
                </p>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Page {txPage} of {txTotalPages}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => {
                    setTxSearch(e.target.value)
                    setTxPage(1)
                  }}
                  placeholder="Search by Order ID, Payment ID, Supporter, or Creator…"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 text-xs text-slate-950 font-medium outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'All Payments' },
                  { id: 'coffee', label: '☕ Coffee Tips' },
                  { id: 'tier', label: '👑 Memberships' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setTxTypeFilter(f.id)
                      setTxPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      txTypeFilter === f.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions Ledger Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              {txLoading ? (
                <div className="py-20 text-center">
                  <RefreshCw size={26} className="animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">Loading transactions ledger…</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-20 text-center text-xs text-slate-500 font-medium">
                  No transactions match your search or filter criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[11px] font-bold">
                        <th className="px-5 py-3.5">Order & Payment ID</th>
                        <th className="px-5 py-3.5">Parties</th>
                        <th className="px-5 py-3.5">Type</th>
                        <th className="px-5 py-3.5">Gross Amount</th>
                        <th className="px-5 py-3.5">2% Platform Fee</th>
                        <th className="px-5 py-3.5">98% Creator Net</th>
                        <th className="px-5 py-3.5">Discord VIP</th>
                        <th className="px-5 py-3.5 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-mono">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-950">
                              <span>{tx.orderId}</span>
                              <CopyButton text={tx.orderId} label="Order ID" />
                            </div>
                            {tx.paymentId && (
                              <span className="text-[10px] text-slate-500 block font-medium">{tx.paymentId}</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-950">
                              {tx.fromUser || 'Anonymous'}
                            </div>
                            <div className="text-slate-500 text-[11px] font-medium">
                              →{' '}
                              <Link
                                href={`/${tx.toUser}`}
                                target="_blank"
                                className="text-blue-700 hover:underline font-bold"
                              >
                                @{tx.toUser}
                              </Link>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {tx.isTier ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                👑 {tx.tierTitle || 'Tier'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                ☕ Tip
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-black text-slate-950">
                            {rupees(tx.amount)}
                          </td>
                          <td className="px-5 py-3.5 font-black text-emerald-700">
                            +{rupees(tx.platformFee)}
                          </td>
                          <td className="px-5 py-3.5 text-slate-900 font-bold">
                            {rupees(tx.creatorAmount)}
                          </td>
                          <td className="px-5 py-3.5">
                            {tx.discordRoleAssigned ? (
                              <span className="text-[11px] text-indigo-700 font-bold flex items-center gap-1">
                                ✓ Assigned
                              </span>
                            ) : tx.supporterDiscordId ? (
                              <span className="text-[10px] text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Pending join</span>
                            ) : (
                              <span className="text-[10px] text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right text-slate-600 font-medium">
                            {fullDateTime(tx.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {txTotal > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-700 font-medium pt-2">
                <span>
                  Showing page {txPage} of {txTotalPages} ({txTotal} total transactions, sorted newest first)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    disabled={txPage === 1}
                    className="p-2 rounded-xl border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-50 transition"
                    title="Previous page"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <span className="px-2 font-bold text-slate-900">{txPage} / {txTotalPages}</span>
                  <button
                    type="button"
                    onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                    disabled={txPage === txTotalPages}
                    className="p-2 rounded-xl border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-50 transition"
                    title="Next page"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: PLATFORM SETTINGS ────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <Sliders size={18} className="text-blue-600" />
                  <span>Platform Configuration</span>
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Manage global commission take rates, minimum payout bounds, maintenance status, and site announcements.
                </p>
              </div>
              {settings?.updatedAt && (
                <div className="text-[11px] text-slate-500 font-medium">
                  Last updated: {fullDateTime(settings.updatedAt)} {settings.updatedBy ? `by ${settings.updatedBy}` : ''}
                </div>
              )}
            </div>

            {settingsLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center shadow-xs">
                <RefreshCw size={26} className="animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-semibold">Loading platform settings…</p>
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Card 1: Commission & Take Rate */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                            %
                          </div>
                          <h3 className="text-sm font-bold text-slate-950">Default Platform Cut</h3>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Global Fee
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
                        The standard commission fee deducted from supporter tips and membership contributions. Can still be customized per creator in the directory.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        Commission Percentage
                      </label>
                      <div className="flex items-center gap-2 max-w-xs">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={settingsForm.globalFeePercentage}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({ ...prev, globalFeePercentage: e.target.value }))
                          }
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-950 font-bold outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                        <span className="text-sm font-bold text-slate-500">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Minimum Payout Amount */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                            <CreditCard size={17} />
                          </div>
                          <h3 className="text-sm font-bold text-slate-950">Minimum Payout Threshold</h3>
                        </div>
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full">
                          Withdrawal Bound
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
                        The minimum net available earnings a creator must accumulate before the &ldquo;Request Payout&rdquo; button becomes active.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                        Threshold in Indian Rupees (₹)
                      </label>
                      <div className="flex items-center gap-2 max-w-xs">
                        <span className="text-sm font-bold text-slate-500">₹</span>
                        <input
                          type="number"
                          step="10"
                          min="1"
                          max="100000"
                          value={settingsForm.minPayoutAmountRupees}
                          onChange={(e) =>
                            setSettingsForm((prev) => ({ ...prev, minPayoutAmountRupees: e.target.value }))
                          }
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-950 font-bold outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Emergency Maintenance Mode */}
                  <div
                    className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-colors ${
                      settingsForm.maintenanceMode ? 'bg-rose-50/60 border-rose-300' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              settingsForm.maintenanceMode ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <ShieldAlert size={17} />
                          </div>
                          <h3 className="text-sm font-bold text-slate-950">Checkout Maintenance Pause</h3>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            settingsForm.maintenanceMode
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {settingsForm.maintenanceMode ? '⏸ Active' : 'Normal Operations'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
                        Emergency killswitch. When active, new checkout orders and tip transactions are paused platform-wide with an informative maintenance notice.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {settingsForm.maintenanceMode ? 'Checkouts Paused' : 'Checkouts Operating Normally'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSettingsForm((prev) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                          settingsForm.maintenanceMode
                            ? 'bg-rose-600 text-white border-rose-700 shadow-xs hover:bg-rose-700'
                            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {settingsForm.maintenanceMode ? 'Resume Operations' : 'Pause Checkouts'}
                      </button>
                    </div>
                  </div>

                  {/* Card 4: Site-Wide Announcement Banner */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                            <Megaphone size={17} />
                          </div>
                          <h3 className="text-sm font-bold text-slate-950">Site-Wide Announcement</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSettingsForm((prev) => ({ ...prev, announcementEnabled: !prev.announcementEnabled }))
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                            settingsForm.announcementEnabled
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {settingsForm.announcementEnabled ? '✓ Enabled' : 'Disabled'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 mb-3 font-medium leading-relaxed">
                        Displays a notification bar at the very top of all public visitor and creator pages.
                      </p>

                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Announcement Text
                          </label>
                          <input
                            type="text"
                            maxLength={300}
                            placeholder="e.g. Banking network maintenance scheduled for Sunday evening."
                            value={settingsForm.announcementMessage}
                            onChange={(e) =>
                              setSettingsForm((prev) => ({ ...prev, announcementMessage: e.target.value }))
                            }
                            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-950 font-medium outline-none focus:border-blue-600 focus:bg-white transition"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Style Theme
                            </label>
                            <select
                              value={settingsForm.announcementLevel}
                              onChange={(e) =>
                                setSettingsForm((prev) => ({ ...prev, announcementLevel: e.target.value }))
                              }
                              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-950 font-semibold outline-none focus:border-blue-600 focus:bg-white transition"
                            >
                              <option value="info">Info (Blue)</option>
                              <option value="warning">Warning (Amber)</option>
                              <option value="critical">Critical Alert (Red)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Action Link (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="/about or URL"
                              value={settingsForm.announcementLink}
                              onChange={(e) =>
                                setSettingsForm((prev) => ({ ...prev, announcementLink: e.target.value }))
                              }
                              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-950 font-medium outline-none focus:border-blue-600 focus:bg-white transition"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-slate-600 font-medium">
                    Changes take effect across the platform immediately without server restarts.
                  </span>
                  <button
                    type="submit"
                    disabled={settingsSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white px-6 py-2.5 text-xs font-bold shadow-xs transition disabled:opacity-50"
                  >
                    {settingsSaving ? (
                      <>
                        <RefreshCw size={14} className="animate-spin text-white" />
                        <span>Saving Configuration…</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Save Platform Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
