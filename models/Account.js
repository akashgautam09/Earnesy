import mongoose from 'mongoose'

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: String,
    required: true,
  },
  providerAccountId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
}, { timestamps: true })

accountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true })

export default mongoose.models.Account || mongoose.model('Account', accountSchema)