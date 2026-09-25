'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    razorpayId: '',
    razorpaySecret: '',
  })

  const [profilePic, setProfilePic] = useState(null)
  const [coverPic, setCoverPic] = useState(null)
  const [profileFile, setProfileFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [profileMethod, setProfileMethod] = useState('upload')
  const [coverMethod, setCoverMethod] = useState('upload')
  const [profileUrl, setProfileUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) {
      return undefined
    }

    const controller = new AbortController()

    const loadUserData = async () => {
      try {
        const response = await fetch('/api/profile', {
          method: 'GET',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Could not load profile')
        }

        const data = await response.json()
        const user = data.user || {}

        setFormData((previous) => ({
          ...previous,
          name: user.name || '',
          email: user.email || session.user.email,
          username: user.username || '',
          razorpayId: user.razorpayId || '',
          // Secrets are write-only in the dashboard and must not be loaded into browser state.
          razorpaySecret: '',
        }))

        if (user.profileUrl) {
          setProfilePic(user.profileUrl)
          setProfileUrl(user.profileUrl)
          setProfileFile(null)
          setProfileMethod('url')
        }

        if (user.coverUrl) {
          setCoverPic(user.coverUrl)
          setCoverUrl(user.coverUrl)
          setCoverFile(null)
          setCoverMethod('url')
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setMessage('Could not load profile')
        }
      }
    }

    loadUserData()

    return () => controller.abort()
  }, [session?.user?.email, status])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const uploadToCloudinary = async (file, folder) => {
    try {
      setUploading(true)
      const formDataToSend = new FormData()
      formDataToSend.append('file', file)
      formDataToSend.append('folder', folder)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Upload failed')
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      setMessage('Error uploading image: ' + error.message)
      setTimeout(() => setMessage(''), 3000)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePic(reader.result)
        setProfileUrl('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverPicChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPic(reader.result)
        setCoverUrl('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (status !== 'authenticated' || !session?.user?.email) {
      setMessage('Please login again before saving your profile')
      return
    }

    const name = formData.name.trim()
    const username = formData.username.trim().toLowerCase()

    if (!name || !username) {
      setMessage('Name and username are required')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setLoading(true)
    setMessage('')

    try {
      let finalProfileUrl = profileUrl
      let finalCoverUrl = coverUrl

      if (profileMethod === 'upload' && profileFile) {
        const uploadedUrl = await uploadToCloudinary(profileFile, 'profile')
        if (!uploadedUrl) {
          setLoading(false)
          return
        }
        finalProfileUrl = uploadedUrl
      } else if (profileMethod === 'url') {
        finalProfileUrl = profileUrl
      }

      if (coverMethod === 'upload' && coverFile) {
        const uploadedUrl = await uploadToCloudinary(coverFile, 'cover')
        if (!uploadedUrl) {
          setLoading(false)
          return
        }
        finalCoverUrl = uploadedUrl
      } else if (coverMethod === 'url') {
        finalCoverUrl = coverUrl
      }

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: session.user.email,
          username,
          razorpayId: formData.razorpayId,
          razorpaySecret: formData.razorpaySecret,
          profileUrl: finalProfileUrl,
          coverUrl: finalCoverUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save profile')
      }

      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error: ' + error.message)
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnectRazorpay = async () => {
    if (!window.confirm('Disconnect Razorpay and disable payments?')) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          profileUrl,
          coverUrl,
          disconnectRazorpay: true,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect Razorpay')
      }

      setFormData((previous) => ({
        ...previous,
        razorpayId: '',
        razorpaySecret: '',
      }))
      setMessage('Razorpay disconnected successfully')
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffdf8] text-slate-700">
        Loading...
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-[#fffdf8] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Dashboard</p>
            <h1 className="mt-2 text-3xl font-medium text-slate-900">Profile settings</h1>
          </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-slate-600">
            Public profile
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-sm font-medium text-slate-700">Cover image</label>
                <div className="flex gap-2">
                  {['upload', 'url'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setCoverMethod(method)
                        if (method === 'url') setCoverFile(null)
                      }}
                      className={`rounded-md border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors ${
                        coverMethod === method
                          ? 'border-amber-300 bg-amber-100 text-amber-900'
                          : 'border-slate-300 bg-transparent text-slate-700 hover:border-amber-300'
                      }`}
                    >
                      {method === 'upload' ? 'Upload' : 'URL'}
                    </button>
                  ))}
                </div>
              </div>

              {coverMethod === 'upload' ? (
                <label className="block h-36 cursor-pointer overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white transition-colors hover:border-amber-400">
                  {coverPic ? (
                    <img src={coverPic} alt="Cover" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-600">Upload cover image</div>
                  )}
                  <input type="file" accept="image/*" onChange={handleCoverPicChange} className="hidden" disabled={uploading} />
                </label>
              ) : (
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => {
                    setCoverUrl(e.target.value)
                    setCoverPic(e.target.value)
                  }}
                  placeholder="Paste image URL"
                  className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-amber-600"
                />
              )}
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-sm font-medium text-slate-700">Profile picture</label>
                <div className="flex gap-2">
                  {['upload', 'url'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setProfileMethod(method)
                        if (method === 'url') setProfileFile(null)
                      }}
                      className={`rounded-md border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors ${
                        profileMethod === method
                          ? 'border-amber-300 bg-amber-100 text-amber-900'
                          : 'border-slate-300 bg-transparent text-slate-700 hover:border-amber-300'
                      }`}
                    >
                      {method === 'upload' ? 'Upload' : 'URL'}
                    </button>
                  ))}
                </div>
              </div>

              {profileMethod === 'upload' ? (
                <div className="flex items-center gap-4">
                  <label className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white transition-colors hover:border-amber-400">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Photo</span>
                    )}
                    <input type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" disabled={uploading} />
                  </label>
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-800">Add your profile image</p>
                    <p className="mt-1 text-xs">Square images work best</p>
                  </div>
                </div>
              ) : (
                <input
                  type="url"
                  value={profileUrl}
                  onChange={(e) => {
                    setProfileUrl(e.target.value)
                    setProfilePic(e.target.value)
                  }}
                  placeholder="Paste image URL"
                  className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-amber-600"
                />
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-700">Profile details</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-700">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-amber-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-700">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-amber-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-700">Email</label>
                  <input
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="w-full border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleDisconnectRazorpay}
                disabled={loading || uploading || !formData.razorpayId}
                className="mt-4 rounded-md border border-red-300/20 px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-red-200 transition-colors hover:border-red-300/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Disconnect Razorpay
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="mb-4">
                <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-700">Payment setup</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-700">Razorpay ID</label>
                  <input
                    type="text"
                    name="razorpayId"
                    value={formData.razorpayId}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-700">Razorpay Secret</label>
                  <input
                    type="password"
                    name="razorpaySecret"
                    value={formData.razorpaySecret}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-amber-600"
                  />
                </div>
              </div>
            </div>

            {message && (
              <div
                className={`rounded-md border px-3 py-2 text-sm ${
                  message.includes('Error') || message.includes('error')
                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                    : 'border-amber-300 bg-amber-50 text-amber-900'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-medium uppercase tracking-[0.14em] text-slate-900 transition-all hover:bg-amber-300 disabled:opacity-60"
            >
              {loading || uploading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          <aside className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-600">Preview</p>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-600">
                Live
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="h-28 w-full bg-[radial-gradient(circle_at_top,_rgba(244,197,66,0.28),transparent_55%)] relative">
                {coverPic ? (
                  <img src={coverPic} alt="Cover preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-500">Cover</div>
                )}
              </div>

              <div className="relative px-4 pb-4">
                <div className="-mt-8 mb-3 flex items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-100 text-xs uppercase tracking-[0.18em] text-slate-600">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <span>DP</span>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-medium text-slate-900">{formData.name || 'Your name'}</p>
                    <p className="text-xs text-slate-600">@{formData.username || 'yourusername'}</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Contact</p>
                    <p className="mt-1 text-sm text-slate-700">{session?.user?.email || 'you@example.com'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Support</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {formData.razorpayId ? 'Razorpay connected' : 'Connect payment details'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}