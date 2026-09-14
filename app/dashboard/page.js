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
      <div className="flex min-h-screen items-center justify-center bg-[#171717] text-[#F5F1E8]/72">
        Loading...
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-[#171717] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#F5F1E8]/5 bg-[#1A1A1A] p-6 shadow-[0_0_0_1px_rgba(245,241,232,0.02)] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#e0bf6498]">Dashboard</p>
            <h1 className="mt-2 text-3xl font-medium text-[#F5F1E8]">Profile settings</h1>
          </div>
            <div className="rounded-full border border-[#F5F1E8]/10 bg-[#171717] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[#F5F1E8]/60">
            Public profile
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[#F5F1E8]/5 bg-[#1A1A1A] p-4 sm:p-6 shadow-[0_0_0_1px_rgba(245,241,232,0.02)]">
            <div className="space-y-4 rounded-xl border border-[#F5F1E8]/5 bg-[#171717] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-sm font-medium text-[#F5F1E8]/72">Cover image</label>
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
                          ? 'border-[#F5F1E8]/20 bg-white text-[#171717]'
                          : 'border-[#F5F1E8]/10 bg-transparent text-[#F5F1E8]/72 hover:border-[#F5F1E8]/20'
                      }`}
                    >
                      {method === 'upload' ? 'Upload' : 'URL'}
                    </button>
                  ))}
                </div>
              </div>

              {coverMethod === 'upload' ? (
                <label className="block h-36 cursor-pointer overflow-hidden rounded-xl border border-dashed border-[#F5F1E8]/15 bg-[#171717] transition-colors hover:border-[#F5F1E8]/25">
                  {coverPic ? (
                    <img src={coverPic} alt="Cover" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#F5F1E8]/52">Upload cover image</div>
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
                  className="w-full border border-[#F5F1E8]/10 bg-[#171717] px-3 py-2.5 text-sm text-[#F5F1E8] outline-none transition-colors placeholder:text-[#F5F1E8]/35 focus:border-[#e0bf6498]"
                />
              )}
            </div>

            <div className="space-y-4 rounded-xl border border-[#F5F1E8]/5 bg-[#171717] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-sm font-medium text-[#F5F1E8]/72">Profile picture</label>
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
                          ? 'border-[#F5F1E8]/20 bg-white text-[#171717]'
                          : 'border-[#F5F1E8]/10 bg-transparent text-[#F5F1E8]/72 hover:border-[#F5F1E8]/20'
                      }`}
                    >
                      {method === 'upload' ? 'Upload' : 'URL'}
                    </button>
                  ))}
                </div>
              </div>

              {profileMethod === 'upload' ? (
                <div className="flex items-center gap-4">
                  <label className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[#F5F1E8]/15 bg-[#171717] transition-colors hover:border-[#F5F1E8]/25">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#F5F1E8]/52">Photo</span>
                    )}
                    <input type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" disabled={uploading} />
                  </label>
                  <div className="text-sm text-[#F5F1E8]/60">
                    <p className="font-medium text-[#F5F1E8]/75">Add your profile image</p>
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
                  className="w-full border border-[#F5F1E8]/10 bg-[#171717] px-3 py-2.5 text-sm text-[#F5F1E8] outline-none transition-colors placeholder:text-[#F5F1E8]/35 focus:border-[#e0bf6498]"
                />
              )}
            </div>

            <div className="rounded-xl border border-[#F5F1E8]/5 bg-[#171717] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-[#F5F1E8]/65">Profile details</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-[#F5F1E8]/72">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-[#F5F1E8]/10 bg-[#171717] px-3 py-2.5 text-sm text-[#F5F1E8] outline-none transition-colors placeholder:text-[#F5F1E8]/35 focus:border-[#e0bf6498]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-[#F5F1E8]/72">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full border border-[#F5F1E8]/10 bg-[#171717] px-3 py-2.5 text-sm text-[#F5F1E8] outline-none transition-colors placeholder:text-[#F5F1E8]/35 focus:border-[#e0bf6498]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-[#F5F1E8]/72">Email</label>
                  <input
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="w-full border border-[#F5F1E8]/10 bg-[#171717] px-3 py-2.5 text-sm text-[#F5F1E8]/52 outline-none"
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

            <div className="rounded-xl border border-[#F5F1E8]/5 bg-[#171717] p-4 sm:p-5">
              <div className="mb-4">
                <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-[#F5F1E8]/65">Payment setup</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-[#F5F1E8]/72">Razorpay ID</label>
                  <input
                    type="text"
                    name="razorpayId"
                    value={formData.razorpayId}
                    onChange={handleInputChange}
                    className="w-full border border-[#F5F1E8]/10 bg-[#171717] px-3 py-2.5 text-sm text-[#F5F1E8] outline-none transition-colors placeholder:text-[#F5F1E8]/35 focus:border-[#e0bf6498]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#F5F1E8]/72">Razorpay Secret</label>
                  <input
                    type="password"
                    name="razorpaySecret"
                    value={formData.razorpaySecret}
                    onChange={handleInputChange}
                    className="w-full border border-[#F5F1E8]/10 bg-[#171717] px-3 py-2.5 text-sm text-[#F5F1E8] outline-none transition-colors placeholder:text-[#F5F1E8]/35 focus:border-[#e0bf6498]"
                  />
                </div>
              </div>
            </div>

            {message && (
              <div
                className={`rounded-md border px-3 py-2 text-sm ${
                  message.includes('Error') || message.includes('error')
                    ? 'border-[#e0bf6498]/30 bg-[#e0bf6498]/10 text-[#F5F1E8]'
                    : 'border-[#e0bf6498]/30 bg-[#e0bf6498]/10 text-[#F5F1E8]'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium uppercase tracking-[0.14em] text-[#171717] transition-all hover:bg-[#F5F1E8] disabled:opacity-60"
            >
              {loading || uploading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          <aside className="rounded-2xl border border-[#F5F1E8]/5 bg-[#1A1A1A] p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-[#F5F1E8]/55">Preview</p>
              <span className="rounded-full border border-[#F5F1E8]/10 bg-[#171717] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#F5F1E8]/60">
                Live
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#F5F1E8]/5 bg-[#171717]">
              <div className="h-28 w-full bg-[radial-gradient(circle_at_top,_rgba(244,197,66,0.28),transparent_55%)] relative">
                {coverPic ? (
                  <img src={coverPic} alt="Cover preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-[#F5F1E8]/45">Cover</div>
                )}
              </div>

              <div className="relative px-4 pb-4">
                <div className="-mt-8 mb-3 flex items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#171717] bg-[#171717] text-xs uppercase tracking-[0.18em] text-[#F5F1E8]/60">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <span>DP</span>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-medium text-[#F5F1E8]">{formData.name || 'Your name'}</p>
                    <p className="text-xs text-[#F5F1E8]/55">@{formData.username || 'yourusername'}</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-[#F5F1E8]/5 bg-[#1A1A1A] p-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#F5F1E8]/45">Contact</p>
                    <p className="mt-1 text-sm text-[#F5F1E8]/80">{session?.user?.email || 'you@example.com'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#F5F1E8]/45">Support</p>
                    <p className="mt-1 text-sm text-[#F5F1E8]/80">
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