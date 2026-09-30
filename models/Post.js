import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published',
  },
}, { timestamps: true })

export default mongoose.models.Post || mongoose.model('Post', postSchema)