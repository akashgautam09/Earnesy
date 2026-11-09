'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Info, AlertTriangle, ArrowRight, X } from 'lucide-react'

export default function AnnouncementBanner() {
  const [banner, setBanner] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let isMounted = true
    const checkBanner = async () => {
      try {
        const res = await fetch('/api/settings')
        const data = await res.json()
        if (!isMounted || !data.success || !data.settings?.announcement?.enabled) return

        const ann = data.settings.announcement
        if (!ann.message) return

        const sessionDismissed = sessionStorage.getItem(`earnesy_ann_dismissed_${ann.message}`)
        if (sessionDismissed) return

        setBanner(ann)
      } catch {
        // silent
      }
    }

    checkBanner()
    return () => {
      isMounted = false
    }
  }, [])

  if (!banner || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(`earnesy_ann_dismissed_${banner.message}`, 'true')
    } catch {
      // silent
    }
  }

  const isWarning = banner.level === 'warning'
  const isCritical = banner.level === 'critical'

  const bgClasses = isCritical
    ? 'bg-rose-600 text-white'
    : isWarning
      ? 'bg-amber-400 text-slate-950 font-medium'
      : 'bg-blue-600 text-white'

  const Icon = isCritical ? AlertCircle : isWarning ? AlertTriangle : Info

  return (
    <div
      role="banner"
      className={`relative z-40 px-4 py-2.5 text-xs text-center flex items-center justify-between gap-3 shadow-xs ${bgClasses}`}
    >
      <div className="flex-1 flex items-center justify-center gap-2 flex-wrap min-w-0">
        <Icon size={14} className="shrink-0" />
        <span className="truncate">{banner.message}</span>
        {banner.link && (
          <Link
            href={banner.link}
            className="inline-flex items-center gap-0.5 underline font-bold hover:opacity-80 transition"
          >
            <span>Learn more</span>
            <ArrowRight size={11} />
          </Link>
        )}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="shrink-0 p-1 rounded-md opacity-80 hover:opacity-100 transition"
      >
        <X size={14} />
      </button>
    </div>
  )
}
