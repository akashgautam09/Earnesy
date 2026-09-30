import { auth, currentUser as getClerkUser } from '@clerk/nextjs/server'
import mongoose from 'mongoose'
import { ensureClerkUser } from '@/lib/auth/local-user'

const connectToDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured')
  }

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI)
  }
}

// This is the application auth boundary. Clerk authenticates the request;
// application ownership is always resolved through the local User document.
export const getCurrentUser = async () => {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  await connectToDatabase()
  const clerkUser = await getClerkUser()
  return ensureClerkUser({ clerkUserId: userId, clerkUser })
}

