'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import {
  FileText,
  Send,
  Image as ImageIcon,
  X,
  Heart,
  Share2,
  Trash2,
  Loader2,
  Check,
  Globe,
  Lock,
  MessageSquare,
  CornerDownRight,
  ExternalLink,
  ArrowRight,
  Pencil,
} from 'lucide-react'
import AppPageHeader from '@/components/AppPageHeader'

export default function PostPage() {
  const { user } = useUser()

  // Creation form state
  const [form, setForm] = useState({ title: '', content: '', visibility: 'public' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [likingId, setLikingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [editingPostId, setEditingPostId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', content: '', visibility: 'public' })
  const [savingEdit, setSavingEdit] = useState(false)
  const fileInputRef = useRef(null)

  // Comments / Discussion states
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

  const loadPosts = async () => {
    const response = await fetch('/api/posts')
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Could not load posts')
    setPosts(data.posts || [])
  }

  useEffect(() => {
    const loadPostsTimer = window.setTimeout(() => {
      loadPosts()
        .catch((error) => setMessage(error.message))
        .finally(() => setLoading(false))
    }, 0)

    return () => window.clearTimeout(loadPostsTimer)
  }, [])

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image must be 5 MB or smaller.')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setMessage('')
  }

  const removeSelectedImage = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImage = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'posts')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload image')
    }

    return data.url
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      let imageUrl = null

      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile)
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          imageUrl,
          visibility: form.visibility,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not create post')

      setPosts((current) => [data.post, ...current])
      setForm({ title: '', content: '', visibility: 'public' })
      removeSelectedImage()
      setMessage('Post published successfully')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLike = async (postId) => {
    if (likingId) return
    setLikingId(postId)

    // Optimistic UI update
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) return post
        const isLiked = !post.isLiked
        const likesCount = isLiked ? (post.likesCount || 0) + 1 : Math.max(0, (post.likesCount || 0) - 1)
        return { ...post, isLiked, likesCount }
      })
    )

    try {
      const response = await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
      const data = await response.json()

      if (response.ok && data.success) {
        setPosts((current) =>
          current.map((post) =>
            post.id === postId
              ? { ...post, isLiked: data.isLiked, likesCount: data.likesCount }
              : post
          )
        )
      } else {
        loadPosts().catch(() => { })
      }
    } catch {
      loadPosts().catch(() => { })
    } finally {
      setLikingId(null)
    }
  }

  const handleShare = async (post) => {
    const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${post.id}` : ''

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
      setCopiedId(post.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to permanently delete this post?')) {
      return
    }

    setDeletingId(postId)
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete post')
      }

      setPosts((current) => current.filter((p) => p.id !== postId))
      setMessage('Post deleted successfully')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleStartEdit = (post) => {
    setEditingPostId(post.id)
    setEditForm({
      title: post.title || '',
      content: post.content || '',
      visibility: post.visibility || 'public',
    })
  }

  const handleCancelEdit = () => {
    setEditingPostId(null)
    setEditForm({ title: '', content: '', visibility: 'public' })
  }

  const handleSaveEdit = async (e, postId) => {
    e.preventDefault()
    if (!editForm.title.trim() || savingEdit) return

    setSavingEdit(true)
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          visibility: editForm.visibility,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update post')

      setPosts((current) =>
        current.map((p) =>
          p.id === postId
            ? {
              ...p,
              title: data.post.title,
              content: data.post.content,
              visibility: data.post.visibility,
            }
            : p
        )
      )

      setEditingPostId(null)
      setMessage('Post updated successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert(err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  // Toggle discussion drawer & load comments for a post
  const handleToggleComments = async (postId) => {
    const isCurrentlyExpanded = Boolean(expandedPosts[postId])
    const nextExpanded = !isCurrentlyExpanded

    setExpandedPosts((prev) => ({ ...prev, [postId]: nextExpanded }))

    // Fetch comments on open if not already loaded
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

  // Submit top-level comment
  const handleAddComment = async (e, postId) => {
    e.preventDefault()
    const content = (commentInputs[postId] || '').trim()
    if (!content || submittingComment[postId]) return

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
      alert(err.message)
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [postId]: false }))
    }
  }

  // Submit reply to a comment
  const handleAddReply = async (postId, parentCommentId) => {
    const content = (replyInputs[parentCommentId] || '').trim()
    if (!content || submittingReply[parentCommentId]) return

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
      alert(err.message)
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [parentCommentId]: false }))
    }
  }

  // Delete comment or reply
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
      alert(err.message)
    } finally {
      setDeletingCommentId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4ecef5c] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-7">
        <AppPageHeader
          eyebrow="Post"
          title="Share with your world"
          description="Publish updates, photos, and exclusive content for your community."
        />

        {/* Post Creation Form */}
        <form
          suppressHydrationWarning
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_8px_24px_rgba(25,25,25,0.03)] sm:p-6"
        >
          <div className="flex items-center justify-between text-sm font-semibold text-[var(--foreground)]">
            <span className="flex items-center gap-2">
              <FileText size={18} className="text-[var(--primary)]" /> New post
            </span>
            {/* Audience Toggle */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] p-1 text-xs">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setForm({ ...form, visibility: 'public' })}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition ${form.visibility === 'public'
                    ? 'bg-white shadow-xs text-slate-900 border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Globe size={13} className="text-slate-600" />
                <span>Public</span>
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setForm({ ...form, visibility: 'members' })}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition ${form.visibility === 'members'
                    ? 'bg-amber-50 shadow-xs text-amber-900 border border-amber-200'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Lock size={13} className="text-amber-600" />
                <span>Members Only</span>
              </button>
            </div>
          </div>

          <input
            suppressHydrationWarning
            required
            maxLength={120}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Post title"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--accent)]"
          />

          <textarea
            suppressHydrationWarning
            maxLength={5000}
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            placeholder={
              form.visibility === 'members'
                ? 'Share exclusive behind-the-scenes content, early previews, or private messages (Optional)...'
                : 'What would you like to share with your audience? (Optional)'
            }
            rows={5}
            className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm leading-relaxed text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--accent)]"
          />

          {/* Image Preview */}
          {previewUrl && (
            <div className="relative inline-block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-1">
              <img
                src={previewUrl}
                alt="Upload preview"
                className="max-h-80 max-w-full rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={removeSelectedImage}
                className="absolute right-3 top-3 rounded-full bg-black/75 p-1.5 text-white transition hover:bg-black"
                title="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--border)] pt-4">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageSelect}
                className="hidden"
                id="post-photo-upload"
              />
              <label
                htmlFor="post-photo-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]"
              >
                <ImageIcon size={16} className="text-[var(--primary)]" />
                {selectedFile ? 'Change Photo' : 'Add Photo'}
              </label>

              {message && (
                <p
                  className={`text-xs ${message.includes('successfully') ? 'text-emerald-600 font-medium' : 'text-rose-500'
                    }`}
                >
                  {message}
                </p>
              )}
            </div>

            <button
              suppressHydrationWarning
              disabled={saving}
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Publishing...
                </>
              ) : (
                <>
                  {form.visibility === 'members' ? 'Publish Member Post' : 'Publish post'} <Send size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Posts Feed */}
        <section className="space-y-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Your posts</h2>

          {loading ? (
            <p className="text-sm text-[var(--muted-foreground)]">Loading posts...</p>
          ) : posts.length ? (
            posts.map((post) => (
              <article
                key={post.id}
                className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_8px_24px_rgba(25,25,25,0.03)] sm:p-6"
              >
                {editingPostId === post.id ? (
                  <form onSubmit={(e) => handleSaveEdit(e, post.id)} className="space-y-4">
                    <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)]">
                        <Pencil size={13} /> Edit post
                      </span>
                      {/* Visibility Toggle */}
                      <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setEditForm((prev) => ({ ...prev, visibility: 'public' }))}
                          className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-semibold transition ${editForm.visibility === 'public'
                              ? 'bg-white shadow-xs text-slate-900 border border-slate-200'
                              : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                          <Globe size={11} /> Public
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditForm((prev) => ({ ...prev, visibility: 'members' }))}
                          className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-semibold transition ${editForm.visibility === 'members'
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
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
                    />

                    <textarea
                      rows={4}
                      maxLength={5000}
                      value={editForm.content}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="Post content (optional)..."
                      className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm leading-relaxed text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
                    />

                    <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-3">
                      <button
                        type="button"
                        disabled={savingEdit}
                        onClick={handleCancelEdit}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition"
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
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[1.1rem] font-semibold text-[var(--foreground)]">{post.title}</h3>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border ${post.visibility === 'members'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                      >
                        {post.visibility === 'members' ? (
                          <>
                            <Lock size={10} /> Members Only
                          </>
                        ) : (
                          <>
                            <Globe size={10} /> Public
                          </>
                        )}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted-foreground)]">
                      {post.content}
                    </p>

                    {post.imageUrl && (
                      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-1">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="max-h-96 w-full rounded-lg object-contain"
                        />
                      </div>
                    )}

                    {/* Post Action Bar */}
                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                        {/* Like button */}
                        <button
                          type="button"
                          disabled={likingId === post.id}
                          onClick={() => handleLike(post.id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-medium transition ${post.isLiked
                              ? 'border-rose-200 bg-rose-50 text-rose-600'
                              : 'border-[var(--border)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                            }`}
                        >
                          <Heart
                            size={14}
                            className={post.isLiked ? 'fill-rose-500 text-rose-500' : ''}
                          />
                          <span>{post.likesCount || 0}</span>
                        </button>

                        {/* Comments Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleComments(post.id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-medium transition ${expandedPosts[post.id]
                              ? 'border-[var(--primary)] bg-[var(--accent)] text-[var(--primary)]'
                              : 'border-[var(--border)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                            }`}
                          title="View and reply to comments"
                        >
                          <MessageSquare
                            size={14}
                            className={expandedPosts[post.id] ? 'text-[var(--primary)]' : ''}
                          />
                          <span>{post.commentsCount || 0}</span>
                          <span className="hidden sm:inline text-[11px]">
                            {expandedPosts[post.id] ? 'Hide' : 'Comments'}
                          </span>
                        </button>

                        {/* Share button */}
                        <button
                          type="button"
                          onClick={() => handleShare(post)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 font-medium transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                        >
                          {copiedId === post.id ? (
                            <>
                              <Check size={14} className="text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Share2 size={14} />
                              <span>Share</span>
                            </>
                          )}
                        </button>

                        {/* Standalone post link */}
                        <Link
                          href={`/post/${post.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 font-medium transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                          title="Open standalone post page"
                        >
                          <ExternalLink size={13} />
                          <span className="hidden sm:inline">Page</span>
                        </Link>
                      </div>

                      {/* Post Management Actions: Edit & Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(post)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          title="Edit post"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === post.id}
                          onClick={() => handleDelete(post.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          title="Delete post"
                        >
                          {deletingId === post.id ? (
                            <Loader2 size={15} className="animate-spin text-rose-600" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* ========================================================= */}
                {/* INLINE COMMUNITY DISCUSSION & COMMENTS DRAWER */}
                {/* ========================================================= */}
                {expandedPosts[post.id] && (
                  <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={16} className="text-[var(--primary)]" />
                        <h4 className="text-xs font-bold text-[var(--foreground)]">
                          Discussion ({post.commentsCount || 0})
                        </h4>
                      </div>
                      <Link
                        href={`/post/${post.id}#discussion`}
                        className="text-[11px] font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Open full page</span>
                        <ArrowRight size={11} />
                      </Link>
                    </div>

                    {/* New Comment Input Form */}
                    <form
                      onSubmit={(e) => handleAddComment(e, post.id)}
                      className="space-y-2"
                    >
                      <div className="flex items-start gap-2.5">
                        {user?.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover border border-[var(--border)] mt-0.5"
                          />
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white font-bold text-[10px] mt-0.5">
                            {user?.fullName?.charAt(0) || 'C'}
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
                            placeholder="Add a comment or reply to your community..."
                            maxLength={1000}
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-2.5 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
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
                              className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
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
                              </div>
                            )}
                            <div className="space-y-3.5 divide-y divide-[var(--border)]/60">
                              {displayedComments.map((comment) => (
                                <div key={comment.id} className="pt-3 first:pt-0 space-y-2">
                                  {/* Comment header */}
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

                                  {/* Comment content */}
                                  <p className="text-xs leading-relaxed text-[var(--foreground)] pl-8 whitespace-pre-wrap">
                                    {comment.content}
                                  </p>

                                  {/* Reply button & form */}
                                  <div className="pl-8">
                                    {replyingToId === comment.id ? (
                                      <div className="mt-2 space-y-2 rounded-lg bg-[var(--muted)]/40 p-2.5 border border-[var(--border)]">
                                        <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--muted-foreground)]">
                                          <span className="flex items-center gap-1">
                                            <CornerDownRight size={11} /> Replying to{' '}
                                            {comment.author?.name}
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
                                          className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
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

                                  {/* Nested replies */}
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
                                                {new Date(reply.createdAt).toLocaleDateString(
                                                  'en-IN',
                                                  {
                                                    month: 'short',
                                                    day: 'numeric',
                                                  }
                                                )}
                                              </span>
                                            </div>

                                            {reply.canDelete && (
                                              <button
                                                type="button"
                                                disabled={deletingCommentId === reply.id}
                                                onClick={() =>
                                                  handleDeleteComment(post.id, reply.id, comment.id)
                                                }
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
                        No comments yet. Start the conversation with your community!
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted-foreground)]">
              No posts published yet. Share your first update above!
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
