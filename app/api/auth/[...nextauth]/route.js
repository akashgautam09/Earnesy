import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import mongoose from 'mongoose'
import User from '@/models/User'
import Account from '@/models/Account'

const normalizeEmail = (email) => email?.trim().toLowerCase()
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

// OAuth providers do not give us an application username, so create one once.
const createUsername = async (email) => {
  const base = normalizeEmail(email)
    .split('@')[0]
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 24) || 'user'

  let username = base
  let suffix = 1

  while (await User.exists({ username })) {
    username = `${base.slice(0, 24 - String(suffix).length - 1)}-${suffix}`
    suffix += 1
  }

  return username
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
  callbacks: {
    async signIn({ user, account }) {
      const email = normalizeEmail(user?.email)

      // The application requires an email and a provider account ID.
      if (!account?.provider || !account.providerAccountId || !email) {
        return false
      }

      await connectToDatabase()

      // check Has this Google/GitHub account Already been linked?
      const linkedAccount = await Account.findOne({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      })

      let currentUser = linkedAccount ? await User.findById(linkedAccount.userId)
        : await User.findOne({ email })

      if (linkedAccount && currentUser && currentUser.email !== email) {
        return false
      }

      if (!currentUser) {
        // One email maps to one local profile, even when several providers are used.
        currentUser = await User.create({
          name: user.name || '',
          username: await createUsername(email),
          email,
        })
      }

      await Account.findOneAndUpdate(
        { provider: account.provider, providerAccountId: account.providerAccountId },
        {
          userId: currentUser._id,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          type: account.type,
        },
        { upsert: true, setDefaultsOnInsert: true }
      )

      return true
    },
    async jwt({ token }) {
      if (token.email) {
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