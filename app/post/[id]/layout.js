import mongoose from 'mongoose'
import Post from '@/models/Post'
import User from '@/models/User'

export async function generateMetadata({ params }) {
  try {
    const { id } = await params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return { title: 'Post | Earnesy' }
    }

    if (mongoose.connection.readyState !== 1 && process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI)
    }

    const post = await Post.findById(id).populate('authorId', 'name username profileUrl').lean()
    if (!post) {
      return { title: 'Post Not Found | Earnesy' }
    }

    const authorName = post.authorId?.name || 'Creator'
    const title = `${post.title} | ${authorName}`
    const description = post.content
      ? post.content.slice(0, 160).trim() + '...'
      : `Check out this update by ${authorName} on Earnesy.`
    const images = post.imageUrl ? [{ url: post.imageUrl, alt: post.title }] : []

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images,
        type: 'article',
      },
      twitter: {
        card: post.imageUrl ? 'summary_large_image' : 'summary',
        title,
        description,
        images: post.imageUrl ? [post.imageUrl] : [],
      },
    }
  } catch (error) {
    return { title: 'Post | Earnesy' }
  }
}

export default function PostDetailLayout({ children }) {
  return children
}
