import mongoose from 'mongoose'
import Post from '@/models/Post'
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
    return Response.json({
      success: true,
      posts: posts.map((post) => ({
        id: post._id.toString(),
        title: post.title,
        content: post.content,
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

    if (!title || !content) {
      return Response.json({ error: 'Title and content are required' }, { status: 400 })
    }

    if (title.length > 120 || content.length > 5000) {
      return Response.json({ error: 'Title or content is too long' }, { status: 400 })
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI)
    }

    const post = await Post.create({ authorId: user._id, title, content })
    return Response.json({
      success: true,
      post: {
        id: post._id.toString(),
        title: post.title,
        content: post.content,
        status: post.status,
        createdAt: post.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Post creation error:', error)
    return Response.json({ error: 'Failed to create post' }, { status: 500 })
  }
}