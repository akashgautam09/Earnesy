import mongoose from 'mongoose'
import Tier from '@/models/Tier'
import { getCurrentUser } from '@/lib/auth/server'

export async function GET(req, { params }) {
  try {
    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid tier ID' }, { status: 400 })
    }

    if (mongoose.connection.readyState !== 1) {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not configured')
      }
      await mongoose.connect(process.env.MONGODB_URI)
    }

    const tier = await Tier.findById(id).lean()
    if (!tier) {
      return Response.json({ error: 'Tier not found' }, { status: 404 })
    }

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
      },
    })
  } catch (error) {
    console.error('Fetch single tier error:', error)
    return Response.json({ error: 'Failed to fetch tier' }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid tier ID' }, { status: 400 })
    }

    const tier = await Tier.findOne({ _id: id, creatorId: user._id })
    if (!tier) {
      return Response.json({ error: 'Tier not found or access denied' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const { title, price, description, perks, discordPerk, discordRoleId, isActive } = body

    if (title !== undefined) {
      const cleanTitle = typeof title === 'string' ? title.trim() : ''
      if (!cleanTitle) {
        return Response.json({ error: 'Tier title cannot be empty' }, { status: 400 })
      }
      tier.title = cleanTitle
    }

    if (price !== undefined) {
      const cleanPrice = Number(price)
      if (isNaN(cleanPrice) || cleanPrice < 1) {
        return Response.json({ error: 'Price must be at least ₹1' }, { status: 400 })
      }
      tier.price = cleanPrice
    }

    if (description !== undefined) {
      tier.description = typeof description === 'string' ? description.trim() : ''
    }

    if (perks !== undefined && Array.isArray(perks)) {
      tier.perks = perks
        .map((p) => (typeof p === 'string' ? p.trim() : ''))
        .filter(Boolean)
        .slice(0, 15)
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
    console.error('Update single tier error:', error)
    return Response.json({ error: error.message || 'Failed to update tier' }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid tier ID' }, { status: 400 })
    }

    const deleted = await Tier.findOneAndDelete({ _id: id, creatorId: user._id })
    if (!deleted) {
      return Response.json({ error: 'Tier not found or access denied' }, { status: 404 })
    }

    return Response.json({
      success: true,
      message: 'Tier deleted successfully',
      id,
    })
  } catch (error) {
    console.error('Delete single tier error:', error)
    return Response.json({ error: error.message || 'Failed to delete tier' }, { status: 500 })
  }
}

