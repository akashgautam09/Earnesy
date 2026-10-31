import mongoose from 'mongoose'
import Tier from '@/models/Tier'
import User from '@/models/User'
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
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const creatorId = searchParams.get('creatorId')

    // Public fetch for a creator's public tiers
    if (username || creatorId) {
      await ensureDb()
      const query = username
        ? { username: username.trim().toLowerCase() }
        : { _id: creatorId }
      const creator = await User.findOne(query)
        .select('_id username name profileUrl discordServerId discordInviteUrl')
        .lean()

      if (!creator) {
        return Response.json({ error: 'Creator not found' }, { status: 404 })
      }

      const tiers = await Tier.find({
        creatorId: creator._id,
        isActive: true,
      })
        .sort({ price: 1, order: 1, createdAt: 1 })
        .lean()

      return Response.json({
        success: true,
        tiers: tiers.map((t) => ({
          id: t._id.toString(),
          title: t.title,
          price: t.price,
          description: t.description || '',
          perks: t.perks || [],
          discordPerk: Boolean(t.discordPerk),
          discordRoleId: t.discordRoleId || '',
          isActive: t.isActive !== false,
          createdAt: t.createdAt,
        })),
        creator: {
          id: creator._id.toString(),
          name: creator.name,
          username: creator.username,
          profileUrl: creator.profileUrl,
          hasDiscord: Boolean(creator.discordServerId),
          discordInviteUrl: creator.discordInviteUrl || '',
        },
      })
    }

    // Authenticated creator view
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    const tiers = await Tier.find({ creatorId: user._id })
      .sort({ price: 1, order: 1, createdAt: -1 })
      .lean()

    return Response.json({
      success: true,
      tiers: tiers.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        price: t.price,
        description: t.description || '',
        perks: t.perks || [],
        discordPerk: Boolean(t.discordPerk),
        discordRoleId: t.discordRoleId || '',
        isActive: t.isActive !== false,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      discord: {
        isConfigured: Boolean(user.discordServerId && user.discordRoleId),
        serverId: user.discordServerId || '',
        defaultRoleId: user.discordRoleId || '',
        inviteUrl: user.discordInviteUrl || '',
      },
      paymentsEnabled: Boolean(user.razorpayId && user.razorpaySecret),
    })
  } catch (error) {
    console.error('Tiers GET error:', error)
    return Response.json({ error: 'Failed to load tiers' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const {
      title = '',
      price,
      description = '',
      perks = [],
      discordPerk = false,
      discordRoleId = '',
      isActive = true,
    } = body

    const cleanTitle = typeof title === 'string' ? title.trim() : ''
    const cleanPrice = Number(price)
    const cleanDescription = typeof description === 'string' ? description.trim() : ''
    const cleanDiscordRoleId = typeof discordRoleId === 'string' ? discordRoleId.trim() : ''
    const cleanPerks = Array.isArray(perks)
      ? perks
          .map((p) => (typeof p === 'string' ? p.trim() : ''))
          .filter((p) => Boolean(p))
          .slice(0, 15)
      : []

    if (!cleanTitle) {
      return Response.json({ error: 'Tier title is required' }, { status: 400 })
    }

    if (cleanTitle.length > 100) {
      return Response.json({ error: 'Tier title must be 100 characters or fewer' }, { status: 400 })
    }

    if (isNaN(cleanPrice) || cleanPrice < 1) {
      return Response.json({ error: 'Price must be at least ₹1' }, { status: 400 })
    }

    if (cleanPrice > 1000000) {
      return Response.json({ error: 'Price cannot exceed ₹1,000,000' }, { status: 400 })
    }

    if (cleanDescription.length > 1000) {
      return Response.json({ error: 'Description must be 1000 characters or fewer' }, { status: 400 })
    }

    const effectiveRoleId = Boolean(discordPerk)
      ? (cleanDiscordRoleId || user.discordRoleId || '')
      : ''

    const tier = await Tier.create({
      creatorId: user._id,
      title: cleanTitle,
      price: cleanPrice,
      description: cleanDescription,
      perks: cleanPerks,
      discordPerk: Boolean(discordPerk),
      discordRoleId: effectiveRoleId,
      isActive: isActive !== false,
    })

    return Response.json(
      {
        success: true,
        tier: {
          id: tier._id.toString(),
          title: tier.title,
          price: tier.price,
          description: tier.description || '',
          perks: tier.perks || [],
          discordPerk: Boolean(tier.discordPerk),
          discordRoleId: tier.discordRoleId || '',
          isActive: tier.isActive !== false,
          createdAt: tier.createdAt,
          updatedAt: tier.updatedAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Tier creation error:', error)
    return Response.json({ error: error.message || 'Failed to create tier' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const {
      id,
      title,
      price,
      description,
      perks,
      discordPerk,
      discordRoleId,
      isActive,
    } = body

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid or missing tier ID' }, { status: 400 })
    }

    const tier = await Tier.findOne({ _id: id, creatorId: user._id })
    if (!tier) {
      return Response.json({ error: 'Tier not found' }, { status: 404 })
    }

    if (title !== undefined) {
      const cleanTitle = typeof title === 'string' ? title.trim() : ''
      if (!cleanTitle) {
        return Response.json({ error: 'Tier title cannot be empty' }, { status: 400 })
      }
      if (cleanTitle.length > 100) {
        return Response.json({ error: 'Tier title must be 100 characters or fewer' }, { status: 400 })
      }
      tier.title = cleanTitle
    }

    if (price !== undefined) {
      const cleanPrice = Number(price)
      if (isNaN(cleanPrice) || cleanPrice < 1) {
        return Response.json({ error: 'Price must be at least ₹1' }, { status: 400 })
      }
      if (cleanPrice > 1000000) {
        return Response.json({ error: 'Price cannot exceed ₹1,000,000' }, { status: 400 })
      }
      tier.price = cleanPrice
    }

    if (description !== undefined) {
      const cleanDesc = typeof description === 'string' ? description.trim() : ''
      if (cleanDesc.length > 1000) {
        return Response.json({ error: 'Description must be 1000 characters or fewer' }, { status: 400 })
      }
      tier.description = cleanDesc
    }

    if (perks !== undefined) {
      if (Array.isArray(perks)) {
        tier.perks = perks
          .map((p) => (typeof p === 'string' ? p.trim() : ''))
          .filter((p) => Boolean(p))
          .slice(0, 15)
      }
    }

    if (discordPerk !== undefined) {
      tier.discordPerk = Boolean(discordPerk)
      if (tier.discordPerk) {
        const cleanRoleId = typeof discordRoleId === 'string' ? discordRoleId.trim() : ''
        tier.discordRoleId = cleanRoleId || tier.discordRoleId || user.discordRoleId || ''
      }
    } else if (discordRoleId !== undefined) {
      tier.discordRoleId = typeof discordRoleId === 'string' ? discordRoleId.trim() : ''
    }

    if (isActive !== undefined) {
      tier.isActive = Boolean(isActive)
    }

    await tier.save()

    return Response.json({
      success: true,
      tier: {
        id: tier._id.toString(),
        title: tier.title,
        price: tier.price,
        description: tier.description || '',
        perks: tier.perks || [],
        discordPerk: Boolean(tier.discordPerk),
        discordRoleId: tier.discordRoleId || '',
        isActive: tier.isActive !== false,
        createdAt: tier.createdAt,
        updatedAt: tier.updatedAt,
      },
    })
  } catch (error) {
    console.error('Tier update error:', error)
    return Response.json({ error: error.message || 'Failed to update tier' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let tierId = searchParams.get('id')

    if (!tierId) {
      const body = await request.json().catch(() => ({}))
      tierId = body.id
    }

    if (!tierId || !mongoose.Types.ObjectId.isValid(tierId)) {
      return Response.json({ error: 'Invalid or missing tier ID' }, { status: 400 })
    }

    const deleted = await Tier.findOneAndDelete({ _id: tierId, creatorId: user._id })
    if (!deleted) {
      return Response.json({ error: 'Tier not found or access denied' }, { status: 404 })
    }

    return Response.json({
      success: true,
      message: 'Tier deleted successfully',
      id: tierId,
    })
  } catch (error) {
    console.error('Tier delete error:', error)
    return Response.json({ error: error.message || 'Failed to delete tier' }, { status: 500 })
  }
}

