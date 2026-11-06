'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  Bell,
  Coffee,
  Sparkles,
  MessageSquare,
  Heart,
  Check,
  CheckCheck,
  X,
  ExternalLink,
} from 'lucide-react'

export default function NotificationBell({ align = 'right' }) {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef(null)

  const fetchNotifications = async () => {
    if (!isSignedIn) return
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (res.ok) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (e) {
      // Ignore background fetch error
    }
  }

  useEffect(() => {
    if (!isSignedIn) return

    const timer = window.setTimeout(() => {
      fetchNotifications()
    }, 0)

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => {
      window.clearTimeout(timer)
      clearInterval(interval)
    }
  }, [isSignedIn])

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PUT', body: JSON.stringify({}) })
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (e) {
      console.error(e)
    }
  }

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id }),
        })
        setUnreadCount((prev) => Math.max(0, prev - 1))
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        )
      } catch (e) {
        console.error(e)
      }
    }

    setIsOpen(false)
    if (item.link) {
      router.push(item.link)
    }
  }

  if (!isSignedIn) return null

  const getIcon = (type) => {
    switch (type) {
      case 'membership':
        return <Sparkles size={14} className="text-purple-600" />
      case 'coffee':
        return <Coffee size={14} className="text-amber-600" />
      case 'comment':
        return <MessageSquare size={14} className="text-blue-600" />
      case 'like':
        return <Heart size={14} className="text-rose-500 fill-rose-500" />
      default:
        return <Bell size={14} className="text-slate-600" />
    }
  }

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifications()
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] transition hover:bg-[var(--muted)]"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--foreground)]">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)] hover:underline"
              >
                <CheckCheck size={12} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)] text-xs">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`flex items-start gap-3 p-3.5 cursor-pointer transition hover:bg-[var(--muted)]/50 ${
                    !item.isRead ? 'bg-purple-50/30' : ''
                  }`}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)]">
                    {getIcon(item.type)}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-slate-900 leading-tight">
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-[var(--primary)] shrink-0" />
                      )}
                    </div>
                    {item.message && (
                      <p className="text-slate-600 line-clamp-2 leading-relaxed text-[11px]">
                        {item.message}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 pt-0.5">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-xs text-slate-400">
                <Bell size={24} className="mx-auto mb-2 text-slate-300" />
                <p>No notifications yet</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  You&apos;ll see updates here when supporters tip or join your tiers.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
