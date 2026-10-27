'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, Share2, Trash2, ArrowLeft, Check, Loader2 } from 'lucide-react'

export default function SinglePostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params?.id

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [liking, setLiking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!postId) return

    const fetchPost = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/posts/${postId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Post not found')
        }

        setPost(data.post)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId])

  const handleLike = async () => {
    if (!post || liking) return
    setLiking(true)

    // Optimistic toggle
    const nextIsLiked = !post.isLiked
    const nextLikesCount = nextIsLiked ? (post.likesCount || 0) + 1 : Math.max(0, (post.likesCount || 0) - 1)

    setPost((prev) => ({
      ...prev,
      isLiked: nextIsLiked,
      likesCount: nextLikesCount,
    }))

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
      const data = await response.json()

      if (response.ok && data.success) {
        setPost((prev) => ({
          ...prev,
          isLiked: data.isLiked,
          likesCount: data.likesCount,
        }))
      }
    } catch {
      // Revert if request fails
      setPost((prev) => ({
        ...prev,
        isLiked: !nextIsLiked,
        likesCount: post.likesCount,
      }))
    } finally {
      setLiking(false)
    }
  }

  const handleShare = async () => {
    const postUrl = typeof window !== 'undefined' ? window.location.href : ''

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
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this post?')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete post')
      }

      router.push('/post')
    } catch (err) {
      alert(err.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
          Loading post...
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-[var(--foreground)]">Post Not Found</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {error || 'The post you are looking for does not exist or has been removed.'}
        </p>
        <Link
          href="/post"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <ArrowLeft size={16} /> Back to posts
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Navigation link */}
        <Link
          href="/post"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={14} /> Back to all posts
        </Link>

        {/* Post Container */}
        <article className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_8px_24px_rgba(25,25,25,0.03)] sm:p-6">
          {/* Author Header */}
          <div className="flex items-center justify-between">
            <Link
              href={post.author?.username ? `/${post.author.username}` : '#'}
              className="flex items-center gap-3 group"
            >
              <img
                src={post.author?.profileUrl || '/tea.gif'}
                alt={post.author?.name || 'Creator'}
                className="h-11 w-11 rounded-full border border-[var(--border)] object-cover transition group-hover:ring-2 group-hover:ring-[var(--primary)]"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition">
                  {post.author?.name}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {post.author?.username ? `@${post.author.username}` : 'Creator'}
                </p>
              </div>
            </Link>

          </div>

          {/* Post Content */}
          <div className="space-y-4">
            <h1 className="text-[1.1rem] font-semibold text-[var(--foreground)]">
              {post.title}
            </h1>

            <p className="whitespace-pre-wrap text-[1rem] leading-6 text-[var(--muted-foreground)]">
              {post.content}
            </p>

            {post.imageUrl && (
              <div className="mx-auto aspect-[4/5] max-h-[600px] w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)]/20">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="h-full w-full rounded-xl object-contain shadow-sm"
                  loading="eager"
                />
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex flex-col justify-between gap-3 border-t border-[var(--border)] pt-3.5 pr-2 text-xs text-[var(--muted-foreground)] sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2 pl-3 sm:gap-3">
              {/* Like Button */}
              <button
                type="button"
                onClick={handleLike}
                disabled={liking}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${post.isLiked
                    ? 'text-rose-600 hover:bg-rose-100 dark:text-rose-400'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
              >
                <Heart
                  size={27}
                  className={post.isLiked ? 'fill-rose-500 text-rose-500' : 'text-[var(--muted-foreground)]'}
                />
                <span className="text-lg">{post.likesCount || 0}</span>
              </button>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-medium transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                {copied ? (
                  <>
                    <Check size={21} className="text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={22} />
                    <span className="text-sm">Share</span>
                  </>
                )}
              </button>

              {/* Author Delete Button */}
              {post.isAuthor && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50"
                  title="Delete this post"
                >
                  {deleting ? (
                    <Loader2 size={23} className="animate-spin" />
                  ) : (
                    <Trash2 size={23} />
                  )}
                </button>
              )}
            </div>

            <time className="text-xs text-[var(--muted-foreground)]">
              {new Date(post.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>
        </article>
      </div>
    </div>
  )
}
