import mongoose from 'mongoose'
import User from '@/models/User'
import Payment from '@/models/Payment'
import Tier from '@/models/Tier'
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
    const category = searchParams.get('category')?.trim() || ''
    const gatewayFilter = searchParams.get('gateway')?.trim() || 'all' // 'all' | 'configured' | 'unconfigured' | 'payout_ready'
    const sort = searchParams.get('sort')?.trim() || 'newest' // 'newest' | 'oldest' | 'name'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)))

    // Build filter using $and so query, category, and gateway filter never overwrite each other
    const andClauses = []

    if (query) {
      andClauses.push({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      })
    }

    if (category && category !== 'all') {
      andClauses.push({ category })
    }

    if (gatewayFilter === 'configured') {
      andClauses.push({
        razorpayId: { $exists: true, $nin: ['', null] },
        razorpaySecret: { $exists: true, $nin: ['', null] },
      })
    } else if (gatewayFilter === 'unconfigured') {
      andClauses.push({
        $or: [
          { razorpayId: { $exists: false } },
          { razorpayId: null },
          { razorpayId: '' },
          { razorpaySecret: { $exists: false } },
          { razorpaySecret: null },
          { razorpaySecret: '' },
        ],
      })
    } else if (gatewayFilter === 'payout_ready') {
      andClauses.push({
        $or: [
          { payoutUpiId: { $exists: true, $nin: ['', null] } },
          { payoutAccountNumber: { $exists: true, $nin: ['', null] } },
        ],
      })
    }

    const filter = andClauses.length > 0 ? { $and: andClauses } : {}

    // Build sort
    let sortObj = { createdAt: -1 }
    if (sort === 'oldest') sortObj = { createdAt: 1 }
    if (sort === 'name') sortObj = { name: 1 }

    const [total, rawUsers] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          '_id name username email title category bio profileUrl coverUrl payoutMethod payoutUpiId payoutAccountName payoutAccountNumber payoutIfsc razorpayId razorpaySecret discordServerId discordRoleId status canAcceptTips customPlatformFee createdAt'
        )
        .lean(),
    ])

    const userIds = rawUsers.map((u) => u._id)
    const usernames = rawUsers.map((u) => u.username?.toLowerCase()).filter(Boolean)

    // Aggregate payments & earnings for these creators
    const [earningsAgg, tiersAgg] = await Promise.all([
      Payment.aggregate([
        {
          $match: {
            done: true,
            $or: [
              { creator_id: { $in: userIds } },
              { to_user: { $in: usernames } },
            ],
          },
        },
        {
          $group: {
            _id: { $ifNull: ['$creator_id', '$to_user'] },
            totalGross: { $sum: '$amount' },
            totalPlatformFee: { $sum: '$platformFee' },
            paymentCount: { $sum: 1 },
          },
        },
      ]),
      Tier.aggregate([
        { $match: { creatorId: { $in: userIds }, isActive: true } },
        {
          $group: {
            _id: '$creatorId',
            count: { $sum: 1 },
          },
        },
      ]),
    ])

    const earningsMap = new Map()
    for (const item of earningsAgg) {
      earningsMap.set(item._id.toString(), {
        gross: item.totalGross || 0,
        fee: item.totalPlatformFee || 0,
        count: item.paymentCount || 0,
      })
    }

    const tiersMap = new Map()
    for (const item of tiersAgg) {
      tiersMap.set(item._id.toString(), item.count || 0)
    }

    const creators = rawUsers.map((u) => {
      const uIdStr = u._id.toString()
      const uUsername = u.username?.toLowerCase() || ''
      const earnings = earningsMap.get(uIdStr) || earningsMap.get(uUsername) || { gross: 0, fee: 0, count: 0 }
      const tiersCount = tiersMap.get(uIdStr) || 0

      // Has independent payment gateway configured
      const hasGateway = Boolean(u.razorpayId && u.razorpaySecret)
      const hasPayoutSetup = Boolean(u.payoutUpiId?.trim() || u.payoutAccountNumber?.trim())

      return {
        id: uIdStr,
        name: u.name || u.username,
        username: u.username,
        email: u.email,
        title: u.title || '',
        category: u.category || '',
        bio: u.bio || '',
        profileUrl: u.profileUrl || null,
        coverUrl: u.coverUrl || null,
        hasGateway,
        hasPayoutSetup,
        payoutMethod: u.payoutMethod || 'upi',
        payoutUpiId: u.payoutUpiId || '',
        payoutAccountName: u.payoutAccountName || '',
        payoutAccountNumber: u.payoutAccountNumber || '',
        payoutIfsc: u.payoutIfsc || '',
        hasDiscord: Boolean(u.discordServerId && u.discordRoleId),
        status: u.status || 'active',
        canAcceptTips: u.canAcceptTips !== false,
        customPlatformFee: typeof u.customPlatformFee === 'number' ? u.customPlatformFee : null,
        grossEarnings: earnings.gross,
        platformFeeCollected: earnings.fee,
        paymentsCount: earnings.count,
        tiersCount,
        createdAt: u.createdAt,
      }
    })

    return Response.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      creators,
    })
  } catch (error) {
    console.error('Admin creators GET error:', error)
    return Response.json({ error: 'Failed to load creators directory' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin()
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status })
    }

    await ensureDb()

    const body = await request.json()
    const { creatorId, status, canAcceptTips, customPlatformFee } = body

    if (!creatorId || !mongoose.Types.ObjectId.isValid(creatorId)) {
      return Response.json({ error: 'Valid creator ID is required' }, { status: 400 })
    }

    const updates = {}

    if (status !== undefined) {
      if (!['active', 'suspended'].includes(status)) {
        return Response.json({ error: "Status must be 'active' or 'suspended'" }, { status: 400 })
      }
      updates.status = status
    }

    if (canAcceptTips !== undefined) {
      updates.canAcceptTips = Boolean(canAcceptTips)
    }

    if (customPlatformFee !== undefined) {
      if (customPlatformFee === null || customPlatformFee === '') {
        updates.customPlatformFee = null
      } else {
        const feeNum = Number(customPlatformFee)
        if (Number.isNaN(feeNum) || feeNum < 0 || feeNum > 100) {
          return Response.json({ error: 'Custom platform fee must be between 0 and 100%' }, { status: 400 })
        }
        updates.customPlatformFee = feeNum
      }
    }

    const updatedUser = await User.findByIdAndUpdate(creatorId, updates, { new: true })
      .select('_id name username email status canAcceptTips customPlatformFee')
      .lean()

    if (!updatedUser) {
      return Response.json({ error: 'Creator not found' }, { status: 404 })
    }

    return Response.json({
      success: true,
      message: `Updated settings for @${updatedUser.username}`,
      creator: {
        id: updatedUser._id.toString(),
        status: updatedUser.status || 'active',
        canAcceptTips: updatedUser.canAcceptTips !== false,
        customPlatformFee: typeof updatedUser.customPlatformFee === 'number' ? updatedUser.customPlatformFee : null,
      },
    })
  } catch (error) {
    console.error('Admin creator PATCH error:', error)
    return Response.json({ error: 'Failed to update creator settings' }, { status: 500 })
  }
}
