import mongoose from 'mongoose'
import Notification from '@/models/Notification'
import { getCurrentUser } from '@/lib/auth/server'

const ensureDb = async () => {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured')
    }
    await mongoose.connect(process.env.MONGODB_URI)
  }
}

// GET: Fetch recent notifications & unread count for current user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ notifications: [], unreadCount: 0 })
    }

    await ensureDb()

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Notification.countDocuments({ userId: user._id, isRead: false }),
    ])

    return Response.json({
      success: true,
      unreadCount,
      notifications: notifications.map((n) => ({
        id: n._id.toString(),
        type: n.type,
        fromName: n.fromName,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return Response.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// PUT: Mark notifications as read
export async function PUT(request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureDb()
    const body = await request.json().catch(() => ({}))
    const notificationId = body?.id

    if (notificationId && mongoose.Types.ObjectId.isValid(notificationId)) {
      await Notification.updateOne({ _id: notificationId, userId: user._id }, { isRead: true })
    } else {
      // Mark all as read
      await Notification.updateMany({ userId: user._id, isRead: false }, { isRead: true })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Notifications PUT error:', error)
    return Response.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
