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
    trim: true,
    default: '',
    maxlength: 5000,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  likesCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published',
  },
  visibility: {
    type: String,
    enum: ['public', 'members'],
    default: 'public',
  },
}, { timestamps: true })

// In development, clear cached model so schema updates take effect without server restart
if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.Post
}

export default mongoose.models.Post || mongoose.model('Post', postSchema)
