import mongoose from 'mongoose'
import Post from '@/models/Post'
import Like from '@/models/Like'
import User from '@/models/User'
import Payment from '@/models/Payment'
import { getCurrentUser } from '@/lib/auth/server'
import cloudinary, { getCloudinaryPublicId } from '@/lib/cloudinary'

export async function GET(req, { params }) {
  try {
    const { id: postId } = await params
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return Response.json({ error: 'Invalid post ID' }, { status: 400 })
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI)
    }

    // Run auth check and post retrieval in parallel
    const [currentUser, post] = await Promise.all([
      getCurrentUser(),
      Post.findById(postId).populate('authorId', 'name username profileUrl').lean(),
    ])

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    const isAuthor = currentUser && post.authorId?._id?.toString() === currentUser._id?.toString()
    let isLiked = false
    let isMember = false

    if (currentUser) {
      const [likeExists, memberPayment] = await Promise.all([
        Like.exists({ postId, userId: currentUser._id }),
        Payment.exists({
          creator_id: post.authorId?._id,
          done: true,
          $or: [
            { supporter_id: currentUser._id },
            { from_user: currentUser.name },
            { from_user: currentUser.username }
          ]
        })
      ])
      isLiked = Boolean(likeExists)
      isMember = Boolean(memberPayment)
    }

    const isMembersOnly = post.visibility === 'members'
    const hasAccess = !isMembersOnly || isAuthor || isMember

    return Response.json({
      success: true,
      post: {
        id: post._id.toString(),
        title: post.title,
        content: hasAccess ? post.content : (post.content ? post.content.slice(0, 100) + '...' : ''),
        imageUrl: hasAccess ? (post.imageUrl || null) : null,
        likesCount: post.likesCount || 0,
        isLiked,
        isAuthor,
        status: post.status,
        visibility: post.visibility || 'public',
        isLocked: !hasAccess,
        createdAt: post.createdAt,
        author: {
          name: post.authorId?.name || 'Creator',
          username: post.authorId?.username || '',
          profileUrl: post.authorId?.profileUrl || '',
        },
      },
    })
  } catch (error) {
    console.error('Fetch single post error:', error)
    return Response.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    const { id: postId } = await params
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return Response.json({ error: 'Invalid post ID' }, { status: 400 })
    }

    const post = await Post.findById(postId)
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.authorId.toString() !== user._id.toString()) {
      return Response.json({ error: 'Forbidden: You can only delete your own posts' }, { status: 403 })
    }

    const imagePublicId = getCloudinaryPublicId(post.imageUrl)
    if (imagePublicId) {
      await cloudinary.uploader.destroy(imagePublicId)
    }

    // Run post and like deletions in parallel
    await Promise.all([
      Post.findByIdAndDelete(postId),
      Like.deleteMany({ postId }),
    ])

    return Response.json({ success: true, message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Post deletion error:', error)
    return Response.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
