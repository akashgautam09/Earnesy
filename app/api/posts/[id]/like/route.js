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

    // Fast index check instead of loading the entire document
    if (!await Post.exists({ _id: postId })) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    // Atomic toggle: delete if exists, otherwise create
    const removedLike = await Like.findOneAndDelete({ postId, userId: user._id })
    const isLiked = !removedLike

    if (isLiked) {
      await Like.create({ postId, userId: user._id })
    }

    const updated = await Post.findByIdAndUpdate(
      postId,
      { $inc: { likesCount: isLiked ? 1 : -1 } },
      { new: true, select: 'likesCount' }
    )

    return Response.json({
      success: true,
      isLiked,
      likesCount: Math.max(0, updated?.likesCount ?? 0),
    })
  } catch (error) {
    console.error('Like toggle error:', error)
    return Response.json({ error: 'Failed to update like status' }, { status: 500 })
  }
}
