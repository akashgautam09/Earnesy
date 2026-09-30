import mongoose from 'mongoose'
import Payment from '@/models/Payment'
import { getCurrentUser } from '@/lib/auth/server'
import { getCreatorStats } from '@/lib/data/creator'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI)
    }

    const [payments, stats] = await Promise.all([
      Payment.find({ to_user: user.username, done: true })
        .sort({ createdAt: -1 })
        .lean(),
      getCreatorStats(user),
    ])

    return Response.json({
      success: true,
      stats,
      payments: payments.map((payment) => ({
        id: payment._id.toString(),
        from: payment.from_user,
        amount: payment.amount,
        paymentId: payment.payment_id,
        orderId: payment.order_id,
        createdAt: payment.createdAt,
      })),
    })
  } catch (error) {
    console.error('Payouts fetch error:', error)
    return Response.json({ error: 'Failed to load payout history' }, { status: 500 })
  }
}