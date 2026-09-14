// This API endpoint saves user profile data to the database

import mongoose from 'mongoose'
import User from '@/models/User'
import Payment from '@/models/Payment'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { v2 as cloudinary } from 'cloudinary'

const getCloudinaryPublicId = (url) => {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return null
  }

  try {
    const parsedUrl = new URL(url)
    const uploadMarker = '/upload/'
    const uploadIndex = parsedUrl.pathname.indexOf(uploadMarker)

    if (uploadIndex === -1) {
      return null
    }

    let publicPath = parsedUrl.pathname.slice(uploadIndex + uploadMarker.length)

    if (publicPath.startsWith('v')) {
      const versionSeparator = publicPath.indexOf('/')
      if (versionSeparator === -1) {
        return null
      }
      publicPath = publicPath.slice(versionSeparator + 1)
    }

    const extensionIndex = publicPath.lastIndexOf('.')
    if (extensionIndex === -1) {
      return null
    }

    return decodeURIComponent(publicPath.slice(0, extensionIndex))
  } catch {
    return null
  }
}

export async function GET(req) {
  try {
    // The session ID identifies the owner; email and username can change.
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session || !session.user) {
      return Response.json(
        { error: 'Unauthorized: Please login first' },
        { status: 401 }
      )
    }

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI)

    const user = await User.findById(session.user.id)

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return the public key and a status only. Never return the secret.
    let razorpayId = ''
    let hasRazorpayCredentials = false

    try {
      razorpayId = user.razorpayId || ''
      hasRazorpayCredentials = Boolean(razorpayId && user.razorpaySecret)
    } catch {
      razorpayId = ''
      hasRazorpayCredentials = false
    }

    return Response.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        username: user.username,
        profileUrl: user.profileUrl,
        coverUrl: user.coverUrl,
        razorpayId,
        hasRazorpayCredentials,
      },
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session || !session.user) {
      return Response.json(
        { error: 'Unauthorized: Please login first' },
        { status: 401 }
      )
    }

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI)

    // Get request body
    const body = await req.json()
    const {
      name,
      username,
      razorpayId,
      razorpaySecret,
      disconnectRazorpay,
      profileUrl,
      coverUrl,
    } = body

    const currentUser = await User.findById(session.user.id)

    if (!currentUser) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (profileUrl && currentUser.profileUrl && profileUrl !== currentUser.profileUrl) {
      const previousProfileId = getCloudinaryPublicId(currentUser.profileUrl)
      if (previousProfileId) {
        await cloudinary.uploader.destroy(previousProfileId)
      }
    }

    if (coverUrl && currentUser.coverUrl && coverUrl !== currentUser.coverUrl) {
      const previousCoverId = getCloudinaryPublicId(currentUser.coverUrl)
      if (previousCoverId) {
        await cloudinary.uploader.destroy(previousCoverId)
      }
    }

    const normalizedName = typeof name === 'string' ? name.trim() : ''
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''

    if (!normalizedName || !normalizedUsername) {
      return Response.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    if (!/^[a-z0-9_-]{3,30}$/.test(normalizedUsername)) {
      return Response.json(
        { error: 'Username must be 3-30 characters and use only letters, numbers, hyphens, or underscores' },
        { status: 400 }
      )
    }

    // Check availability before MongoDB's unique index provides the final safeguard.
    const usernameOwner = await User.findOne({
      username: normalizedUsername,
      _id: { $ne: currentUser._id },
    }).select('_id').lean()

    if (usernameOwner) {
      return Response.json(
        { error: 'This username is already taken' },
        { status: 409 }
      )
    }

    const updateData = {
      name: normalizedName,
      username: normalizedUsername,
      profileUrl: profileUrl || undefined,
      coverUrl: coverUrl || undefined,
      updatedAt: new Date(),
    }

    if (!disconnectRazorpay && razorpayId) {
      updateData.razorpayId = razorpayId.trim()
    }

    // The secret is write-only: save a replacement, but never read it back.
    if (!disconnectRazorpay && razorpaySecret) {
      updateData.razorpaySecret = razorpaySecret.trim()
    }

    // Unsetting both values immediately disables payments for this user.
    if (disconnectRazorpay) {
      updateData.$unset = {
        razorpayId: 1,
        razorpaySecret: 1,
      }
    }

    // Update to_user in payment when username is updated
    if (normalizedUsername !== currentUser.username) {
      await Payment.updateMany(
        { to_user: currentUser.username },
        { to_user: normalizedUsername }
      )
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: currentUser._id },
      updateData,
      { returnDocument: 'after', runValidators: true }
    )

    if (!updatedUser) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        profileUrl: updatedUser.profileUrl,
        coverUrl: updatedUser.coverUrl,
      },
    })
  } catch (error) {
    if (error?.code === 11000) {
      return Response.json(
        { error: 'This username is already taken' },
        { status: 409 }
      )
    }

    console.error('Profile update error:', error)
    return Response.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
