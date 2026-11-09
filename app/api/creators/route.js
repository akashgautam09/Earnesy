import mongoose from 'mongoose'
import User from '@/models/User'
import Tier from '@/models/Tier'
import Payment from '@/models/Payment'

const ensureDb = async () => {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured')
    }
    await mongoose.connect(process.env.MONGODB_URI)
  }
}

export async function GET(request) {
  try {
    await ensureDb()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim().toLowerCase() || ''
    const category = searchParams.get('category')?.trim() || ''

    const filter = {
      username: { $exists: true, $ne: '' },
    }

    if (category && category !== 'All') {
      filter.category = category
    }

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
      ]
    }

    // Fetch creators
    const users = await User.find(filter)
      .select('_id name username title bio category profileUrl coverUrl createdAt razorpayId razorpaySecret discordServerId')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean()

    const userIds = users.map((u) => u._id)

    // Aggregate active tiers count per creator
    const tiers = await Tier.find({
      creatorId: { $in: userIds },
      isActive: true,
    })
      .select('creatorId price title')
      .lean()

    const tiersMap = new Map()
    for (const t of tiers) {
      const cId = t.creatorId.toString()
      if (!tiersMap.has(cId)) tiersMap.set(cId, [])
      tiersMap.get(cId).push(t)
    }

    // Aggregate supporter counts per creator
    const supporterCounts = await Payment.aggregate([
      { $match: { creator_id: { $in: userIds }, done: true } },
      { $group: { _id: '$creator_id', count: { $sum: 1 } } },
    ])

    const supporterMap = new Map(
      supporterCounts.map((s) => [s._id.toString(), s.count])
    )

    const formatted = users.map((u) => {
      const uId = u._id.toString()
      const userTiers = tiersMap.get(uId) || []
      const minPrice = userTiers.length > 0 ? Math.min(...userTiers.map((t) => t.price)) : 0

      return {
        id: uId,
        name: u.name || u.username,
        username: u.username,
        title: u.title || '',
        category: u.category || '',
        bio: u.bio || '',
        profileUrl: u.profileUrl || null,
        coverUrl: u.coverUrl || null,
        tiersCount: userTiers.length,
        minTierPrice: minPrice,
        supportersCount: supporterMap.get(uId) || 0,
        hasDiscord: Boolean(u.discordServerId),
        paymentsEnabled: Boolean(u.razorpayId && u.razorpaySecret),
      }
    })

    return Response.json({
      success: true,
      creators: formatted,
      totalCount: formatted.length,
    })
  } catch (error) {
    console.error('Creators explore GET error:', error)
    return Response.json({ error: error.message || 'Failed to fetch creators' }, { status: 500 })
  }
}
