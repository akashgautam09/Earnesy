'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ExternalLink, HelpCircle, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react'

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser()
  const status = !isLoaded ? 'loading' : isSignedIn ? 'authenticated' : 'unauthenticated'
  const userEmail = user?.primaryEmailAddress?.emailAddress || ''
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    title: '',
    bio: '',
    discordServerId: '',
    discordRoleId: '',
    discordInviteUrl: '',
    discordUserId: '',
    razorpayId: '',
    razorpaySecret: '',
  })

  const [testingDiscord, setTestingDiscord] = useState(false)
  const [discordTestResult, setDiscordTestResult] = useState(null)
  const [showDiscordGuide, setShowDiscordGuide] = useState(false)

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
    if (status !== 'authenticated' || !userEmail) {
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
          email: user.email || userEmail,
          username: user.username || '',
          title: user.title || '',
          bio: user.bio || '',
          discordServerId: user.discordServerId || '',
          discordRoleId: user.discordRoleId || '',
          discordInviteUrl: user.discordInviteUrl || '',
          discordUserId: user.discordUserId || '',
          razorpayId: user.razorpayId || '',
          // Secrets are write-only in the dashboard and must not be loaded into browser state.
          razorpaySecret: '',
        }))

        if (user.profileUrl) {
          setProfilePic(user.profileUrl)
          setProfileUrl(user.profileUrl)
          setProfileFile(null)
        }

        if (user.coverUrl) {
          setCoverPic(user.coverUrl)
          setCoverUrl(user.coverUrl)
          setCoverFile(null)
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setMessage('Could not load profile')
        }
      }
    }

    loadUserData()

    return () => controller.abort()
  }, [userEmail, status])

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

    if (status !== 'authenticated' || !userEmail) {
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
          email: userEmail,
          username,
          title: formData.title,
          bio: formData.bio,
          discordServerId: formData.discordServerId,
          discordRoleId: formData.discordRoleId,
          discordInviteUrl: formData.discordInviteUrl,
          discordUserId: formData.discordUserId,
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

  const handleTestDiscord = async () => {
    if (!formData.discordServerId?.trim() || !formData.discordRoleId?.trim()) {
      setDiscordTestResult({ success: false, message: 'Please enter both Server ID and Role ID to test.' })
      return
    }

    setTestingDiscord(true)
    setDiscordTestResult(null)

    try {
      const res = await fetch('/api/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: formData.discordServerId.trim(),
          roleId: formData.discordRoleId.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setDiscordTestResult({
          success: true,
          message: `Connected to "${data.guildName}"! Bot has permission to assign @${data.roleName}.`,
        })
      } else {
        setDiscordTestResult({
          success: false,
          message: data.error || 'Connection test failed',
        })
      }
    } catch (err) {
      setDiscordTestResult({ success: false, message: err.message || 'Network error testing Discord' })
    } finally {
      setTestingDiscord(false)
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
    <div className="min-h-screen bg-[#f4ecef5c] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
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
                      className={`rounded-md border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors ${coverMethod === method
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
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleCoverPicChange} className="hidden" disabled={uploading} />
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
                      className={`rounded-md border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors ${profileMethod === method
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
                    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleProfilePicChange} className="hidden" disabled={uploading} />
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
                    value={userEmail}
                    disabled
                    className="w-full border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-700">What are you creating? (Title / Headline)</label>
                  <input
                    type="text"
                    name="title"
                    maxLength={120}
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Creating digital, art and web dev tutorials"
                    className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-amber-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-700">About (Bio)</label>
                  <textarea
                    name="bio"
                    maxLength={1000}
                    rows={3}
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell your supporters about yourself and your work..."
                    className="w-full resize-y border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 focus:border-amber-600"
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

            {/* Discord Community & VIP Role Section */}
            <div className="rounded-xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 p-4 sm:p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-indigo-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#5865F2] text-white">
                      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z" />
                      </svg>
                    </span>
                    <h2 className="text-sm font-semibold tracking-wide text-slate-900">Discord Community & VIP Perks</h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Automatically grant VIP roles to your supporters in Discord.
                  </p>
                </div>

                <a
                  href={process.env.NEXT_PUBLIC_DISCORD_BOT_INVITE_URL || 'https://discord.com/oauth2/authorize?client_id=1564681762754396180&permissions=268435456&integration_type=0&scope=bot'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-lg bg-[#5865F2] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4752c4]"
                >
                  <span>Connect Discord</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Collapsible 3-step setup guide */}
              <div className="mb-4 rounded-lg border border-indigo-100 bg-white/80 p-3">
                <button
                  type="button"
                  onClick={() => setShowDiscordGuide(!showDiscordGuide)}
                  className="flex w-full items-center justify-between text-xs font-medium text-indigo-700 hover:text-indigo-900"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle size={14} />
                    How to setup Discord perks in 3 steps?
                  </span>
                  {showDiscordGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showDiscordGuide && (
                  <div className="mt-3 space-y-2 border-t border-indigo-50 pt-2.5 text-xs text-slate-600">
                    <p className="flex items-start gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">1</span>
                      <span>Click <strong>&quot;Add Bot to Discord&quot;</strong> and authorize Earnesy Bot into your server.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">2</span>
                      <span>In Discord <strong>Server Settings &rarr; Roles</strong>, drag <strong>Earnesy Bot</strong> <em>above</em> your VIP Supporter role.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">3</span>
                      <span>In Discord Settings &rarr; Advanced, turn on <strong>Developer Mode</strong>. Then right-click your server to copy <strong>Server ID</strong>, and right-click your VIP role to copy <strong>Role ID</strong>.</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Discord Server (Guild) ID
                  </label>
                  <input
                    type="text"
                    name="discordServerId"
                    value={formData.discordServerId}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Supporter Role ID
                  </label>
                  <input
                    type="text"
                    name="discordRoleId"
                    value={formData.discordRoleId}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Discord Server Invite Link (Optional)
                  </label>
                  <input
                    type="url"
                    name="discordInviteUrl"
                    value={formData.discordInviteUrl}
                    onChange={handleInputChange}
                    placeholder="https://discord.gg/your-server"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Your Personal Discord ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="discordUserId"
                    value={formData.discordUserId}
                    onChange={handleInputChange}
                    placeholder="Your Discord User ID"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-indigo-100 pt-3">
                <button
                  type="button"
                  onClick={handleTestDiscord}
                  disabled={testingDiscord || !formData.discordServerId || !formData.discordRoleId}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>{testingDiscord ? 'Testing...' : '⚡ Test Connection'}</span>
                </button>

                {discordTestResult && (
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${discordTestResult.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {discordTestResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    <span>{discordTestResult.message}</span>
                  </div>
                )}
              </div>
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
                className={`rounded-md border px-3 py-2 text-sm ${message.includes('Error') || message.includes('error')
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
              className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-medium uppercase tracking-[0.14em] text-white transition-all hover:bg-amber-300 disabled:opacity-60"
            >
              {loading || uploading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-6">
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
                    <p className="mt-1 text-sm text-slate-700">{userEmail || 'you@example.com'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Support</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {formData.razorpayId ? 'Razorpay connected' : 'Connect payment details'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Discord</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {formData.discordServerId && formData.discordRoleId ? 'VIP Perks Active' : 'Not connected'}
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