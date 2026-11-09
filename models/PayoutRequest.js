import mongoose from 'mongoose'

const payoutRequestSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true, // in paise
      min: 100, // at least ₹1 (dynamic minimum limit enforced at API layer)
    },
    payoutMethod: {
      type: String,
      enum: ['upi', 'bank'],
      default: 'upi',
    },
    payoutDetails: {
      upiId: { type: String, default: '' },
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifsc: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    referenceId: {
      type: String,
      default: '', // UTR / Transaction ID from UPI or Bank transfer
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

payoutRequestSchema.index({ creatorId: 1, createdAt: -1 })
payoutRequestSchema.index({ status: 1, createdAt: -1 })

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.PayoutRequest
}

export default mongoose.models.PayoutRequest || mongoose.model('PayoutRequest', payoutRequestSchema)
