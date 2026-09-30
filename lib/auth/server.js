import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import User from '@/models/User'

const connectToDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured')
  }

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI)
  }
}

// This is the application auth boundary. Providers only establish the session;
// application ownership is always resolved through the local User document.
export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  await connectToDatabase()
  return User.findById(userId)
}

export const requireCurrentUser = async () => {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }

  return user
}