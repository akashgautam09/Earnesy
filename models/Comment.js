import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true,
  },
  likesCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true })

// Production indexes for threaded comment queries
commentSchema.index({ postId: 1, createdAt: 1 })
commentSchema.index({ postId: 1, parentCommentId: 1 })

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.Comment
}

export default mongoose.models.Comment || mongoose.model('Comment', commentSchema)
