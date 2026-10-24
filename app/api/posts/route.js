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

    if (mongoose.connection.readyState !== 1) {
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
        content: post.content,
        imageUrl: post.imageUrl || null,
        likesCount: post.likesCount || 0,
        isLiked: userLikesSet.has(post._id.toString()),
        status: post.status,
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

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    const imageUrl = typeof body.imageUrl === 'string' && body.imageUrl.trim() ? body.imageUrl.trim() : null

    if (!title || !content) {
      return Response.json({ error: 'Title and content are required' }, { status: 400 })
    }

    if (title.length > 120 || content.length > 5000) {
      return Response.json({ error: 'Title or content is too long' }, { status: 400 })
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI)
    }

    const post = await Post.create({ authorId: user._id, title, content, imageUrl })
    return Response.json({
      success: true,
      post: {
        id: post._id.toString(),
        title: post.title,
        content: post.content,
        imageUrl: post.imageUrl || null,
        likesCount: 0,
        isLiked: false,
        status: post.status,
        createdAt: post.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Post creation error:', error)
    return Response.json({ error: 'Failed to create post' }, { status: 500 })
  }
}