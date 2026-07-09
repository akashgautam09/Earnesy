// This API endpoint saves user profile data to the database
// It checks the authenticated user's email for security

import mongoose from 'mongoose'
import User from '@/models/User'
import Payment from '@/models/Payment'
import { getServerSession } from 'next-auth'
import { authoptions } from '@/app/api/auth/[...nextauth]/route'
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
    // Get authenticated user session
    const session = await getServerSession(authoptions)

    // Check if user is authenticated
    if (!session || !session.user) {
      return Response.json(
        { error: 'Unauthorized: Please login first' },
        { status: 401 }
      )
    }

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI)

    // Find user by email
    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        username: user.username,
        profileUrl: user.profileUrl,
        coverUrl: user.coverUrl,
        razorpayId: user.razorpayId,
        razorpaySecret: user.razorpaySecret,
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
    // Get authenticated user session
    const session = await getServerSession(authoptions)

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
      email,
      username,
      razorpayId,
      razorpaySecret,
      profileUrl,
      coverUrl,
    } = body

    const currentUser = await User.findOne({ email: session.user.email })

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

    const updateData = {
      name: name || undefined,
      username: username || undefined,
      profileUrl: profileUrl || undefined,
      coverUrl: coverUrl || undefined,
      updatedAt: new Date(),
    }

    if (razorpayId) {
      updateData.razorpayId = razorpayId
    }

    if (razorpaySecret) {
      updateData.razorpaySecret = razorpaySecret
    }

    // Security check: verify email matches session user email
    if (email !== session.user.email) {
      return Response.json(
        { error: 'Email mismatch: Cannot update other users profile' },
        { status: 403 }
      )
    }

    // Update to_user in payment when username is updated
    if (username) {
      await Payment.updateMany(
        { to_user: currentUser.username },
        { to_user: username }
      )
    }

    // Find user by email and update
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
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
    console.error('Profile update error:', error)
    return Response.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
