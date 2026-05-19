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
  const [profileMethod, setProfileMethod] = useState('upload')
  const [coverMethod, setCoverMethod] = useState('upload')
  const [profileUrl, setProfileUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Load user data on mount
  useEffect(() => {
    if (session?.user?.email) {
      loadUserData()
    }
  }, [session])

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
      })
      if (response.ok) {
        const data = await response.json()
        setFormData({
          name: data.user?.name || '',
          email: data.user?.email || session.user.email,
          username: data.user?.username || '',
          razorpayId: data.user?.razorpayId || '',
          razorpaySecret: data.user?.razorpaySecret || '',
        })
        if (data.user?.profileUrl) {
          setProfilePic(data.user.profileUrl)
          setProfileUrl(data.user.profileUrl)
          setProfileMethod('url')
        }
        if (data.user?.coverUrl) {
          setCoverPic(data.user.coverUrl)
          setCoverUrl(data.user.coverUrl)
          setCoverMethod('url')
        }
      }
    } catch (error) {
      console.log('Could not load user data')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
        throw new Error('Upload failed')
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
    
    if (!formData.name || !formData.username) {
      setMessage('Name and username are required')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setLoading(true)
    setMessage('')

    try {
      let finalProfileUrl = profileUrl
      let finalCoverUrl = coverUrl

      // Upload profile picture if selected from file
      if (profileMethod === 'upload' && profilePic && !profileUrl) {
        // Convert data URL to file for upload
        const file = await fetch(profilePic)
          .then(res => res.blob())
          .then(blob => new File([blob], 'profile.jpg', { type: 'image/jpeg' }))
        
        const uploadedUrl = await uploadToCloudinary(file, 'profile')
        if (!uploadedUrl) {
          setLoading(false)
          return
        }
        finalProfileUrl = uploadedUrl
      } else if (profileMethod === 'url') {
        finalProfileUrl = profileUrl
      }

      // Upload cover picture if selected from file
      if (coverMethod === 'upload' && coverPic && !coverUrl) {
        const file = await fetch(coverPic)
          .then(res => res.blob())
          .then(blob => new File([blob], 'cover.jpg', { type: 'image/jpeg' }))
        
        const uploadedUrl = await uploadToCloudinary(file, 'cover')
        if (!uploadedUrl) {
          setLoading(false)
          return
        }
        finalCoverUrl = uploadedUrl
      } else if (coverMethod === 'url') {
        finalCoverUrl = coverUrl
      }

      // Save to database
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: session.user.email,
          username: formData.username,
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

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  // Don't render if not authenticated
  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-200 p-4 md:p-4">
      <div className="max-w-2xl mx-auto">

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          
          {/* Cover Picture */}
          <div className="border-b pb-4">
            <div className="flex gap-2 mb-2">
              <label className="text-xs font-medium text-gray-600">Cover Picture</label>
              <div className="flex gap-1">
                {['upload', 'url'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setCoverMethod(method)}
                    className={`px-2 py-1 text-xs rounded ${
                      coverMethod === method
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {method === 'upload' ? 'Upload' : 'URL'}
                  </button>
                ))}
              </div>
            </div>
            {coverMethod === 'upload' ? (
              <label className="block relative h-28 bg-gray-100 rounded border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                {coverPic ? (
                  <img src={coverPic} alt="Cover" className="w-full h-full object-cover rounded" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    Click to upload cover
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverPicChange}
                  className="hidden"
                  disabled={uploading}
                />
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
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Profile Picture */}
          <div className="border-b pb-4">
            <div className="flex gap-2 mb-2">
              <label className="text-xs font-medium text-gray-600">Profile Picture</label>
              <div className="flex gap-1">
                {['upload', 'url'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setProfileMethod(method)}
                    className={`px-2 py-1 text-xs rounded ${
                      profileMethod === method
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {method === 'upload' ? 'Upload' : 'URL'}
                  </button>
                ))}
              </div>
            </div>
            {profileMethod === 'upload' ? (
              <div className="flex gap-3">
                <label className="h-20 w-20 rounded-full bg-gray-100 border-2 border-gray-300 overflow-hidden cursor-pointer hover:bg-gray-50 flex-shrink-0 flex items-center justify-center">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-xs text-center px-1">Photo</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
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
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Name, Email, Username */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b pb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your name"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={session?.user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 text-black"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="your_username"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Razorpay Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b pb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Razorpay ID</label>
              <input
                type="text"
                name="razorpayId"
                value={formData.razorpayId}
                onChange={handleInputChange}
                placeholder="Your Razorpay ID"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Razorpay Secret</label>
              <input
                type="password"
                name="razorpaySecret"
                value={formData.razorpaySecret}
                onChange={handleInputChange}
                placeholder="Your Razorpay Secret"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`px-3 py-2 rounded text-sm border ${
              message.includes('Error') || message.includes('error')
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded text-sm transition"
          >
            {loading || uploading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}