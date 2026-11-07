import mongoose from 'mongoose'
import User from '@/models/User'
import Post from '@/models/Post'

export default async function sitemap() {
  const baseUrl = (process.env.NEXT_PUBLIC_URL || 'https://earnesy.vercel.app').replace(/\/$/, '')

  const staticRoutes = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  let creatorRoutes = []
  let postRoutes = []

  try {
    if (mongoose.connection.readyState !== 1 && process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI)
    }

    if (mongoose.connection.readyState === 1) {
      const creators = await User.find({})
        .select('username updatedAt createdAt')
        .limit(200)
        .lean()

      creatorRoutes = creators
        .filter((c) => Boolean(c.username))
        .map((c) => ({
          url: `${baseUrl}/${c.username}`,
          lastModified: c.updatedAt || c.createdAt || new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        }))

      const publicPosts = await Post.find({ status: 'published', visibility: 'public' })
        .select('_id updatedAt createdAt')
        .sort({ createdAt: -1 })
        .limit(300)
        .lean()

      postRoutes = publicPosts.map((p) => ({
        url: `${baseUrl}/post/${p._id.toString()}`,
        lastModified: p.updatedAt || p.createdAt || new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      }))
    }
  } catch (err) {
    console.error('Sitemap dynamic routes fetch fallback:', err)
  }

  return [...staticRoutes, ...creatorRoutes, ...postRoutes]
}
