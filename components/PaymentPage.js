"use client"

import React from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import { fetchPayments, initiate, fetchUserPage, fetchUserPosts, fetchUserTiers } from '@/actions/userAction'
import { ToastContainer, toast, Bounce } from 'react-toastify'
import {
    Heart,
    Share2,
    Coffee,
    Check,
    FileText,
    Sparkles,
    Users,
    BadgeCheck,
    ShieldCheck,
    X,
    ExternalLink,
    Loader2,
    ArrowRight,
    Lock,
    MessageSquare,
    Send,
    CornerDownRight,
    Trash2,
    ChevronDown,
    ChevronUp
} from 'lucide-react'

export const PaymentPage = ({ username }) => {
    const { isLoaded, isSignedIn, user } = useUser()
    const userEmail = user?.primaryEmailAddress?.emailAddress || ''
    const router = useRouter()
    const isMounted = useRef(true)

    const [paymentform, setPaymentform] = useState({ name: '', amount: '100', discordUserId: '' })
    const [currentUser, setCurrentUser] = useState({})
    const [paymentReceived, setPaymentReceived] = useState([])
    const [posts, setPosts] = useState([])
    const [tiers, setTiers] = useState([])
    const [pageLoading, setPageLoading] = useState(true)
    const [copiedPostId, setCopiedPostId] = useState(null)
    const [likingPostId, setLikingPostId] = useState(null)

    // View tab state: 'support' (Support & Posts) vs 'memberships' (Tiers)
    const [activeTab, setActiveTab] = useState('support')

    // Join tier modal state
    const [selectedTier, setSelectedTier] = useState(null)
    const [tierModalOpen, setTierModalOpen] = useState(false)
    const [tierSupporterName, setTierSupporterName] = useState('')
    const [tierDiscordId, setTierDiscordId] = useState('')
    const [joiningTier, setJoiningTier] = useState(false)

    // Inline post comments state for public page
    const [expandedPosts, setExpandedPosts] = useState({})
    const [commentsByPost, setCommentsByPost] = useState({})
    const [showAllComments, setShowAllComments] = useState({})
    const [loadingComments, setLoadingComments] = useState({})
    const [commentInputs, setCommentInputs] = useState({})
    const [submittingComment, setSubmittingComment] = useState({})
    const [replyingToId, setReplyingToId] = useState(null)
    const [replyInputs, setReplyInputs] = useState({})
    const [submittingReply, setSubmittingReply] = useState({})
    const [deletingCommentId, setDeletingCommentId] = useState(null)

    const searchParams = useSearchParams()

    const isOwner = Boolean(
        currentUser?.isOwner ||
        (user && (
            (user.username && currentUser?.username && user.username.toLowerCase() === currentUser.username.toLowerCase()) ||
            (user.primaryEmailAddress?.emailAddress && currentUser?.email && user.primaryEmailAddress.emailAddress.toLowerCase() === currentUser.email.toLowerCase())
        ))
    )

    const loadUserPage = useCallback(async () => {
        if (!isMounted.current) return
        try {
            const [userData, payments, userPosts, userTiers] = await Promise.all([
                fetchUserPage(username),
                fetchPayments(username),
                fetchUserPosts(username),
                fetchUserTiers(username),
            ])

            if (isMounted.current) {
                setCurrentUser(userData || {})
                setPaymentReceived(payments || [])
                setPosts(userPosts || [])
                setTiers(userTiers || [])
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
            const discordRole = searchParams.get("discordrole")
            const tierName = searchParams.get("tier")

            if (tierName) {
                if (discordRole === "assigned") {
                    toast.success(`Welcome to ${decodeURIComponent(tierName)}! Your Discord VIP role has been assigned! 🎉`)
                } else if (discordRole === "not_in_server") {
                    toast.info(`Joined ${decodeURIComponent(tierName)}! Be sure to join the Discord server to claim your role.`)
                } else {
                    toast.success(`Successfully joined ${decodeURIComponent(tierName)}! Thank you for your support. 🎉`)
                }
            } else {
                if (discordRole === "assigned") {
                    toast.success("Payment completed! Your Discord VIP role has been assigned! 🎉")
                } else if (discordRole === "not_in_server") {
                    toast.info("Payment completed! Be sure to join the Discord server to claim your VIP role.")
                } else {
                    toast.success("Payment completed successfully! Thank you for your support.")
                }
            }
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

    // One-time payment execution
    const pay = async (amountInPaise) => {
        try {
            if (!isLoaded) return
            if (!isSignedIn) {
                toast.info("Please log in before making a payment.")
                router.push(`/login?redirectUrl=/${encodeURIComponent(username)}`)
                return
            }

            if (isOwner) {
                toast.info("You cannot pay yourself or purchase your own membership.")
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
                    color: "#c92d6a"
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

    // Open Join Tier modal
    const handleOpenJoinTier = (tier) => {
        if (!isLoaded) return
        if (!isSignedIn) {
            toast.info("Please log in to join a membership tier.")
            router.push(`/login?redirectUrl=/${encodeURIComponent(username)}`)
            return
        }

        if (isOwner) {
            toast.info("You cannot purchase your own membership tier.")
            return
        }

        if (!currentUser?.paymentsEnabled) {
            toast.error("This creator has not connected Razorpay yet.")
            return
        }

        setSelectedTier(tier)
        setTierSupporterName(user?.fullName || user?.username || '')
        setTierDiscordId(paymentform.discordUserId || '')
        setTierModalOpen(true)
    }

    // Submit Tier Payment
    const handleConfirmTierPayment = async (e) => {
        e.preventDefault()
        if (!selectedTier) return

        const payerName = tierSupporterName.trim() || user?.fullName || user?.username || ''
        if (!payerName) {
            toast.error("Please enter your name")
            return
        }

        setJoiningTier(true)
        try {
            const amountInPaise = Math.round(Number(selectedTier.price) * 100)

            const payload = {
                name: payerName,
                discordUserId: tierDiscordId.trim(),
                tierId: selectedTier.id,
                tierTitle: selectedTier.title,
                tierRoleId: selectedTier.discordRoleId || '',
            }

            const x = await initiate(amountInPaise, username, payload)
            if (x?.error) {
                toast.error(x.error)
                return
            }

            const callbackUrl = new URL('/api/razorpay', window.location.origin).toString()

            const options = {
                key: currentUser.razorpayId,
                amount: amountInPaise,
                currency: "INR",
                name: "Earnesy Membership",
                description: `${selectedTier.title} - @${username}`,
                image: currentUser.profileUrl || "/tea.gif",
                order_id: x.id,
                callback_url: callbackUrl,
                prefill: {
                    name: payerName,
                    email: userEmail,
                },
                theme: {
                    color: "#c92d6a"
                }
            }

            if (!window.Razorpay) {
                toast.error('Payment checkout is loading. Please try again.')
                return
            }

            setTierModalOpen(false)
            const rzp = new window.Razorpay(options)
            rzp.open()
        } catch (error) {
            console.error('Tier payment error:', error)
            toast.error(error.message || 'Payment failed. Please try again.')
        } finally {
            setJoiningTier(false)
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

    // Toggle inline discussion drawer for a post on public page
    const handleToggleComments = async (postId) => {
        const isCurrentlyExpanded = Boolean(expandedPosts[postId])
        const nextExpanded = !isCurrentlyExpanded
        setExpandedPosts((prev) => ({ ...prev, [postId]: nextExpanded }))

        if (nextExpanded && !commentsByPost[postId]) {
            setLoadingComments((prev) => ({ ...prev, [postId]: true }))
            try {
                const res = await fetch(`/api/posts/${postId}/comments`)
                const data = await res.json()
                if (res.ok) {
                    setCommentsByPost((prev) => ({ ...prev, [postId]: data.comments || [] }))
                    setPosts((current) =>
                        current.map((p) =>
                            p.id === postId ? { ...p, commentsCount: data.totalCount ?? p.commentsCount } : p
                        )
                    )
                }
            } catch (e) {
                console.error('Failed to load comments:', e)
            } finally {
                setLoadingComments((prev) => ({ ...prev, [postId]: false }))
            }
        }
    }

    // Submit top-level comment on public page
    const handleAddComment = async (e, postId) => {
        e.preventDefault()
        const content = (commentInputs[postId] || '').trim()
        if (!content || submittingComment[postId]) return

        if (!isSignedIn) {
            router.push(`/login?redirectUrl=/${encodeURIComponent(username)}`)
            return
        }

        setSubmittingComment((prev) => ({ ...prev, [postId]: true }))
        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to submit comment')

            setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
            setCommentsByPost((prev) => ({
                ...prev,
                [postId]: [...(prev[postId] || []), data.comment],
            }))
            setPosts((current) =>
                current.map((p) =>
                    p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
                )
            )
        } catch (err) {
            toast.error(err.message || 'Failed to submit comment')
        } finally {
            setSubmittingComment((prev) => ({ ...prev, [postId]: false }))
        }
    }

    // Submit inline reply on public page
    const handleAddReply = async (postId, parentCommentId) => {
        const content = (replyInputs[parentCommentId] || '').trim()
        if (!content || submittingReply[parentCommentId]) return

        if (!isSignedIn) {
            router.push(`/login?redirectUrl=/${encodeURIComponent(username)}`)
            return
        }

        setSubmittingReply((prev) => ({ ...prev, [parentCommentId]: true }))
        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, parentCommentId }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to submit reply')

            setReplyInputs((prev) => ({ ...prev, [parentCommentId]: '' }))
            setReplyingToId(null)
            setCommentsByPost((prev) => ({
                ...prev,
                [postId]: (prev[postId] || []).map((c) =>
                    c.id === parentCommentId
                        ? { ...c, replies: [...(c.replies || []), data.comment] }
                        : c
                ),
            }))
            setPosts((current) =>
                current.map((p) =>
                    p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
                )
            )
        } catch (err) {
            toast.error(err.message || 'Failed to submit reply')
        } finally {
            setSubmittingReply((prev) => ({ ...prev, [parentCommentId]: false }))
        }
    }

    // Delete comment or reply on public page
    const handleDeleteComment = async (postId, commentId, parentCommentId = null) => {
        if (!window.confirm('Delete this comment?')) return

        setDeletingCommentId(commentId)
        try {
            const res = await fetch(`/api/posts/${postId}/comments?commentId=${commentId}`, {
                method: 'DELETE',
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete comment')

            const countDelta = data.deletedCount || 1

            setCommentsByPost((prev) => ({
                ...prev,
                [postId]: parentCommentId
                    ? (prev[postId] || []).map((c) =>
                        c.id === parentCommentId
                            ? { ...c, replies: (c.replies || []).filter((r) => r.id !== commentId) }
                            : c
                    )
                    : (prev[postId] || []).filter((c) => c.id !== commentId),
            }))

            setPosts((current) =>
                current.map((p) =>
                    p.id === postId
                        ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - countDelta) }
                        : p
                )
            )
        } catch (err) {
            toast.error(err.message || 'Failed to delete comment')
        } finally {
            setDeletingCommentId(null)
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
            <div className="max-w-3xl mx-auto text-center px-4 space-y-3 mb-8">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                        {displayName}
                    </h1>
                    {currentUser.category && (
                        <span className="inline-flex items-center rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)] border border-[var(--primary)]/20 shadow-xs">
                            {currentUser.category}
                        </span>
                    )}
                </div>

                {tagline && (
                    <p className="text-sm sm:text-base font-medium text-[var(--foreground)]/80 max-w-xl mx-auto">
                        {tagline}
                    </p>
                )}

                {bio && (
                    <p className="text-xs sm:text-sm text-[var(--muted-foreground)] whitespace-pre-wrap max-w-2xl mx-auto leading-relaxed">
                        {bio}
                    </p>
                )}

                {/* Stats Pill */}
                <div className="flex items-center justify-center gap-3 text-xs font-semibold text-[var(--muted-foreground)] pt-1">
                    <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-[var(--primary)]" />
                        {paymentReceived.length} Supporters
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                        <FileText size={14} className="text-[var(--primary)]" />
                        {posts.length} Posts
                    </span>
                    {tiers.length > 0 && (
                        <>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                                <BadgeCheck size={14} className="text-[var(--primary)]" />
                                {tiers.length} {tiers.length === 1 ? 'Tier' : 'Tiers'}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation Switcher Tabs (Shown when creator has active tiers) */}
            {tiers.length > 0 && (
                <div className="max-w-md mx-auto px-4 mb-8">
                    <div className="flex items-center justify-center rounded-2xl bg-white/80 p-1.5 border border-[var(--border)] shadow-xs">
                        <button
                            type="button"
                            onClick={() => setActiveTab('support')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs sm:text-sm font-semibold transition ${
                                activeTab === 'support'
                                    ? 'bg-[var(--primary)] text-white shadow-xs'
                                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                            }`}
                        >
                            <Coffee size={15} />
                            <span>Support & Feed</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('memberships')}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs sm:text-sm font-semibold transition ${
                                activeTab === 'memberships'
                                    ? 'bg-[var(--primary)] text-white shadow-xs'
                                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                            }`}
                        >
                            <BadgeCheck size={15} />
                            <span>Memberships</span>
                            <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                    activeTab === 'memberships'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[var(--accent)] text-[var(--primary)]'
                                }`}
                            >
                                {tiers.length}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 1: ONE-TIME SUPPORT & POSTS */}
            {activeTab === 'support' && (
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* LEFT COLUMN: Support Widget & Supporters */}
                        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                            {/* Support / Donation Box */}
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 shadow-[0_8px_24px_rgba(25,25,25,0.03)]">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                                            <Coffee size={18} />
                                        </div>
                                        <h2 className="text-lg font-bold text-[var(--foreground)]">
                                            Support @{username}
                                        </h2>
                                    </div>
                                    {tiers.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('memberships')}
                                            className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
                                        >
                                            View Tiers <ArrowRight size={12} />
                                        </button>
                                    )}
                                </div>

                                {isOwner ? (
                                    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/70 via-white to-pink-50/40 p-5 text-center shadow-xs">
                                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                                            <Sparkles size={20} />
                                        </div>
                                        <h3 className="mt-3 text-sm font-bold text-slate-900">Your Creator Profile</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            You are viewing your own public page as visitors see it. Creators cannot send payments to themselves.
                                        </p>
                                        <div className="mt-4 flex flex-col gap-2">
                                            <Link
                                                href="/dashboard"
                                                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] py-2 text-xs font-semibold text-white shadow-xs transition hover:opacity-90"
                                            >
                                                <span>Edit Profile & Links</span>
                                                <ArrowRight size={13} />
                                            </Link>
                                            <Link
                                                href="/memberships"
                                                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                            >
                                                <span>Manage Membership Tiers</span>
                                            </Link>
                                        </div>
                                    </div>
                                ) : currentUser.paymentsEnabled ? (
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
                                                        className={`py-2 px-3 rounded-lg text-xs font-bold transition border ${
                                                            paymentform.amount === preset.toString()
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

                                        {/* Discord VIP Role Perk */}
                                        {currentUser?.hasDiscordRewards && (
                                            <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/50 p-3.5 space-y-2.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-950">
                                                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#5865F2] text-white">
                                                            <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                                                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
                                                            </svg>
                                                        </span>
                                                        <span>Includes Discord VIP Role</span>
                                                    </div>
                                                    {currentUser?.discordInviteUrl && (
                                                        <a
                                                            href={currentUser.discordInviteUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[11px] font-semibold text-[#5865F2] hover:underline"
                                                        >
                                                            Server Link &rarr;
                                                        </a>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                                                        Your Discord User ID (for auto-role)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="discordUserId"
                                                        value={paymentform.discordUserId}
                                                        onChange={handlechange}
                                                        placeholder="e.g. 123456789012345678"
                                                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2] transition"
                                                    />
                                                </div>
                                            </div>
                                        )}

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
                                            <div className="flex items-center gap-2 shrink-0">
                                                {post.visibility === 'members' && (
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                                                            post.isLocked
                                                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                        }`}
                                                    >
                                                        {post.isLocked ? (
                                                            <>
                                                                <Lock size={10} /> Members Only
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Check size={10} /> Unlocked
                                                            </>
                                                        )}
                                                    </span>
                                                )}
                                                <time className="text-xs text-[var(--muted-foreground)]">
                                                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </time>
                                            </div>
                                        </div>

                                        {/* Post Content / Locked Gate */}
                                        {post.isLocked ? (
                                            <div className="space-y-3 pt-1">
                                                {post.content ? (
                                                    <div className="relative overflow-hidden rounded-lg">
                                                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted-foreground)] blur-[1.5px] select-none">
                                                            {post.content}
                                                        </p>
                                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--card)]/50 to-[var(--card)]" />
                                                    </div>
                                                ) : null}

                                                <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 p-5 text-center space-y-3 shadow-xs">
                                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                                        <Lock size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900">
                                                            Exclusive Members-Only Post
                                                        </h4>
                                                        <p className="mt-1 text-xs text-slate-600 max-w-sm mx-auto">
                                                            Join any membership tier by @{username} to unlock this full post, photos, and future exclusive updates.
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('memberships')}
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition"
                                                    >
                                                        <span>Unlock with Membership</span>
                                                        <ArrowRight size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Post Text Content */}
                                                {post.content ? (
                                                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]/85">
                                                        {post.content}
                                                    </p>
                                                ) : null}

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
                                            </>
                                        )}

                                        {/* Action Bar: Like & Share */}
                                        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-foreground)]">
                                            <div className="flex items-center gap-3">
                                                {/* Like Button with optimistic update */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleLike(post.id)}
                                                    disabled={likingPostId === post.id}
                                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                                                        post.isLiked
                                                            ? 'text-rose-600 hover:bg-rose-100 dark:text-rose-400'
                                                            : 'hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                                                    }`}
                                                >
                                                    <Heart
                                                        size={20}
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
                                                {/* Inline Discussion / Comments Toggle Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleComments(post.id)}
                                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                                                        expandedPosts[post.id]
                                                            ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                                                            : 'hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                                                    }`}
                                                    title="View & join discussion"
                                                >
                                                    <MessageSquare size={16} className={expandedPosts[post.id] ? 'text-[var(--primary)]' : ''} />
                                                    <span>{post.commentsCount || 0}</span>
                                                    <span className="hidden sm:inline text-xs">
                                                        {expandedPosts[post.id] ? 'Hide' : 'Comments'}
                                                    </span>
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleComments(post.id)}
                                                    className="font-medium hover:text-[var(--primary)] transition flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                                >
                                                    <span>{expandedPosts[post.id] ? 'Close' : 'Discuss'}</span>
                                                    {expandedPosts[post.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                </button>
                                                <Link
                                                    href={`/post/${post.id}`}
                                                    className="text-[var(--muted-foreground)] hover:text-[var(--primary)] p-1 rounded-md transition"
                                                    title="Open standalone post page"
                                                >
                                                    <ExternalLink size={13} />
                                                </Link>
                                            </div>
                                        </div>

                                        {/* INLINE COMMUNITY DISCUSSION & COMMENTS DRAWER */}
                                        {expandedPosts[post.id] && (
                                            <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-4">
                                                {post.isLocked ? (
                                                    <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-center text-xs text-amber-900 space-y-1.5">
                                                        <div className="flex items-center justify-center gap-1.5 font-bold">
                                                            <Lock size={14} className="text-amber-700" />
                                                            <span>Members-Only Discussion</span>
                                                        </div>
                                                        <p className="text-amber-800">
                                                            This discussion is exclusive to supporters and members. Unlock the post above to participate!
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Comment Input Box */}
                                                        {isSignedIn ? (
                                                            <form onSubmit={(e) => handleAddComment(e, post.id)} className="space-y-2">
                                                                <div className="flex items-start gap-2.5">
                                                                    {user?.imageUrl ? (
                                                                        <img
                                                                            src={user.imageUrl}
                                                                            alt=""
                                                                            className="h-8 w-8 rounded-full object-cover border border-[var(--border)] mt-0.5"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white font-bold text-xs mt-0.5">
                                                                            {user?.fullName?.charAt(0) || 'U'}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex-1 space-y-1.5">
                                                                        <textarea
                                                                            rows={2}
                                                                            value={commentInputs[post.id] || ''}
                                                                            onChange={(e) =>
                                                                                setCommentInputs((prev) => ({
                                                                                    ...prev,
                                                                                    [post.id]: e.target.value,
                                                                                }))
                                                                            }
                                                                            placeholder="Leave a comment or ask a question..."
                                                                            maxLength={1000}
                                                                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-2.5 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                                                                        />
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[10px] text-[var(--muted-foreground)]">
                                                                                {1000 - ((commentInputs[post.id] || '').length)} chars left
                                                                            </span>
                                                                            <button
                                                                                type="submit"
                                                                                disabled={
                                                                                    !(commentInputs[post.id] || '').trim() ||
                                                                                    submittingComment[post.id]
                                                                                }
                                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                                                                            >
                                                                                {submittingComment[post.id] ? (
                                                                                    <Loader2 size={12} className="animate-spin" />
                                                                                ) : (
                                                                                    <Send size={12} />
                                                                                )}
                                                                                <span>Comment</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </form>
                                                        ) : (
                                                            <div className="rounded-xl bg-[var(--muted)]/50 p-3 text-center text-xs text-[var(--muted-foreground)]">
                                                                <span>Want to join the conversation? </span>
                                                                <Link
                                                                    href={`/login?redirectUrl=/${encodeURIComponent(username)}`}
                                                                    className="font-bold text-[var(--primary)] hover:underline ml-1"
                                                                >
                                                                    Log in to leave a comment
                                                                </Link>
                                                            </div>
                                                        )}

                                                        {/* Comments List */}
                                                        {loadingComments[post.id] ? (
                                                            <div className="py-6 text-center text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                                                                <Loader2 size={14} className="animate-spin text-[var(--primary)]" />
                                                                <span>Loading comments...</span>
                                                            </div>
                                                        ) : commentsByPost[post.id] && commentsByPost[post.id].length > 0 ? (
                                                            (() => {
                                                                const allComments = commentsByPost[post.id] || []
                                                                const isExpanded = Boolean(showAllComments[post.id])
                                                                const displayedComments = isExpanded || allComments.length <= 3 ? allComments : allComments.slice(-3)
                                                                return (
                                                                    <div className="space-y-3 pt-1">
                                                                        {allComments.length > 3 && (
                                                                            <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]/60">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        setShowAllComments((prev) => ({
                                                                                            ...prev,
                                                                                            [post.id]: !prev[post.id],
                                                                                        }))
                                                                                    }
                                                                                    className="text-xs font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
                                                                                >
                                                                                    {isExpanded
                                                                                        ? 'Show fewer comments'
                                                                                        : `View all ${allComments.length} comments`}
                                                                                </button>
                                                                                <span className="text-[10px] text-[var(--muted-foreground)]">
                                                                                    Showing {isExpanded ? `all ${allComments.length}` : `latest ${displayedComments.length}`}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        <div className="space-y-3.5 divide-y divide-[var(--border)]/60">
                                                                            {displayedComments.map((comment) => (
                                                                    <div key={comment.id} className="pt-3 first:pt-0 space-y-2">
                                                                        {/* Comment Header */}
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <div className="flex items-center gap-2">
                                                                                {comment.author?.profileUrl ? (
                                                                                    <img
                                                                                        src={comment.author.profileUrl}
                                                                                        alt=""
                                                                                        className="h-6 w-6 rounded-full object-cover border border-[var(--border)]"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-[10px]">
                                                                                        {comment.author?.name?.charAt(0).toUpperCase() || 'U'}
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                                    <span className="text-xs font-semibold text-[var(--foreground)]">
                                                                                        {comment.author?.name || 'Anonymous'}
                                                                                    </span>

                                                                                    {comment.author?.roleBadge === 'creator' && (
                                                                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                                                                                            👑 Creator
                                                                                        </span>
                                                                                    )}
                                                                                    {comment.author?.roleBadge === 'member' && (
                                                                                        <span className="inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-purple-800">
                                                                                            💎 VIP Member
                                                                                        </span>
                                                                                    )}
                                                                                    {comment.author?.roleBadge === 'supporter' && (
                                                                                        <span className="inline-flex items-center rounded-full bg-orange-100 px-1.5 py-0.2 text-[9px] font-bold text-orange-800">
                                                                                            ☕ Supporter
                                                                                        </span>
                                                                                    )}

                                                                                    <span className="text-[10px] text-[var(--muted-foreground)]">
                                                                                        {new Date(comment.createdAt).toLocaleDateString('en-IN', {
                                                                                            month: 'short',
                                                                                            day: 'numeric',
                                                                                            hour: '2-digit',
                                                                                            minute: '2-digit',
                                                                                        })}
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            {comment.canDelete && (
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={deletingCommentId === comment.id}
                                                                                    onClick={() => handleDeleteComment(post.id, comment.id)}
                                                                                    className="text-slate-400 hover:text-rose-600 transition p-1"
                                                                                    title="Delete comment"
                                                                                >
                                                                                    {deletingCommentId === comment.id ? (
                                                                                        <Loader2 size={12} className="animate-spin text-rose-600" />
                                                                                    ) : (
                                                                                        <Trash2 size={12} />
                                                                                    )}
                                                                                </button>
                                                                            )}
                                                                        </div>

                                                                        {/* Comment Content */}
                                                                        <p className="text-xs leading-relaxed text-[var(--foreground)] pl-8 whitespace-pre-wrap">
                                                                            {comment.content}
                                                                        </p>

                                                                        {/* Reply Button & Form */}
                                                                        {isSignedIn && (
                                                                            <div className="pl-8">
                                                                                {replyingToId === comment.id ? (
                                                                                    <div className="mt-2 space-y-2 rounded-xl bg-[var(--muted)]/40 p-2.5 border border-[var(--border)]">
                                                                                        <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--muted-foreground)]">
                                                                                            <span className="flex items-center gap-1">
                                                                                                <CornerDownRight size={11} /> Replying to {comment.author?.name}
                                                                                            </span>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setReplyingToId(null)
                                                                                                    setReplyInputs((prev) => ({
                                                                                                        ...prev,
                                                                                                        [comment.id]: '',
                                                                                                    }))
                                                                                                }}
                                                                                                className="text-slate-400 hover:text-slate-600"
                                                                                            >
                                                                                                <X size={12} />
                                                                                            </button>
                                                                                        </div>
                                                                                        <textarea
                                                                                            rows={2}
                                                                                            value={replyInputs[comment.id] || ''}
                                                                                            onChange={(e) =>
                                                                                                setReplyInputs((prev) => ({
                                                                                                    ...prev,
                                                                                                    [comment.id]: e.target.value,
                                                                                                }))
                                                                                            }
                                                                                            placeholder="Write a reply..."
                                                                                            maxLength={1000}
                                                                                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                                                                                        />
                                                                                        <div className="flex justify-end gap-2">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => setReplyingToId(null)}
                                                                                                className="rounded-md px-2 py-1 text-[11px] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                                                                                            >
                                                                                                Cancel
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                disabled={
                                                                                                    !(replyInputs[comment.id] || '').trim() ||
                                                                                                    submittingReply[comment.id]
                                                                                                }
                                                                                                onClick={() => handleAddReply(post.id, comment.id)}
                                                                                                className="inline-flex items-center gap-1 rounded-md bg-[var(--primary)] px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                                                                                            >
                                                                                                {submittingReply[comment.id] && (
                                                                                                    <Loader2 size={10} className="animate-spin" />
                                                                                                )}
                                                                                                <span>Reply</span>
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setReplyingToId(comment.id)
                                                                                            setReplyInputs((prev) => ({
                                                                                                ...prev,
                                                                                                [comment.id]: '',
                                                                                            }))
                                                                                        }}
                                                                                        className="text-[11px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--primary)] transition flex items-center gap-1"
                                                                                    >
                                                                                        <CornerDownRight size={11} />
                                                                                        <span>Reply</span>
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Nested Replies */}
                                                                        {comment.replies && comment.replies.length > 0 && (
                                                                            <div className="ml-6 mt-2 pl-3 border-l-2 border-[var(--border)] space-y-2.5">
                                                                                {comment.replies.map((reply) => (
                                                                                    <div key={reply.id} className="space-y-1 pt-1.5">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <div className="flex items-center gap-1.5">
                                                                                                {reply.author?.profileUrl ? (
                                                                                                    <img
                                                                                                        src={reply.author.profileUrl}
                                                                                                        alt=""
                                                                                                        className="h-5 w-5 rounded-full object-cover"
                                                                                                    />
                                                                                                ) : (
                                                                                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white font-bold text-[9px]">
                                                                                                        {reply.author?.name?.charAt(0) || 'U'}
                                                                                                    </div>
                                                                                                )}
                                                                                                <span className="font-semibold text-[11px] text-[var(--foreground)]">
                                                                                                    {reply.author?.name}
                                                                                                </span>
                                                                                                {reply.author?.roleBadge === 'creator' && (
                                                                                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.1 text-[9px] font-bold text-amber-800">
                                                                                                        👑 Creator
                                                                                                    </span>
                                                                                                )}
                                                                                                {reply.author?.roleBadge === 'member' && (
                                                                                                    <span className="inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.1 text-[9px] font-bold text-purple-800">
                                                                                                        💎 VIP
                                                                                                    </span>
                                                                                                )}
                                                                                                {reply.author?.roleBadge === 'supporter' && (
                                                                                                    <span className="inline-flex items-center rounded-full bg-orange-100 px-1.5 py-0.1 text-[9px] font-bold text-orange-800">
                                                                                                        ☕ Supporter
                                                                                                    </span>
                                                                                                )}
                                                                                                <span className="text-[10px] text-[var(--muted-foreground)]">
                                                                                                    {new Date(reply.createdAt).toLocaleDateString('en-IN', {
                                                                                                        month: 'short',
                                                                                                        day: 'numeric',
                                                                                                    })}
                                                                                                </span>
                                                                                            </div>

                                                                                            {reply.canDelete && (
                                                                                                <button
                                                                                                    type="button"
                                                                                                    disabled={deletingCommentId === reply.id}
                                                                                                    onClick={() => handleDeleteComment(post.id, reply.id, comment.id)}
                                                                                                    className="text-slate-400 hover:text-rose-600 transition"
                                                                                                    title="Delete reply"
                                                                                                >
                                                                                                    <Trash2 size={11} />
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className="text-xs text-[var(--foreground)] pl-6 whitespace-pre-wrap">
                                                                                            {reply.content}
                                                                                        </p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })()
                                                        ) : (
                                                            <div className="py-4 text-center text-xs text-[var(--muted-foreground)]">
                                                                No comments yet. Start the conversation with @{username}!
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
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
            )}

            {/* TAB CONTENT 2: PUBLIC MEMBERSHIP PLANS SHOWCASE */}
            {activeTab === 'memberships' && (
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
                            Select a Membership Tier
                        </h2>
                        <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-xl mx-auto">
                            Join a monthly membership to unlock exclusive supporter perks, direct community chat on Discord, and support @{username}.
                        </p>
                    </div>

                    {tiers.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted-foreground)] bg-white/70">
                            <BadgeCheck className="mx-auto mb-2 text-[var(--muted-foreground)]/50" size={32} />
                            <p className="font-medium text-[var(--foreground)]">No active membership tiers yet</p>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">
                                @{username} hasn&apos;t published any tiers yet. You can still support them with a one-time contribution!
                            </p>
                            <button
                                type="button"
                                onClick={() => setActiveTab('support')}
                                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:opacity-90"
                            >
                                <Coffee size={14} /> Back to One-Time Support
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                            {tiers.map((tier) => (
                                <div
                                    key={tier.id}
                                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[var(--primary)]/40"
                                >
                                    <div>
                                        {/* Tier Title and Price */}
                                        <div className="border-b border-slate-100 pb-4">
                                            <h3 className="text-lg font-bold text-slate-900">{tier.title}</h3>
                                            <div className="mt-2 flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-[var(--foreground)]">
                                                    ₹{tier.price}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-400">/ month</span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {tier.description && (
                                            <p className="mt-4 text-xs leading-relaxed text-slate-600">
                                                {tier.description}
                                            </p>
                                        )}

                                        {/* Discord Perk Badge */}
                                        {tier.discordPerk && (
                                            <div className="mt-4 flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs font-medium text-indigo-950">
                                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-[#5865F2] text-white">
                                                    <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24">
                                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
                                                    </svg>
                                                </span>
                                                <div>
                                                    <span className="font-semibold text-[#5865F2]">Discord VIP Role Included</span>
                                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                                        Auto-assigned in creator&apos;s server
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Perks List */}
                                        {tier.perks && tier.perks.length > 0 && (
                                            <div className="mt-5 space-y-2">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                    What&apos;s Included:
                                                </p>
                                                <ul className="space-y-2">
                                                    {tier.perks.map((perk, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                                                            <Check size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                                                            <span>{perk}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-6 pt-4 border-t border-slate-100">
                                        {isOwner ? (
                                            <Link
                                                href="/memberships"
                                                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                <span>Manage Tier (Owner)</span>
                                                <ArrowRight size={13} />
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenJoinTier(tier)}
                                                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] py-2.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95 active:scale-[0.98]"
                                            >
                                                <span>Join for ₹{tier.price}/mo</span>
                                                <ArrowRight size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* JOIN TIER CONFIRMATION MODAL */}
            {tierModalOpen && selectedTier && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                    <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setTierModalOpen(false)}
                            className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                            <X size={18} />
                        </button>

                        {/* Modal Header */}
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
                                Join Membership Tier
                            </span>
                            <h3 className="mt-1 text-xl font-bold text-slate-900">
                                {selectedTier.title}
                            </h3>
                            <div className="mt-1 flex items-baseline gap-1">
                                <span className="text-2xl font-black text-slate-900">₹{selectedTier.price}</span>
                                <span className="text-xs text-slate-400">/ month</span>
                            </div>
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleConfirmTierPayment} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Your Display Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={tierSupporterName}
                                    onChange={(e) => setTierSupporterName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                                />
                            </div>

                            {/* Discord User ID input if tier includes Discord perk */}
                            {selectedTier.discordPerk && (
                                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-semibold text-indigo-950">
                                            Your Discord User ID (for VIP Role)
                                        </label>
                                        {currentUser?.discordInviteUrl && (
                                            <a
                                                href={currentUser.discordInviteUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] font-semibold text-[#5865F2] hover:underline flex items-center gap-0.5"
                                            >
                                                Server Invite <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={tierDiscordId}
                                        onChange={(e) => setTierDiscordId(e.target.value)}
                                        placeholder="e.g. 123456789012345678"
                                        className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2]"
                                    />
                                    <p className="text-[10px] text-slate-500">
                                        Right-click your Discord profile with Developer Mode on to copy your User ID.
                                    </p>
                                </div>
                            )}

                            {/* Summary of Perks */}
                            {selectedTier.perks && selectedTier.perks.length > 0 && (
                                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs text-slate-600">
                                    <p className="font-semibold text-slate-800 mb-1.5">Your Perks:</p>
                                    <ul className="space-y-1">
                                        {selectedTier.perks.slice(0, 3).map((perk, i) => (
                                            <li key={i} className="flex items-center gap-1.5">
                                                <Check size={12} className="text-emerald-600 shrink-0" />
                                                <span className="truncate">{perk}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Submit & Cancel */}
                            <div className="pt-2 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setTierModalOpen(false)}
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={joiningTier}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-95 disabled:opacity-50"
                                >
                                    {joiningTier ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin" /> Preparing...
                                        </>
                                    ) : (
                                        <span>Proceed to Payment (₹{selectedTier.price})</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PaymentPage
