'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  UsersRound,
  Sparkles,
  X,
  CreditCard,
  RefreshCw,
} from 'lucide-react'
import AppPageHeader from '@/components/AppPageHeader'

const PRESET_TIERS = [
  {
    title: 'Starter Supporter',
    price: 99,
    description: 'Show your appreciation and support my daily creations.',
    perks: ['Supporter badge on your profile', 'Access to exclusive supporter posts', 'My eternal gratitude'],
    discordPerk: false,
    discordRoleId: '',
  },
  {
    title: 'VIP Community Member',
    price: 299,
    description: 'Join the inner community and chat directly on Discord.',
    perks: ['Everything in Starter Supporter', 'Exclusive VIP Discord Role & Chat access', 'Monthly Community Q&A', 'Early access to new posts'],
    discordPerk: true,
    discordRoleId: '',
  },
  {
    title: 'Inner Circle Patron',
    price: 799,
    description: 'Top-tier supporter with 1-on-1 recognition and dedicated perks.',
    perks: ['All previous tier perks', 'Exclusive Patron Discord Role & Private Lounge', 'Name listed as a sponsor in posts', 'Monthly direct shoutouts'],
    discordPerk: true,
    discordRoleId: '',
  },
]

const QUICK_PERK_SUGGESTIONS = [
  'Exclusive VIP Discord Role',
  'Supporter-only posts & behind-the-scenes',
  'Early access to new releases',
  'Name in video/post credits',
  'Monthly community live stream',
  'Direct messaging & feedback',
]

const QUICK_PRICES = [99, 199, 299, 499, 999]

export default function MembershipsPage() {
  const [tiers, setTiers] = useState([])
  const [discordConfig, setDiscordConfig] = useState({
    isConfigured: false,
    serverId: '',
    defaultRoleId: '',
    inviteUrl: '',
  })
  const [paymentsEnabled, setPaymentsEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [notification, setNotification] = useState(null)

  // Builder form state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [editingTierId, setEditingTierId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    price: 199,
    description: '',
    perks: ['Supporter badge on profile', 'Exclusive Discord role & chat'],
    discordPerk: true,
    discordRoleId: '',
    isActive: true,
  })
  const [newPerkInput, setNewPerkInput] = useState('')

  // Discord role test state inside builder
  const [testingDiscord, setTestingDiscord] = useState(false)
  const [discordTestResult, setDiscordTestResult] = useState(null)

  const showNotification = (type, text) => {
    setNotification({ type, text })
    window.setTimeout(() => {
      setNotification((current) => (current?.text === text ? null : current))
    }, 4500)
  }

  const loadTiers = async () => {
    try {
      const res = await fetch('/api/tiers')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load tiers')
      }
      setTiers(data.tiers || [])
      if (data.discord) {
        setDiscordConfig(data.discord)
      }
      setPaymentsEnabled(Boolean(data.paymentsEnabled))
    } catch (err) {
      showNotification('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTiers()
  }, [])

  const handleOpenNewBuilder = (preset = null) => {
    setEditingTierId(null)
    setDiscordTestResult(null)
    setNewPerkInput('')

    if (preset) {
      setFormData({
        title: preset.title,
        price: preset.price,
        description: preset.description,
        perks: [...preset.perks],
        discordPerk: Boolean(preset.discordPerk),
        discordRoleId: preset.discordRoleId || discordConfig.defaultRoleId || '',
        isActive: true,
      })
    } else {
      setFormData({
        title: '',
        price: 199,
        description: '',
        perks: ['Supporter badge on profile'],
        discordPerk: discordConfig.isConfigured,
        discordRoleId: discordConfig.defaultRoleId || '',
        isActive: true,
      })
    }
    setIsBuilderOpen(true)
  }

  const handleOpenEditBuilder = (tier) => {
    setEditingTierId(tier.id)
    setDiscordTestResult(null)
    setNewPerkInput('')
    setFormData({
      title: tier.title,
      price: tier.price,
      description: tier.description || '',
      perks: Array.isArray(tier.perks) ? [...tier.perks] : [],
      discordPerk: Boolean(tier.discordPerk),
      discordRoleId: tier.discordRoleId || discordConfig.defaultRoleId || '',
      isActive: tier.isActive !== false,
    })
    setIsBuilderOpen(true)
  }

  const handleCloseBuilder = () => {
    setIsBuilderOpen(false)
    setEditingTierId(null)
    setDiscordTestResult(null)
    setNewPerkInput('')
  }

  const handleAddPerk = (perkText = null) => {
    const textToAdd = (perkText || newPerkInput).trim()
    if (!textToAdd) return

    if (formData.perks.includes(textToAdd)) {
      showNotification('error', 'This perk is already added')
      return
    }

    if (formData.perks.length >= 10) {
      showNotification('error', 'Maximum 10 perks per tier')
      return
    }

    setFormData((prev) => ({
      ...prev,
      perks: [...prev.perks, textToAdd],
    }))
    if (!perkText) {
      setNewPerkInput('')
    }
  }

  const handleRemovePerk = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      perks: prev.perks.filter((_, idx) => idx !== indexToRemove),
    }))
  }

  const handleTestDiscordRole = async () => {
    const serverId = discordConfig.serverId
    const roleId = formData.discordRoleId?.trim() || discordConfig.defaultRoleId

    if (!serverId) {
      setDiscordTestResult({
        success: false,
        error: 'Please connect your Discord Server in Dashboard first.',
      })
      return
    }

    if (!roleId) {
      setDiscordTestResult({
        success: false,
        error: 'Please enter a Discord Role ID to test.',
      })
      return
    }

    setTestingDiscord(true)
    setDiscordTestResult(null)

    try {
      const res = await fetch('/api/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, roleId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setDiscordTestResult({
          success: false,
          error: data.error || 'Role validation failed.',
        })
      } else {
        setDiscordTestResult({
          success: true,
          guildName: data.guildName,
          roleName: data.roleName,
        })
      }
    } catch (err) {
      setDiscordTestResult({
        success: false,
        error: err.message || 'Network error while testing Discord role.',
      })
    } finally {
      setTestingDiscord(false)
    }
  }

  const handleSaveTier = async (e) => {
    e.preventDefault()

    const cleanTitle = formData.title.trim()
    const cleanPrice = Number(formData.price)

    if (!cleanTitle) {
      showNotification('error', 'Please give this tier a name.')
      return
    }

    if (isNaN(cleanPrice) || cleanPrice < 1) {
      showNotification('error', 'Price must be at least ₹1.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        title: cleanTitle,
        price: cleanPrice,
        description: formData.description.trim(),
        perks: formData.perks,
        discordPerk: formData.discordPerk,
        discordRoleId: formData.discordPerk
          ? formData.discordRoleId.trim() || discordConfig.defaultRoleId
          : '',
        isActive: formData.isActive,
      }

      let res
      if (editingTierId) {
        res = await fetch('/api/tiers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTierId, ...payload }),
        })
      } else {
        res = await fetch('/api/tiers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save tier')
      }

      showNotification('success', editingTierId ? 'Tier updated successfully!' : 'Tier created successfully!')
      handleCloseBuilder()
      await loadTiers()
    } catch (err) {
      showNotification('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTier = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch(`/api/tiers?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete tier')
      }

      showNotification('success', 'Tier deleted successfully.')
      setTiers((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      showNotification('error', err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleTierStatus = async (tier) => {
    setTogglingId(tier.id)
    try {
      const newStatus = !tier.isActive
      const res = await fetch('/api/tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tier.id, isActive: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status')
      }

      setTiers((prev) =>
        prev.map((t) => (t.id === tier.id ? { ...t, isActive: newStatus } : t))
      )
      showNotification('success', `Tier marked as ${newStatus ? 'active' : 'draft'}.`)
    } catch (err) {
      showNotification('error', err.message)
    } finally {
      setTogglingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4ecef5c] text-sm text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[var(--primary)]" />
        Loading memberships...
      </div>
    )
  }

  const activeTiersCount = tiers.filter((t) => t.isActive).length
  const discordTiersCount = tiers.filter((t) => t.discordPerk).length
  const lowestPrice = tiers.length ? Math.min(...tiers.map((t) => t.price)) : 0
  const highestPrice = tiers.length ? Math.max(...tiers.map((t) => t.price)) : 0

  return (
    <div className="min-h-screen bg-[#f4ecef5c] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-7">
        <AppPageHeader
          eyebrow="Memberships & Perks"
          title="Creator Tier Builder"
          description="Design custom membership tiers with monthly pricing, perks, and automated Discord VIP role access."
          action={
            <button
              type="button"
              onClick={() => handleOpenNewBuilder()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus size={18} />
              <span>Create Tier</span>
            </button>
          }
        />

        {/* Global Notifications */}
        {notification && (
          <div
            className={`flex items-center justify-between rounded-xl p-4 text-sm font-medium shadow-sm transition ${
              notification.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border border-red-200 bg-red-50 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-red-600 shrink-0" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="rounded p-1 hover:bg-black/5"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Integration Status & Stats Bar */}
        <section className="grid gap-4 sm:grid-cols-3">
          {/* Tiers Overview */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_4px_16px_rgba(25,25,25,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Tier Levels
              </span>
              <UsersRound size={18} className="text-[var(--primary)]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--foreground)]">{tiers.length}</span>
              <span className="text-xs text-[var(--muted-foreground)]">
                ({activeTiersCount} active)
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {tiers.length > 0
                ? `Prices range ₹${lowestPrice} – ₹${highestPrice} / mo`
                : 'No tiers configured yet'}
            </p>
          </div>

          {/* Discord Perk Status */}
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 p-5 shadow-[0_4px_16px_rgba(25,25,25,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-900">
                Discord VIP Automation
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#5865F2] text-white">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
                </svg>
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-slate-800">
                {discordConfig.isConfigured ? 'Bot Connected' : 'Setup Required'}
              </span>
              <span className="text-xs text-indigo-700 font-medium">
                ({discordTiersCount} with Discord perk)
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {discordConfig.isConfigured ? (
                'Automatic role grant ready on payment.'
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-medium"
                >
                  Connect Discord in Dashboard <ExternalLink size={11} />
                </Link>
              )}
            </p>
          </div>

          {/* Payments Integration Status */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_4px_16px_rgba(25,25,25,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Payment Gateway
              </span>
              <CreditCard size={18} className="text-amber-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-slate-800">
                {paymentsEnabled ? 'Razorpay Connected' : 'Razorpay Not Linked'}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {paymentsEnabled ? (
                'Direct supporter payouts enabled'
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-amber-700 hover:underline font-medium"
                >
                  Add credentials in Dashboard <ExternalLink size={11} />
                </Link>
              )}
            </p>
          </div>
        </section>

        {/* Dynamic Tier Builder Modal / Card */}
        {isBuilderOpen && (
          <section className="rounded-2xl border-2 border-[var(--primary)]/30 bg-white p-5 sm:p-7 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                  {editingTierId ? 'Edit Tier' : 'New Membership Tier'}
                </span>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {formData.title || 'Untitled Tier'}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseBuilder}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="mt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column: Core Tier Info */}
                <div className="space-y-5">
                  {/* Tier Title */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Tier Name / Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="e.g. VIP Supporter, Gold Fan, Insider Club"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>

                  {/* Monthly Price & Quick Chips */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Monthly Price (₹ INR) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                          ₹
                        </span>
                        <input
                          type="number"
                          required
                          min={1}
                          max={1000000}
                          value={formData.price}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              price: Math.max(1, Number(e.target.value) || 0),
                            }))
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-8 pr-3.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-medium">/ month</span>
                    </div>

                    {/* Quick Price Chips */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Quick:</span>
                      {QUICK_PRICES.map((qp) => (
                        <button
                          key={qp}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, price: qp }))}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                            formData.price === qp
                              ? 'bg-[var(--primary)] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          ₹{qp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Tier Description
                    </label>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Describe the experience, exclusivity, or appreciation supporters receive in this tier..."
                      className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>

                  {/* Status Toggle (Active vs Draft) */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Tier Visibility</p>
                      <p className="text-[11px] text-slate-500">
                        {formData.isActive
                          ? 'Active: visible to supporters on your page'
                          : 'Draft: hidden from public view'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.isActive ? 'bg-[var(--primary)]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          formData.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Right Column: Perks & Discord Integration */}
                <div className="space-y-5">
                  {/* Perks Builder */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Supporter Perks & Benefits
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={120}
                        value={newPerkInput}
                        onChange={(e) => setNewPerkInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddPerk()
                          }
                        }}
                        placeholder="e.g. Behind-the-scenes posts"
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddPerk()}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>

                    {/* Quick Perk Suggestions Chips */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {QUICK_PERK_SUGGESTIONS.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleAddPerk(sug)}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>

                    {/* Added Perks List */}
                    <ul className="mt-3 space-y-1.5">
                      {formData.perks.map((perk, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-xs"
                        >
                          <span className="flex items-center gap-2">
                            <Check size={14} className="text-emerald-600 shrink-0" />
                            <span>{perk}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePerk(index)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Discord VIP Perk Card with Toggle */}
                  <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 p-4.5 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#5865F2] text-white">
                          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            Discord VIP Role Perk
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Automatically grant a Discord role to members of this tier.
                          </p>
                        </div>
                      </div>

                      {/* Discord Perk Toggle Switch */}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            discordPerk: !prev.discordPerk,
                            discordRoleId:
                              !prev.discordPerk && !prev.discordRoleId
                                ? discordConfig.defaultRoleId || ''
                                : prev.discordRoleId,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          formData.discordPerk ? 'bg-[#5865F2]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            formData.discordPerk ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Discord Role Configuration (shown when toggle is ON) */}
                    {formData.discordPerk && (
                      <div className="mt-3.5 space-y-3 border-t border-indigo-100/70 pt-3 text-xs">
                        {discordConfig.isConfigured ? (
                          <>
                            <div>
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-medium text-slate-700">
                                  Role ID for this Tier
                                </label>
                                {discordConfig.defaultRoleId && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        discordRoleId: discordConfig.defaultRoleId,
                                      }))
                                    }
                                    className="text-[10px] text-indigo-600 hover:underline"
                                  >
                                    Use Default Role
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                value={formData.discordRoleId}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    discordRoleId: e.target.value,
                                  }))
                                }
                                placeholder={
                                  discordConfig.defaultRoleId
                                    ? `Default: ${discordConfig.defaultRoleId}`
                                    : 'Enter Discord Role ID (17-20 digits)'
                                }
                                className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            {/* Test Connection Button */}
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <button
                                type="button"
                                onClick={handleTestDiscordRole}
                                disabled={
                                  testingDiscord ||
                                  (!formData.discordRoleId && !discordConfig.defaultRoleId)
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-indigo-700 shadow-xs transition hover:bg-indigo-50 disabled:opacity-50"
                              >
                                {testingDiscord ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin" /> Testing...
                                  </>
                                ) : (
                                  <>
                                    <span>⚡ Test Role Permissions</span>
                                  </>
                                )}
                              </button>

                              <span className="text-[10px] text-slate-500">
                                Server: {discordConfig.serverId ? `ID ${discordConfig.serverId.slice(0, 6)}...` : 'Connected'}
                              </span>
                            </div>

                            {/* Test Result Message */}
                            {discordTestResult && (
                              <div
                                className={`rounded-lg p-2.5 text-[11px] font-medium ${
                                  discordTestResult.success
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                                }`}
                              >
                                {discordTestResult.success ? (
                                  <div className="flex items-center gap-1.5">
                                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                    <span>
                                      Verified: <strong>@{discordTestResult.roleName}</strong> in{' '}
                                      <strong>{discordTestResult.guildName}</strong>
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <AlertCircle size={13} className="text-red-600 shrink-0" />
                                    <span>{discordTestResult.error}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-900">
                            <p className="font-semibold flex items-center gap-1">
                              <AlertCircle size={12} /> Discord Server not linked yet
                            </p>
                            <p className="mt-1 text-slate-600">
                              To assign Discord roles automatically, connect your Discord server and invite Earnesy Bot in your Dashboard.
                            </p>
                            <Link
                              href="/dashboard"
                              className="mt-2 inline-flex items-center gap-1 font-semibold text-indigo-700 hover:underline"
                            >
                              Setup Discord in Dashboard <ExternalLink size={10} />
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleCloseBuilder}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:opacity-95 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <span>{editingTierId ? 'Update Tier' : 'Create Tier'}</span>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Existing Tiers Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--foreground)]">Your Membership Tiers</h2>
            <button
              type="button"
              onClick={loadTiers}
              className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {tiers.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-white/60 p-8 text-center sm:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--primary)]">
                <Sparkles size={28} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No membership tiers created yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Give your supporters recurring monthly options to support your creative journey with custom perks and automatic Discord roles.
              </p>

              {/* Preset Template Cards */}
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Quick Start With A Template
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {PRESET_TIERS.map((preset, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:border-[var(--primary)]/50"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{preset.title}</span>
                          <span className="text-xs font-extrabold text-[var(--primary)]">
                            ₹{preset.price}/mo
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                          {preset.description}
                        </p>
                        {preset.discordPerk && (
                          <span className="mt-2.5 inline-flex items-center gap-1 rounded bg-[#5865F2]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#5865F2]">
                            Includes Discord Role
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenNewBuilder(preset)}
                        className="mt-4 w-full rounded-lg bg-slate-900 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Use Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenNewBuilder()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  <Plus size={15} /> Create Custom Tier
                </button>
              </div>
            </div>
          ) : (
            /* Tier Cards Grid */
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md ${
                    tier.isActive
                      ? 'border-slate-200'
                      : 'border-slate-200/60 bg-slate-50/50 opacity-80'
                  }`}
                >
                  <div>
                    {/* Header: Title and Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{tier.title}</h3>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[var(--foreground)]">
                            ₹{tier.price}
                          </span>
                          <span className="text-xs font-medium text-slate-400">/ month</span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          tier.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {tier.isActive ? 'Active' : 'Draft'}
                      </span>
                    </div>

                    {/* Description */}
                    {tier.description && (
                      <p className="mt-3 text-xs leading-5 text-slate-600">
                        {tier.description}
                      </p>
                    )}

                    {/* Discord Perk Badge */}
                    {tier.discordPerk && (
                      <div className="mt-3.5 flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-1.5 text-xs font-medium text-indigo-900">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-[#5865F2] text-white">
                          <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
                          </svg>
                        </span>
                        <span>Discord VIP Role Included</span>
                      </div>
                    )}

                    {/* Perks List */}
                    {tier.perks && tier.perks.length > 0 && (
                      <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Included Perks:
                        </p>
                        <ul className="space-y-1">
                          {tier.perks.map((perk, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                              <Check size={13} className="mt-0.5 text-emerald-600 shrink-0" />
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      disabled={togglingId === tier.id}
                      onClick={() => handleToggleTierStatus(tier)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      {tier.isActive ? 'Mark Draft' : 'Activate'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditBuilder(tier)}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        title="Edit Tier"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === tier.id}
                        onClick={() => handleDeleteTier(tier.id, tier.title)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        title="Delete Tier"
                      >
                        {deletingId === tier.id ? (
                          <Loader2 size={15} className="animate-spin text-red-600" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
