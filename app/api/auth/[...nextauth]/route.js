import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import mongoose from 'mongoose'
import User from '@/models/User'
import { ensureLocalUser, normalizeEmail } from '@/lib/auth/local-user'
const googleClientId = process.env.GOOGLE_ID || process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET
const githubClientId = process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID
const githubClientSecret = process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET

const connectToDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured')
  }

  if (mongoose.connection.readyState === 1) {
    return
  }

  await mongoose.connect(process.env.MONGODB_URI)
}

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret
    }),
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      await connectToDatabase()
      return Boolean(await ensureLocalUser({ user, account, profile }))
    },
    async jwt({ token }) {
      if (token.userId) {
        await connectToDatabase()
        const user = await User.findById(token.userId).select('_id username email').lean()
        if (user) {
          token.username = user.username
          token.email = user.email
        }
      } else if (token.email) {
        await connectToDatabase()
        // Store the local database ID in the token for secure ownership checks.
        const user = await User.findOne({ email: normalizeEmail(token.email) }).select('_id username email').lean()
        if (user) {
          token.userId = user._id.toString()
          token.username = user.username
          token.email = user.email
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId
        session.user.username = token.username
      }
      return session
    }
  },
  session: { strategy: 'jwt' }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }