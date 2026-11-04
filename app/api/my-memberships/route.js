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

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    await ensureDb()

    // Find all completed payments made by this supporter
    const supporterQuery = {
      done: true,
      $or: [
        { supporter_id: currentUser._id },
        ...(currentUser.name ? [{ from_user: currentUser.name }] : []),
        ...(currentUser.username ? [{ from_user: currentUser.username }] : []),
      ],
    }

    const payments = await Payment.find(supporterQuery)
      .sort({ createdAt: -1 })
      .populate('tier_id', 'title price description perks discordPerk discordRoleId')
      .lean()

    // Fetch creator profiles for these payments
    const creatorUsernames = [
      ...new Set(
        payments
          .map((p) => p.to_user?.trim().toLowerCase())
          .filter(Boolean)
      ),
    ]

    const creators = await User.find({ username: { $in: creatorUsernames } })
      .select('_id name username profileUrl coverUrl bio title discordServerId discordInviteUrl')
      .lean()

    const creatorMap = new Map()
    for (const c of creators) {
      creatorMap.set(c.username.toLowerCase(), c)
    }

    // Separate into Memberships (tiers) and Coffees (one-time)
    const tierPayments = payments.filter((p) => Boolean(p.tier_id || p.tier_title))
    const coffeePayments = payments.filter((p) => !p.tier_id && !p.tier_title)

    // Deduplicate memberships: keep most recent active payment per creator
    const membershipMap = new Map()
    for (const payment of tierPayments) {
      const creatorKey = payment.to_user?.toLowerCase() || payment.creator_id?.toString()
      if (!membershipMap.has(creatorKey)) {
        membershipMap.set(creatorKey, payment)
      }
    }

    const uniqueMemberships = Array.from(membershipMap.values())

    const formattedMemberships = uniqueMemberships.map((payment) => {
      const creator = creatorMap.get(payment.to_user?.toLowerCase()) || {}
      const tierObj = payment.tier_id || {}
      return {
        id: payment._id.toString(),
        creator: {
          id: creator._id ? creator._id.toString() : '',
          name: creator.name || payment.to_user || 'Creator',
          username: creator.username || payment.to_user || '',
          profileUrl: creator.profileUrl || null,
          title: creator.title || '',
          discordInviteUrl: creator.discordInviteUrl || '',
          hasDiscord: Boolean(creator.discordServerId && creator.discordInviteUrl),
        },
        tierTitle: payment.tier_title || tierObj.title || 'Membership Tier',
        tierPrice: tierObj.price || Math.round((payment.amount || 0) / 100),
        amount: payment.amount || 0,
        perks: tierObj.perks || [],
        discordRoleAssigned: Boolean(payment.discordRoleAssigned),
        supporterDiscordId: payment.supporter_discord_id || '',
        orderId: payment.order_id || '',
        paymentId: payment.payment_id || '',
        joinedAt: payment.createdAt,
      }
    })

    const formattedCoffees = coffeePayments.map((payment) => {
      const creator = creatorMap.get(payment.to_user?.toLowerCase()) || {}
      return {
        id: payment._id.toString(),
        creator: {
          name: creator.name || payment.to_user || 'Creator',
          username: creator.username || payment.to_user || '',
          profileUrl: creator.profileUrl || null,
        },
        amount: payment.amount || 0,
        paymentId: payment.payment_id || '',
        createdAt: payment.createdAt,
      }
    })

    const totalPaiseContributed = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const totalContributedInRupees = Math.round(totalPaiseContributed / 100)

    return Response.json({
      success: true,
      stats: {
        activeMembershipsCount: formattedMemberships.length,
        totalCoffeesCount: formattedCoffees.length,
        totalContributed: totalContributedInRupees,
        creatorsSupportedCount: creatorUsernames.length,
      },
      memberships: formattedMemberships,
      coffees: formattedCoffees,
    })
  } catch (error) {
    console.error('My memberships fetch error:', error)
    return Response.json({ error: error.message || 'Failed to load your memberships' }, { status: 500 })
  }
}
