'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import {
  Heart,
  Share2,
  Trash2,
  ArrowLeft,
  Check,
  Loader2,
  Lock,
  ArrowRight,
  MessageSquare,
  Send,
  CornerDownRight,
  X,
  Pencil,
  Globe,
} from 'lucide-react'

export default function SinglePostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params?.id
  const { isSignedIn, user } = useUser()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [liking, setLiking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  // Comments state
  const [comments, setComments] = useState([])
  const [commentsCount, setCommentsCount] = useState(0)
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [replyingToId, setReplyingToId] = useState(null)
  const [replyInput, setReplyInput] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', content: '', visibility: 'public' })
  const [savingEdit, setSavingEdit] = useState(false)

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
        setCommentsCount(data.post.commentsCount || 0)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId])

  useEffect(() => {
    if (!postId || !post || post.isLocked) return

    const fetchComments = async () => {
      try {
        setLoadingComments(true)
        const res = await fetch(`/api/posts/${postId}/comments`)
        const data = await res.json()
        if (res.ok) {
          setComments(data.comments || [])
          setCommentsCount(data.totalCount || 0)
        }
      } catch (e) {
        console.error('Failed to load comments:', e)
      } finally {
        setLoadingComments(false)
      }
    }

    fetchComments()
  }, [postId, post?.isLocked])

  const handleLike = async () => {
    if (!post || liking) return
    setLiking(true)

    // Optimistic toggle
    const nextIsLiked = !post.isLiked
    const nextLikesCount = nextIsLiked
      ? (post.likesCount || 0) + 1
      : Math.max(0, (post.likesCount || 0) - 1)

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
          text: post.content ? post.content.slice(0, 100) : post.title,
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

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditForm({
      title: post.title || '',
      content: post.content || '',
      visibility: post.visibility || 'public',
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editForm.title.trim() || savingEdit) return

    setSavingEdit(true)
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update post')

      setPost((prev) => ({
        ...prev,
        title: data.post.title,
        content: data.post.content,
        visibility: data.post.visibility,
      }))
      setIsEditing(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    const clean = commentInput.trim()
    if (!clean || submittingComment) return

    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: clean }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit comment')

      setCommentInput('')
      setComments((prev) => [...prev, data.comment])
      setCommentsCount((prev) => prev + 1)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleSubmitReply = async (parentCommentId) => {
    const clean = replyInput.trim()
    if (!clean || submittingReply) return

    setSubmittingReply(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: clean, parentCommentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit reply')

      setReplyInput('')
      setReplyingToId(null)
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentCommentId
            ? { ...c, replies: [...(c.replies || []), data.comment] }
            : c
        )
      )
      setCommentsCount((prev) => prev + 1)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleDeleteComment = async (commentId, parentCommentId = null) => {
    if (!window.confirm('Delete this comment?')) return

    setDeletingCommentId(commentId)
    try {
      const res = await fetch(`/api/posts/${postId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete comment')

      if (parentCommentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentCommentId
              ? { ...c, replies: (c.replies || []).filter((r) => r.id !== commentId) }
              : c
          )
        )
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      }
      setCommentsCount((prev) => Math.max(0, prev - (data.deletedCount || 1)))
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingCommentId(null)
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
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Navigation link */}
        <Link
          href={post.author?.username ? `/${post.author.username}` : '/post'}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={14} /> Back to {post.author?.name ? `@${post.author.username}` : 'posts'}
        </Link>

        {/* Post Container */}
        <article className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7 shadow-[0_4px_24px_rgba(25,25,25,0.02)] space-y-5">
          {/* Post Header: Author and Visibility Tag */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-3">
              {post.author?.profileUrl ? (
                <img
                  src={post.author.profileUrl}
                  alt={post.author.name}
                  className="h-10 w-10 rounded-full border border-[var(--border)] object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] font-bold text-white shadow-xs">
                  {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'C'}
                </div>
              )}
              <div>
                <p className="font-semibold text-sm text-[var(--foreground)] leading-tight">
                  {post.author?.name || 'Creator'}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  @{post.author?.username || 'creator'}
                </p>
              </div>
            </div>

            {/* Audience Badge */}
            {post.visibility === 'members' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                {post.isLocked ? (
                  <>
                    <Lock size={11} /> Members Only
                  </>
                ) : (
                  <>
                    <Check size={11} /> Unlocked Member Post
                  </>
                )}
              </span>
            )}
          </div>

          {/* Post Content or Inline Edit Form */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)]">
                  <Pencil size={13} /> Editing post
                </span>
                <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditForm((prev) => ({ ...prev, visibility: 'public' }))}
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-semibold transition ${
                      editForm.visibility === 'public'
                        ? 'bg-white shadow-xs text-slate-900 border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Globe size={11} /> Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm((prev) => ({ ...prev, visibility: 'members' }))}
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-semibold transition ${
                      editForm.visibility === 'members'
                        ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Lock size={11} /> Members Only
                  </button>
                </div>
              </div>

              <input
                required
                maxLength={120}
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Post title"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-lg font-bold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />

              <textarea
                rows={6}
                maxLength={5000}
                value={editForm.content}
                onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Write your post content..."
                className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm leading-relaxed text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />

              <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-3">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editForm.title.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {savingEdit && <Loader2 size={13} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 pt-2">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                {post.title}
              </h1>

              {post.isLocked ? (
                <div className="space-y-4 pt-2">
                  {post.content ? (
                    <div className="relative">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted-foreground)] blur-[1.5px] select-none">
                        {post.content}
                      </p>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--card)]/50 to-[var(--card)]" />
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 p-6 text-center space-y-3 shadow-xs">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Lock size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        This post is exclusive to members
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                        Join any membership tier by {post.author?.name || 'this creator'} to unlock this full post, photos, and future discussions.
                      </p>
                    </div>
                    {post.author?.username && (
                      <Link
                        href={`/${post.author.username}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition"
                      >
                        <span>Unlock on @{post.author.username}&apos;s Page</span>
                        <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {post.content ? (
                    <p className="whitespace-pre-wrap text-[1rem] leading-7 text-[var(--foreground)]/90">
                      {post.content}
                    </p>
                  ) : null}

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
                </>
              )}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col justify-between gap-3 border-t border-[var(--border)] pt-3.5 pr-2 text-xs text-[var(--muted-foreground)] sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2 pl-1 sm:gap-3">
              {/* Like Button */}
              <button
                type="button"
                onClick={handleLike}
                disabled={liking}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                  post.isLiked
                    ? 'text-rose-600 hover:bg-rose-100 dark:text-rose-400'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Heart
                  size={20}
                  className={post.isLiked ? 'fill-rose-500 text-rose-500' : 'text-[var(--muted-foreground)]'}
                />
                <span className="text-sm font-semibold">{post.likesCount || 0}</span>
              </button>

              {/* Comments Anchor Button */}
              <a
                href="#discussion"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <MessageSquare size={18} />
                <span className="text-sm font-semibold">{commentsCount}</span>
              </a>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-medium transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                {copied ? (
                  <>
                    <Check size={18} className="text-emerald-600" />
                    <span className="text-emerald-600 font-semibold text-xs">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={18} />
                    <span className="text-xs">Share</span>
                  </>
                )}
              </button>

              {/* Author Actions: Edit & Delete */}
              {post.isAuthor && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit this post"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50"
                    title="Delete this post"
                  >
                    {deleting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
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

        {/* ========================================================= */}
        {/* COMMUNITY DISCUSSION & COMMENTS THREAD */}
        {/* ========================================================= */}
        <section id="discussion" className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7 shadow-[0_4px_24px_rgba(25,25,25,0.02)] space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-[var(--primary)]" />
              <h2 className="text-base font-bold text-[var(--foreground)]">
                Discussion ({commentsCount})
              </h2>
            </div>
            {post.visibility === 'members' && (
              <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                🔒 Members Discussion
              </span>
            )}
          </div>

          {post.isLocked ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-xs text-[var(--muted-foreground)] space-y-2">
              <Lock size={18} className="mx-auto text-amber-600" />
              <p className="font-semibold text-slate-700">Discussion is locked for members</p>
              <p>Unlock this post above to view and participate in creator discussions.</p>
            </div>
          ) : (
            <>
              {/* New Comment Input Form */}
              {isSignedIn ? (
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <div className="flex items-start gap-3">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover border border-[var(--border)]"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-white font-bold text-xs">
                        {user?.fullName?.charAt(0) || 'U'}
                      </div>
                    )}

                    <div className="flex-1">
                      <textarea
                        rows={2}
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Join the discussion... Share your thoughts or ask a question."
                        maxLength={1000}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                          {1000 - commentInput.length} chars left
                        </span>
                        <button
                          type="submit"
                          disabled={!commentInput.trim() || submittingComment}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                          {submittingComment ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Send size={13} />
                          )}
                          <span>Comment</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="rounded-xl bg-[var(--muted)]/50 p-4 text-center text-xs text-slate-600">
                  <span>Want to join the conversation? </span>
                  <Link
                    href={`/login?redirectUrl=/post/${postId}`}
                    className="font-bold text-[var(--primary)] hover:underline ml-1"
                  >
                    Log in to leave a comment
                  </Link>
                </div>
              )}

              {/* Comments List */}
              {loadingComments ? (
                <div className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                  <Loader2 size={16} className="animate-spin inline mr-1 text-[var(--primary)]" />
                  Loading discussion...
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-5 pt-2 divide-y divide-slate-100">
                  {comments.map((comment) => (
                    <div key={comment.id} className="pt-4 first:pt-0 space-y-3">
                      {/* Comment Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {comment.author?.profileUrl ? (
                            <img
                              src={comment.author.profileUrl}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-xs">
                              {comment.author?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-slate-900">
                                {comment.author?.name || 'Anonymous'}
                              </span>

                              {/* Role Badges */}
                              {comment.author?.roleBadge === 'creator' && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.2 text-[10px] font-bold text-amber-800">
                                  👑 Creator
                                </span>
                              )}
                              {comment.author?.roleBadge === 'member' && (
                                <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.2 text-[10px] font-bold text-purple-800">
                                  💎 VIP Member
                                </span>
                              )}
                              {comment.author?.roleBadge === 'supporter' && (
                                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.2 text-[10px] font-bold text-orange-800">
                                  ☕ Supporter
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400">
                              {new Date(comment.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Delete Comment Button */}
                        {comment.canDelete && (
                          <button
                            type="button"
                            disabled={deletingCommentId === comment.id}
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-slate-400 hover:text-rose-600 transition p-1"
                            title="Delete comment"
                          >
                            {deletingCommentId === comment.id ? (
                              <Loader2 size={13} className="animate-spin text-rose-600" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Comment Body */}
                      <p className="text-xs leading-5 text-slate-800 pl-10 whitespace-pre-wrap">
                        {comment.content}
                      </p>

                      {/* Reply Button Action */}
                      {isSignedIn && (
                        <div className="pl-10">
                          {replyingToId === comment.id ? (
                            <div className="mt-2 space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                                <span className="flex items-center gap-1">
                                  <CornerDownRight size={12} /> Replying to {comment.author?.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingToId(null)
                                    setReplyInput('')
                                  }}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                              <textarea
                                rows={2}
                                value={replyInput}
                                onChange={(e) => setReplyInput(e.target.value)}
                                placeholder="Write your reply..."
                                maxLength={1000}
                                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 outline-none focus:border-[var(--primary)]"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setReplyingToId(null)}
                                  className="rounded-lg px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={!replyInput.trim() || submittingReply}
                                  onClick={() => handleSubmitReply(comment.id)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  {submittingReply && <Loader2 size={11} className="animate-spin" />}
                                  <span>Reply</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToId(comment.id)
                                setReplyInput('')
                              }}
                              className="text-[11px] font-semibold text-slate-500 hover:text-[var(--primary)] transition flex items-center gap-1"
                            >
                              <CornerDownRight size={11} />
                              <span>Reply</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Nested Replies Thread */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-8 mt-3 pl-4 border-l-2 border-slate-200 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="space-y-1.5 pt-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {reply.author?.profileUrl ? (
                                    <img
                                      src={reply.author.profileUrl}
                                      alt=""
                                      className="h-6 w-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-white font-bold text-[10px]">
                                      {reply.author?.name?.charAt(0) || 'U'}
                                    </div>
                                  )}
                                  <span className="font-semibold text-xs text-slate-900">
                                    {reply.author?.name}
                                  </span>

                                  {reply.author?.roleBadge === 'creator' && (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.1 text-[9px] font-bold text-amber-800">
                                      👑 Creator
                                    </span>
                                  )}
                                  {reply.author?.roleBadge === 'member' && (
                                    <span className="inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.1 text-[9px] font-bold text-purple-800">
                                      💎 Member
                                    </span>
                                  )}
                                </div>

                                {reply.canDelete && (
                                  <button
                                    type="button"
                                    disabled={deletingCommentId === reply.id}
                                    onClick={() => handleDeleteComment(reply.id, comment.id)}
                                    className="text-slate-400 hover:text-rose-600 transition"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-800 pl-8 whitespace-pre-wrap">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No comments yet. Be the first to start the discussion!
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
