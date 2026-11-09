import mongoose from 'mongoose'
import Payment from '@/models/Payment'
import PayoutRequest from '@/models/PayoutRequest'
import { getCurrentUser } from '@/lib/auth/server'
import { getCreatorStats } from '@/lib/data/creator'

const ensureDb = async () => {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured')
    }
    await mongoose.connect(process.env.MONGODB_URI)
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    await ensureDb()

    const [payments, stats, payoutRequests] = await Promise.all([
      Payment.find({
        $and: [
          { done: true },
          {
            $or: [
              { to_user: user.username?.trim().toLowerCase() },
              { creator_id: user._id },
            ],
          },
        ],
      })
        .sort({ createdAt: -1 })
        .lean(),
      getCreatorStats(user),
      PayoutRequest.find({ creatorId: user._id }).sort({ createdAt: -1 }).lean(),
    ])

    const totalPaidOut = payoutRequests
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + (r.amount || 0), 0)

    const totalPendingPayout = payoutRequests
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + (r.amount || 0), 0)

    const netEarnings = stats.netEarnings || 0
    const availableBalance = Math.max(0, netEarnings - totalPaidOut - totalPendingPayout)

    return Response.json({
      success: true,
      stats: {
        ...stats,
        totalPaidOut,
        totalPendingPayout,
        availableBalance,
      },
      payoutMethod: user.payoutMethod || 'upi',
      payoutUpiId: user.payoutUpiId || '',
      payoutAccountName: user.payoutAccountName || '',
      payoutAccountNumber: user.payoutAccountNumber || '',
      payoutIfsc: user.payoutIfsc || '',
      payoutRequests: payoutRequests.map((r) => ({
        id: r._id.toString(),
        amount: r.amount,
        status: r.status,
        payoutMethod: r.payoutMethod,
        payoutDetails: r.payoutDetails,
        referenceId: r.referenceId || '',
        createdAt: r.createdAt,
        processedAt: r.processedAt,
      })),
      payments: payments.map((payment) => {
        const fee = payment.platformFee || Math.round((payment.amount || 0) * 0.02)
        const net = payment.creatorAmount || ((payment.amount || 0) - fee)
        return {
          id: payment._id.toString(),
          from: payment.from_user,
          amount: payment.amount,
          platformFee: fee,
          creatorAmount: net,
          payoutStatus: payment.payoutStatus || 'unpaid',
          paymentId: payment.payment_id,
          orderId: payment.order_id,
          createdAt: payment.createdAt,
          isTier: Boolean(payment.tier_id || payment.tier_title),
          tierTitle: payment.tier_title || '',
          tierId: payment.tier_id ? payment.tier_id.toString() : null,
          discordRoleAssigned: Boolean(payment.discordRoleAssigned),
          supporterDiscordId: payment.supporter_discord_id || '',
        }
      }),
    })
  } catch (error) {
    console.error('Payouts fetch error:', error)
    return Response.json({ error: 'Failed to load payout history' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    await ensureDb()

    const body = await request.json().catch(() => ({}))
    const amountInPaise = Number(body.amount)

    if (!amountInPaise || !Number.isInteger(amountInPaise) || amountInPaise < 10000) {
      return Response.json({ error: 'Minimum payout amount is ₹100' }, { status: 400 })
    }

    // Verify creator has payout details configured
    const method = user.payoutMethod || 'upi'
    if (method === 'upi' && !user.payoutUpiId?.trim()) {
      return Response.json({ error: 'Please save your UPI ID in dashboard settings first' }, { status: 400 })
    }
    if (method === 'bank' && (!user.payoutAccountNumber?.trim() || !user.payoutIfsc?.trim())) {
      return Response.json({ error: 'Please save your bank account details in dashboard settings first' }, { status: 400 })
    }

    // Calculate available balance
    const [stats, payoutRequests] = await Promise.all([
      getCreatorStats(user),
      PayoutRequest.find({ creatorId: user._id }).lean(),
    ])

    const totalPaidOut = payoutRequests
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + (r.amount || 0), 0)

    const totalPendingPayout = payoutRequests
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + (r.amount || 0), 0)

    const availableBalance = Math.max(0, (stats.netEarnings || 0) - totalPaidOut - totalPendingPayout)

    if (amountInPaise > availableBalance) {
      return Response.json(
        { error: `Requested amount exceeds available balance of ₹${(availableBalance / 100).toFixed(2)}` },
        { status: 400 }
      )
    }

    const payoutRequest = await PayoutRequest.create({
      creatorId: user._id,
      username: user.username,
      amount: amountInPaise,
      payoutMethod: method,
      payoutDetails: {
        upiId: user.payoutUpiId || '',
        accountName: user.payoutAccountName || user.name || '',
        accountNumber: user.payoutAccountNumber || '',
        ifsc: user.payoutIfsc || '',
      },
      status: 'pending',
    })

    return Response.json({
      success: true,
      message: 'Payout request submitted successfully. Funds will be transferred to your account.',
      payoutRequest: {
        id: payoutRequest._id.toString(),
        amount: payoutRequest.amount,
        status: payoutRequest.status,
        createdAt: payoutRequest.createdAt,
      },
    })
  } catch (error) {
    console.error('Payout request error:', error)
    return Response.json({ error: error.message || 'Failed to submit payout request' }, { status: 500 })
  }
}
