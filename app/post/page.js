'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, Send, Image as ImageIcon, X, Heart, Share2, Trash2, Loader2, Check } from 'lucide-react'
import AppPageHeader from '@/components/AppPageHeader'

export default function PostPage() {
  const [form, setForm] = useState({ title: '', content: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [likingId, setLikingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const fileInputRef = useRef(null)

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
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not create post')

      setPosts((current) => [data.post, ...current])
      setForm({ title: '', content: '' })
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

  return (
    <div className="min-h-screen bg-[#f4ecef5c] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-7">
        <AppPageHeader
          eyebrow="Post"
          title="Share with your world"
          description="Publish updates, photos, and moments from your work."
        />

        {/* Post Creation Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_8px_24px_rgba(25,25,25,0.03)] sm:p-6"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <FileText size={18} className="text-[var(--primary)]" /> New post
          </div>

          <input
            required
            maxLength={120}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Post title"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--accent)]"
          />

          <textarea
            required
            maxLength={5000}
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            placeholder="What would you like to share?"
            rows={5}
            className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm leading-4 text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--accent)]"
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
                  Publish post <Send size={16} />
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
                <div>
                  <h3 className="text-[1.1rem] font-semibold text-[var(--foreground)]">{post.title}</h3>
                </div>

                <p className="whitespace-pre-wrap text-[1rem] leading-6 text-[var(--muted-foreground)]">
                  {post.content}
                </p>

                {post.imageUrl && (
                  <div className="mx-auto aspect-[4/5] max-h-[600px] w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)]/20">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="h-full w-full rounded-xl object-contain shadow-sm"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Actions: Likes, Share, Delete, and Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--border)] pt-3.5 pr-2 text-xs text-[var(--muted-foreground)]">
                  <div className="flex items-center gap-2 pl-3 sm:gap-3 flex-wrap">
                    {/* Like Button */}
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${post.isLiked
                          ? 'text-rose-600 hover:bg-rose-100 dark:text-rose-400'
                          : 'hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
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
                      onClick={() => handleShare(post)}
                      className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-medium transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                      {copiedId === post.id ? (
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

                    {/* Delete Post Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      disabled={deletingId === post.id}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      title="Delete post"
                    >
                      {deletingId === post.id ? (
                        <Loader2 size={23} className="animate-spin" />
                      ) : (
                        <Trash2 size={23} />
                      )}
                    </button>
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
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted-foreground)]">
              Your published posts will appear here.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
