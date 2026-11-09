import mongoose from 'mongoose'
import User from '@/models/User'
import Payment from '@/models/Payment'
import PayoutRequest from '@/models/PayoutRequest'
import { requireAdmin } from '@/lib/auth/admin'

const ensureDb = async () => {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured')
    await mongoose.connect(process.env.MONGODB_URI)
  }
}

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status })
    }

    await ensureDb()

    const [
      totalCreators,
      totalPayments,
      paymentAggregation,
      pendingPayouts,
      completedPayouts,
      recentPayments,
      topCreators,
    ] = await Promise.all([
      // Total creators (users who have set up their page or received at least one payment)
      User.countDocuments({}),

      // Total successful payments
      Payment.countDocuments({ done: true }),

      // Revenue aggregation
      Payment.aggregate([
        { $match: { done: true } },
        {
          $group: {
            _id: null,
            totalGross: { $sum: '$amount' },
            totalPlatformFees: { $sum: '$platformFee' },
            totalCreatorPayouts: { $sum: '$creatorAmount' },
          },
        },
      ]),

      // Pending payout requests count + total amount
      PayoutRequest.aggregate([
        { $match: { status: 'pending' } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),

      // Completed payouts total
      PayoutRequest.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),

      // Recent 10 payments for activity feed
      Payment.find({ done: true })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('from_user to_user amount platformFee createdAt tier_title')
        .lean(),

      // Top 5 creators by gross earnings
      Payment.aggregate([
        { $match: { done: true } },
        {
          $group: {
            _id: '$to_user',
            grossEarnings: { $sum: '$amount' },
            paymentCount: { $sum: 1 },
          },
        },
        { $sort: { grossEarnings: -1 } },
        { $limit: 5 },
      ]),
    ])

    const agg = paymentAggregation[0] || { totalGross: 0, totalPlatformFees: 0, totalCreatorPayouts: 0 }
    const pendingAgg = pendingPayouts[0] || { count: 0, totalAmount: 0 }
    const completedAgg = completedPayouts[0] || { count: 0, totalAmount: 0 }

    return Response.json({
      success: true,
      stats: {
        totalCreators,
        totalPayments,
        totalGrossRevenue: agg.totalGross,
        totalPlatformRevenue: agg.totalPlatformFees,
        totalCreatorPayouts: agg.totalCreatorPayouts,
        pendingPayoutRequests: pendingAgg.count,
        pendingPayoutAmount: pendingAgg.totalAmount,
        completedPayoutRequests: completedAgg.count,
        completedPayoutAmount: completedAgg.totalAmount,
      },
      recentPayments: recentPayments.map((p) => ({
        id: p._id.toString(),
        from: p.from_user,
        to: p.to_user,
        amount: p.amount,
        platformFee: p.platformFee || Math.round((p.amount || 0) * 0.02),
        tierTitle: p.tier_title || null,
        createdAt: p.createdAt,
      })),
      topCreators: topCreators.map((c) => ({
        username: c._id,
        grossEarnings: c.grossEarnings,
        paymentCount: c.paymentCount,
      })),
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return Response.json({ error: 'Failed to load admin stats' }, { status: 500 })
  }
}
