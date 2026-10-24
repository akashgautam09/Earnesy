import mongoose from 'mongoose'
import Like from '@/models/Like'
import Post from '@/models/Post'
import { getCurrentUser } from '@/lib/auth/server'

export async function POST(req, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    const { id: postId } = await params

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return Response.json({ error: 'Invalid post ID' }, { status: 400 })
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI)
    }

    const post = await Post.findById(postId)
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if the user has already liked this post
    const existingLike = await Like.findOne({ postId, userId: user._id })

    if (existingLike) {
      // Unlike: Delete like record and decrement post likesCount
      await Like.deleteOne({ _id: existingLike._id })
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $inc: { likesCount: -1 } },
        { new: true }
      )

      return Response.json({
        success: true,
        isLiked: false,
        likesCount: Math.max(0, updatedPost?.likesCount ?? 0),
      })
    } else {
      // Like: Create like record and increment post likesCount
      await Like.create({ postId, userId: user._id })
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $inc: { likesCount: 1 } },
        { new: true }
      )

      return Response.json({
        success: true,
        isLiked: true,
        likesCount: updatedPost?.likesCount ?? 1,
      })
    }
  } catch (error) {
    console.error('Like toggle error:', error)
    return Response.json({ error: 'Failed to update like status' }, { status: 500 })
  }
}
