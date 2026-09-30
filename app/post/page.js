'use client'

import { useEffect, useState } from 'react'
import { FileText, Send } from 'lucide-react'

export default function PostPage() {
  const [form, setForm] = useState({ title: '', content: '' })
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadPosts = async () => {
    const response = await fetch('/api/posts')
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Could not load posts')
    setPosts(data.posts || [])
  }

  useEffect(() => {
    const loadPostsTimer = window.setTimeout(() => {
      loadPosts().catch((error) => setMessage(error.message)).finally(() => setLoading(false))
    }, 0)

    return () => window.clearTimeout(loadPostsTimer)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not create post')
      setPosts((current) => [data.post, ...current])
      setForm({ title: '', content: '' })
      setMessage('Post published successfully')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="border-b border-[var(--border)] pb-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Post</p><h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Share with your supporters</h1><p className="mt-2 text-sm text-[var(--muted-foreground)]">Publish updates, ideas, and moments from your work.</p></div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]"><FileText size={18} className="text-[var(--primary)]" /> New post</div>
          <input required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Post title" className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]" />
          <textarea required maxLength={5000} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="What would you like to share?" rows={6} className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--primary)]" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className={`text-sm ${message.includes('successfully') ? 'text-emerald-700' : 'text-[var(--muted-foreground)]'}`}>{message}</p><button disabled={saving} type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Publishing...' : 'Publish post'} <Send size={16} /></button></div>
        </form>

        <section className="space-y-3"><h2 className="text-lg font-semibold text-[var(--foreground)]">Your posts</h2>{loading ? <p className="text-sm text-[var(--muted-foreground)]">Loading posts...</p> : posts.length ? posts.map((post) => <article key={post.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"><div className="flex flex-col justify-between gap-2 sm:flex-row"><h3 className="text-lg font-semibold text-[var(--foreground)]">{post.title}</h3><time className="text-xs text-[var(--muted-foreground)]">{new Date(post.createdAt).toLocaleDateString()}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]">{post.content}</p></article>) : <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">Your published posts will appear here.</div>}</section>
      </div>
    </div>
  )
}
