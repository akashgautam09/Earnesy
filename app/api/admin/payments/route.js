import mongoose from 'mongoose'
import Payment from '@/models/Payment'
import { requireAdmin } from '@/lib/auth/admin'

const ensureDb = async () => {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured')
    await mongoose.connect(process.env.MONGODB_URI)
  }
}

export async function GET(request) {
  try {
    const auth = await requireAdmin()
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status })
    }

    await ensureDb()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim() || ''
    const type = searchParams.get('type')?.trim() || 'all' // 'all' | 'coffee' | 'tier'
    const status = searchParams.get('status')?.trim() || 'done' // 'done' | 'all' | 'pending'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    // Build filter using $and so query, type, and status never overwrite each other
    const andClauses = []

    if (status === 'done') {
      andClauses.push({ done: true })
    } else if (status === 'pending') {
      andClauses.push({ done: false })
    }

    if (type === 'tier') {
      andClauses.push({
        $or: [
          { tier_id: { $exists: true, $ne: null } },
          { tier_title: { $exists: true, $nin: ['', null] } },
        ],
      })
    } else if (type === 'coffee') {
      andClauses.push({
        tier_id: null,
        tier_title: { $in: ['', null] },
      })
    }

    if (query) {
      andClauses.push({
        $or: [
          { order_id: { $regex: query, $options: 'i' } },
          { payment_id: { $regex: query, $options: 'i' } },
          { to_user: { $regex: query, $options: 'i' } },
          { from_user: { $regex: query, $options: 'i' } },
        ],
      })
    }

    const filter = andClauses.length > 0 ? { $and: andClauses } : {}

    const [total, payments] = await Promise.all([
      Payment.countDocuments(filter),
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ])

    return Response.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      payments: payments.map((p) => {
        const fee = p.platformFee || Math.round((p.amount || 0) * 0.02)
        const net = p.creatorAmount || ((p.amount || 0) - fee)
        return {
          id: p._id.toString(),
          orderId: p.order_id,
          paymentId: p.payment_id || '',
          fromUser: p.from_user,
          toUser: p.to_user,
          amount: p.amount,
          platformFee: fee,
          creatorAmount: net,
          feePercentage: p.feePercentage || 2,
          done: Boolean(p.done),
          isTier: Boolean(p.tier_id || p.tier_title),
          tierTitle: p.tier_title || '',
          discordRoleAssigned: Boolean(p.discordRoleAssigned),
          supporterDiscordId: p.supporter_discord_id || '',
          createdAt: p.createdAt,
        }
      }),
    })
  } catch (error) {
    console.error('Admin payments GET error:', error)
    return Response.json({ error: 'Failed to load transaction ledger' }, { status: 500 })
  }
}
