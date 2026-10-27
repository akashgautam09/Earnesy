"use client"

import React from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import { fetchPayments, initiate, fetchUserPage, fetchUserPosts } from '@/actions/userAction'
import { ToastContainer, toast, Bounce } from 'react-toastify'
import { Heart, Share2, Coffee, Check, FileText, Sparkles, Users, BadgeCheck } from 'lucide-react'

export const PaymentPage = ({ username }) => {
    const { isLoaded, isSignedIn, user } = useUser()
    const userEmail = user?.primaryEmailAddress?.emailAddress || ''
    const router = useRouter()
    const isMounted = useRef(true)

    const [paymentform, setPaymentform] = useState({ name: '', amount: '100' })
    const [currentUser, setCurrentUser] = useState({})
    const [paymentReceived, setPaymentReceived] = useState([])
    const [posts, setPosts] = useState([])
    const [pageLoading, setPageLoading] = useState(true)
    const [copiedPostId, setCopiedPostId] = useState(null)
    const [likingPostId, setLikingPostId] = useState(null)

    const searchParams = useSearchParams()

    const loadUserPage = useCallback(async () => {
        if (!isMounted.current) return
        try {
            const [userData, payments, userPosts] = await Promise.all([
                fetchUserPage(username),
                fetchPayments(username),
                fetchUserPosts(username),
            ])

            if (isMounted.current) {
                setCurrentUser(userData || {})
                setPaymentReceived(payments || [])
                setPosts(userPosts || [])
            }
        } catch (error) {
            console.error('Error fetching user page:', error)
        } finally {
            if (isMounted.current) setPageLoading(false)
        }
    }, [username])

    useEffect(() => {
        isMounted.current = true
        const timer = window.setTimeout(() => {
            void loadUserPage()
        }, 0)

        return () => {
            window.clearTimeout(timer)
            isMounted.current = false
        }
    }, [loadUserPage])

    useEffect(() => {
        if (searchParams.get("paymentdone") === "true" && isMounted.current) {
            toast.success("Payment completed successfully! Thank you for your support.")
            router.replace(`/${username}`)
        }
    }, [searchParams, username, router])

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="flex items-center gap-2.5 text-sm text-[var(--muted-foreground)]">
                    <Coffee className="animate-bounce text-[var(--primary)]" size={20} />
                    Loading creator profile...
                </div>
            </div>
        )
    }

    const handlechange = (e) => {
        setPaymentform({ ...paymentform, [e.target.name]: e.target.value })
    }

    const setPresetAmount = (val) => {
        setPaymentform((prev) => ({ ...prev, amount: val.toString() }))
    }

    const pay = async (amountInPaise) => {
        try {
            if (!isLoaded) {
                return
            }
            if (!isSignedIn) {
                toast.info("Please log in before making a payment.")
                router.push(`/login?redirectUrl=/${encodeURIComponent(username)}`)
                return
            }

            if (!currentUser?.paymentsEnabled) {
                toast.error("This creator has not connected Razorpay yet.")
                return
            }

            const payerName = paymentform.name.trim() || user?.fullName || user?.username || ''
            if (!payerName) {
                toast.error("Please enter your name")
                return
            }
            if (!paymentform.amount || Number(paymentform.amount) <= 0) {
                toast.error("Please enter a valid amount")
                return
            }

            const x = await initiate(amountInPaise, username, { ...paymentform, name: payerName })
            if (x?.error) {
                toast.error(x.error)
                return
            }

            const callbackUrl = new URL('/api/razorpay', window.location.origin).toString()

            const options = {
                key: currentUser.razorpayId,
                amount: amountInPaise,
                currency: "INR",
                name: "Earnesy",
                description: `Support for @${username}`,
                image: currentUser.profileUrl || "/tea.gif",
                order_id: x.id,
                callback_url: callbackUrl,
                prefill: {
                    name: payerName,
                    email: userEmail,
                },
                theme: {
                    color: "#f59e0b"
                }
            }

            if (!window.Razorpay) {
                toast.error('Payment checkout is loading. Please try again.')
                return
            }

            const rzp1 = new window.Razorpay(options)
            rzp1.open()
        } catch (error) {
            console.error('Payment error:', error)
            toast.error(error.message || 'Payment failed. Please try again.')
        }
    }

    const handleLike = async (postId) => {
        if (likingPostId) return
        setLikingPostId(postId)

        // Optimistic UI toggle
        setPosts((prev) =>
            prev.map((p) => {
                if (p.id !== postId) return p
                const isLiked = !p.isLiked
                const likesCount = isLiked ? (p.likesCount || 0) + 1 : Math.max(0, (p.likesCount || 0) - 1)
                return { ...p, isLiked, likesCount }
            })
        )

        try {
            const response = await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
            const data = await response.json()

            if (response.ok && data.success) {
                setPosts((prev) =>
                    prev.map((p) =>
                        p.id === postId ? { ...p, isLiked: data.isLiked, likesCount: data.likesCount } : p
                    )
                )
            } else if (response.status === 401) {
                toast.info('Please log in to like this post!')
                // Revert optimistic update
                setPosts((prev) =>
                    prev.map((p) => {
                        if (p.id !== postId) return p
                        const isLiked = !p.isLiked
                        const likesCount = isLiked ? (p.likesCount || 0) + 1 : Math.max(0, (p.likesCount || 0) - 1)
                        return { ...p, isLiked, likesCount }
                    })
                )
            }
        } catch (err) {
            console.error('Like error:', err)
        } finally {
            setLikingPostId(null)
        }
    }

    const handleShare = async (post) => {
        const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${post.id}` : ''
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: post.content.slice(0, 100),
                    url: postUrl,
                })
                return
            } catch (err) {
                if (err.name === 'AbortError') return
            }
        }

        if (navigator.clipboard) {
            await navigator.clipboard.writeText(postUrl)
            setCopiedPostId(post.id)
            setTimeout(() => setCopiedPostId(null), 2000)
        }
    }

    const displayName = currentUser.name || username
    const tagline = currentUser.title || null
    const bio = currentUser.bio || null

    return (
        <div className="min-h-screen bg-[#f4ecef5c] pb-16">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <ToastContainer
                position="bottom-left"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Bounce}
            />

            {/* Header: Cover Banner & Profile Avatar */}
            <div className="relative mb-14 sm:mb-16">
                <div className="w-full h-36 sm:h-52 md:h-64 lg:h-72 overflow-hidden">
                    {currentUser.coverUrl ? (
                        <img src={currentUser.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-[#f4ecef5c]" />
                    )}
                </div>

                <div className="absolute -bottom-11 sm:-bottom-12 left-1/2 -translate-x-1/2">
                    <img
                        src={currentUser.profileUrl || "/tea.gif"}
                        alt={displayName}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[var(--card)] bg-[var(--card)] object-cover shadow-md"
                    />
                </div>
            </div>

            {/* Profile Intro & Bio */}
            <div className="max-w-3xl mx-auto text-center px-4 space-y-3 mb-10">
                <div className="flex items-center justify-center gap-1.5">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                        {displayName}
                    </h1>
                    {/* <BadgeCheck className="text-[var(--primary)]" size={20} /> */}
                </div>

                <p className="text-sm sm:text-base font-medium text-[var(--foreground)]/80 max-w-xl mx-auto">
                    {tagline}
                </p>

                {bio && (
                    <p className="text-xs sm:text-sm text-[var(--muted-foreground)] whitespace-pre-wrap max-w-2xl mx-auto leading-relaxed">
                        {bio}
                    </p>
                )}

                {/* Stats Pill */}
                <div className="flex items-center justify-center gap-4 text-xs font-semibold text-[var(--muted-foreground)] pt-1">
                    <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-[var(--primary)]" />
                        {paymentReceived.length} Supporters
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                        <FileText size={14} className="text-[var(--primary)]" />
                        {posts.length} Posts
                    </span>
                </div>
            </div>

            {/* Main Content Layout: LEFT Column (Support Widget) + RIGHT Column (Post Feed) */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN: Support Widget & Supporters (Sticky on desktop) */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">

                        {/* Support / Donation Box */}
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 shadow-[0_8px_24px_rgba(25,25,25,0.03)]">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-8 w-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                                    <Coffee size={18} />
                                </div>
                                <h2 className="text-lg font-bold text-[var(--foreground)]">
                                    Support @{username}
                                </h2>
                            </div>

                            {currentUser.paymentsEnabled ? (
                                <form className="space-y-4">
                                    {/* Preset Quick Buttons */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                                            Select Amount
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[100, 300, 500].map((preset) => (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => setPresetAmount(preset)}
                                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition border ${paymentform.amount === preset.toString()
                                                            ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                                                            : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]'
                                                        }`}
                                                >
                                                    ₹{preset}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Custom Amount */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">
                                            Amount (₹)
                                        </label>
                                        <input
                                            type="number"
                                            name="amount"
                                            min="1"
                                            value={paymentform.amount}
                                            onChange={handlechange}
                                            placeholder="Enter amount"
                                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition"
                                        />
                                    </div>

                                    {/* Supporter Name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={paymentform.name}
                                            onChange={handlechange}
                                            placeholder={user?.fullName || user?.username || "Enter your name or nickname"}
                                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition"
                                        />
                                    </div>

                                    {/* Support Button */}
                                    <button
                                        type="button"
                                        disabled={!isLoaded}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            pay(Number(paymentform.amount) * 100)
                                        }}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                                    >
                                        <Coffee size={16} />
                                        {!isLoaded
                                            ? 'Checking login...'
                                            : !isSignedIn
                                                ? 'Log in to Support'
                                                : `Support ₹${paymentform.amount || '0'}`}
                                    </button>
                                </form>
                            ) : (
                                <div className="rounded-xl border border-dashed border-[var(--border)] p-5 text-center text-xs text-[var(--muted-foreground)]">
                                    This creator has not connected Razorpay yet. Payments are temporarily unavailable.
                                </div>
                            )}
                        </div>

                        {/* Recent Supporters Section */}
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 shadow-[0_8px_24px_rgba(25,25,25,0.03)]">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)] mb-4 flex items-center justify-between">
                                <span>Recent Supporters</span>
                                <span className="text-xs text-[var(--muted-foreground)] font-medium">
                                    {paymentReceived.length} total
                                </span>
                            </h3>

                            {paymentReceived.length ? (
                                <ul className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                    {paymentReceived.map((supporter, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]/60 text-xs"
                                        >
                                            <span className="font-semibold text-[var(--foreground)] truncate">
                                                {supporter.from_user}
                                            </span>
                                            <span className="shrink-0 font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                                                ₹{supporter.amount / 100}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-center text-[var(--muted-foreground)] py-4">
                                    Be the first one to support @{username}!
                                </p>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Posts Feed */}
                    <div className="lg:col-span-7 space-y-5">
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                            <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                                <Sparkles size={18} className="text-[var(--primary)]" />
                                Posts & Updates
                            </h2>
                            <span className="text-xs text-[var(--muted-foreground)] font-medium">
                                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                            </span>
                        </div>

                        {posts.length ? (
                            posts.map((post) => (
                                <article
                                    key={post.id}
                                    className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 shadow-[0_8px_24px_rgba(25,25,25,0.03)]"
                                >
                                    {/* Post Header */}
                                    <div className="flex items-center justify-between gap-2">
                                        <Link
                                            href={`/post/${post.id}`}
                                            className="text-base sm:text-lg font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition line-clamp-2"
                                        >
                                            {post.title}
                                        </Link>
                                        <time className="text-xs text-[var(--muted-foreground)] shrink-0">
                                            {new Date(post.createdAt).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </time>
                                    </div>

                                    {/* Post Text Content */}
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]/85">
                                        {post.content}
                                    </p>

                                    {/* Post Full Image */}
                                    {post.imageUrl && (
                                        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)]/20">
                                            <img
                                                src={post.imageUrl}
                                                alt={post.title}
                                                className="w-full h-auto max-w-full rounded-xl object-contain shadow-sm"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}

                                    {/* Action Bar: Like & Share */}
                                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)]">
                                        <div className="flex items-center gap-3">
                                            {/* Like Button with optimistic update */}
                                            <button
                                                type="button"
                                                onClick={() => handleLike(post.id)}
                                                disabled={likingPostId === post.id}
                                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${post.isLiked
                                                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400'
                                                        : 'hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                                                    }`}
                                            >
                                                <Heart
                                                    size={16}
                                                    className={post.isLiked ? 'fill-rose-500 text-rose-500' : ''}
                                                />
                                                <span>{post.likesCount || 0}</span>
                                            </button>

                                            {/* Share Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleShare(post)}
                                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                                            >
                                                {copiedPostId === post.id ? (
                                                    <>
                                                        <Check size={16} className="text-emerald-600" />
                                                        <span className="text-emerald-600 font-semibold">Link Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Share2 size={16} />
                                                        <span>Share</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <Link
                                            href={`/post/${post.id}`}
                                            className="font-medium hover:text-[var(--primary)] transition"
                                        >
                                            View post →
                                        </Link>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted-foreground)] bg-[var(--card)]/50">
                                <FileText className="mx-auto mb-2 text-[var(--muted-foreground)]/50" size={32} />
                                <p className="font-medium text-[var(--foreground)]">No posts published yet</p>
                                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                    Check back soon to see updates and photos from @{username}.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentPage