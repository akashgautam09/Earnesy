import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['coffee', 'membership', 'comment', 'like'],
    required: true,
  },
  fromName: {
    type: String,
    required: true,
    default: 'Supporter',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  link: {
    type: String,
    default: '',
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
}, { timestamps: true })

// Production indexes for unread count and chronologically sorted user feeds
notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, isRead: 1 })

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.Notification
}

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
