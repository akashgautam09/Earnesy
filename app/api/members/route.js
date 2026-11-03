import mongoose from 'mongoose'
import Payment from '@/models/Payment'
import User from '@/models/User'
import Tier from '@/models/Tier'
import { getCurrentUser } from '@/lib/auth/server'

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
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    await ensureDb()

    // Find all completed membership tier payments for this creator
    const memberPayments = await Payment.find({
      $and: [
        { done: true },
        {
          $or: [
            { creator_id: user._id },
            { to_user: user.username?.trim().toLowerCase() },
          ],
        },
        {
          $or: [
            { tier_id: { $ne: null } },
            { tier_title: { $exists: true, $ne: '' } },
          ],
        },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('supporter_id', 'name username email profileUrl')
      .populate('tier_id', 'title price discordPerk discordRoleId')
      .lean()

    // Deduplicate by supporter (most recent active payment per supporter)
    // or list all active memberships
    const supporterMap = new Map()
    for (const payment of memberPayments) {
      const supporterKey = payment.supporter_id?._id?.toString() || payment.from_user?.toLowerCase() || payment._id.toString()
      if (!supporterMap.has(supporterKey)) {
        supporterMap.set(supporterKey, payment)
      }
    }

    const uniqueMembers = Array.from(supporterMap.values())

    // Calculate analytics
    const totalMembers = uniqueMembers.length
    const estimatedMrr = uniqueMembers.reduce((sum, p) => sum + Math.round((p.amount || 0) / 100), 0)
    const discordSyncedCount = uniqueMembers.filter((p) => p.discordRoleAssigned).length

    // Tier distribution breakdown
    const tierCounts = {}
    for (const member of uniqueMembers) {
      const title = member.tier_title || member.tier_id?.title || 'Custom Tier'
      tierCounts[title] = (tierCounts[title] || 0) + 1
    }

    // Top tier
    let topTier = 'None'
    let maxCount = 0
    for (const [tierName, count] of Object.entries(tierCounts)) {
      if (count > maxCount) {
        maxCount = count
        topTier = tierName
      }
    }

    const formattedMembers = uniqueMembers.map((payment) => {
      const supporterUser = payment.supporter_id || {}
      return {
        id: payment._id.toString(),
        name: supporterUser.name || payment.from_user || 'Anonymous Member',
        username: supporterUser.username || '',
        email: supporterUser.email || '',
        profileUrl: supporterUser.profileUrl || null,
        tierTitle: payment.tier_title || payment.tier_id?.title || 'Membership Tier',
        tierPrice: payment.tier_id?.price || Math.round((payment.amount || 0) / 100),
        amount: payment.amount || 0,
        supporterDiscordId: payment.supporter_discord_id || '',
        discordRoleAssigned: Boolean(payment.discordRoleAssigned),
        hasDiscordPerk: Boolean(payment.tier_role_id || payment.tier_id?.discordPerk || user.discordRoleId),
        orderId: payment.order_id || '',
        paymentId: payment.payment_id || '',
        createdAt: payment.createdAt,
      }
    })

    return Response.json({
      success: true,
      stats: {
        totalMembers,
        estimatedMrr,
        discordSyncedCount,
        topTier,
        tierBreakdown: tierCounts,
      },
      members: formattedMembers,
    })
  } catch (error) {
    console.error('Members fetch error:', error)
    return Response.json({ error: error.message || 'Failed to fetch members' }, { status: 500 })
  }
}
