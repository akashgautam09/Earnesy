import mongoose from 'mongoose'
import Post from '@/models/Post'
import Like from '@/models/Like'
import { getCurrentUser } from '@/lib/auth/server'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    if (mongoose.connection.readyState !== 1 && process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI)
    }

    const posts = await Post.find({ authorId: user._id }).sort({ createdAt: -1 }).lean()
    const postIds = posts.map((p) => p._id)

    const userLikes = await Like.find({ userId: user._id, postId: { $in: postIds } }).select('postId').lean()
    const userLikesSet = new Set(userLikes.map((l) => l.postId.toString()))

    return Response.json({
      success: true,
      posts: posts.map((post) => ({
        id: post._id.toString(),
        title: post.title,
        content: post.content || '',
        imageUrl: post.imageUrl || null,
        likesCount: post.likesCount || 0,
        isLiked: userLikesSet.has(post._id.toString()),
        status: post.status,
        visibility: post.visibility || 'public',
        createdAt: post.createdAt,
      })),
    })
  } catch (error) {
    console.error('Posts fetch error:', error)
    return Response.json({ error: 'Failed to load posts' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    if (mongoose.connection.readyState !== 1 && process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI)
    }

    const { title = '', content = '', imageUrl = null, visibility = 'public' } = await request.json()
    const cleanTitle = typeof title === 'string' ? title.trim() : ''
    const cleanContent = typeof content === 'string' ? content.trim() : ''
    const cleanImageUrl = typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null
    const cleanVisibility = visibility === 'members' ? 'members' : 'public'

    if (!cleanTitle) {
      return Response.json({ error: 'Post title is required' }, { status: 400 })
    }

    if (cleanTitle.length > 120) {
      return Response.json({ error: 'Title must be 120 characters or fewer' }, { status: 400 })
    }

    if (cleanContent.length > 5000) {
      return Response.json({ error: 'Content must be 5000 characters or fewer' }, { status: 400 })
    }

    const post = await Post.create({
      authorId: user._id,
      title: cleanTitle,
      content: cleanContent,
      imageUrl: cleanImageUrl,
      visibility: cleanVisibility,
    })

    return Response.json({
      success: true,
      post: {
        id: post._id.toString(),
        title: post.title,
        content: post.content || '',
        imageUrl: post.imageUrl || null,
        likesCount: 0,
        isLiked: false,
        status: post.status,
        visibility: post.visibility,
        createdAt: post.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Post creation error:', error)
    return Response.json(
      { error: error.message || 'Failed to create post' },
      { status: error.name === 'ValidationError' ? 400 : 500 }
    )
  }
}
