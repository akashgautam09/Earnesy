// This API endpoint saves user profile data to the database

import User from '@/models/User'
import Payment from '@/models/Payment'
import { getCurrentUser } from '@/lib/auth/server'
import { getCreatorStats } from '@/lib/data/creator'
import cloudinary, { getCloudinaryPublicId } from '@/lib/cloudinary'

export async function GET(req) {
  try {
    // The session ID identifies the owner; email and username can change.
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return Response.json(
        { error: 'Unauthorized: Please login first' },
        { status: 401 }
      )
    }

    const user = currentUser

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const stats = await getCreatorStats(user)

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
        title: user.title || '',
        bio: user.bio || '',
        profileUrl: user.profileUrl,
        coverUrl: user.coverUrl,
        razorpayId,
        hasRazorpayCredentials,
        stats,
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
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return Response.json(
        { error: 'Unauthorized: Please login first' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await req.json()
    const {
      name,
      username,
      title,
      bio,
      razorpayId,
      razorpaySecret,
      disconnectRazorpay,
      profileUrl,
      coverUrl,
    } = body

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
      title: typeof title === 'string' ? title.trim().slice(0, 120) : '',
      bio: typeof bio === 'string' ? bio.trim().slice(0, 1000) : '',
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

    const oldImageIds = [
      profileUrl !== currentUser.profileUrl
        ? getCloudinaryPublicId(currentUser.profileUrl)
        : null,
      coverUrl !== currentUser.coverUrl
        ? getCloudinaryPublicId(currentUser.coverUrl)
        : null,
    ].filter(Boolean)

    await Promise.all(
      oldImageIds.map((publicId) => cloudinary.uploader.destroy(publicId))
    )

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        title: updatedUser.title || '',
        bio: updatedUser.bio || '',
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
