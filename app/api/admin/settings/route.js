import mongoose from 'mongoose'
import PlatformSettings, { getPlatformSettings } from '@/models/PlatformSettings'
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
    const settings = await getPlatformSettings()

    return Response.json({ success: true, settings })
  } catch (error) {
    console.error('Admin settings GET error:', error)
    return Response.json({ error: 'Failed to load platform settings' }, { status: 500 })
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
    const updates = {}

    if (body.globalFeePercentage !== undefined) {
      const fee = Number(body.globalFeePercentage)
      if (Number.isNaN(fee) || fee < 0 || fee > 100) {
        return Response.json({ error: 'Global fee percentage must be between 0 and 100%' }, { status: 400 })
      }
      updates.globalFeePercentage = fee
    }

    if (body.minPayoutAmountPaise !== undefined) {
      const minPayout = Number(body.minPayoutAmountPaise)
      if (!Number.isInteger(minPayout) || minPayout < 100) {
        return Response.json({ error: 'Minimum payout must be at least ₹1 (100 paise)' }, { status: 400 })
      }
      updates.minPayoutAmountPaise = minPayout
    }

    if (body.maintenanceMode !== undefined) {
      updates.maintenanceMode = Boolean(body.maintenanceMode)
    }

    if (body.announcement !== undefined) {
      updates.announcement = {
        enabled: Boolean(body.announcement?.enabled),
        message: String(body.announcement?.message || '').trim().slice(0, 300),
        level: ['info', 'warning', 'critical'].includes(body.announcement?.level)
          ? body.announcement.level
          : 'info',
        link: String(body.announcement?.link || '').trim(),
      }
    }

    updates.updatedBy = auth.email || 'admin'

    let settings = await PlatformSettings.findOneAndUpdate({}, updates, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).lean()

    return Response.json({
      success: true,
      message: 'Platform settings updated successfully',
      settings,
    })
  } catch (error) {
    console.error('Admin settings PATCH error:', error)
    return Response.json({ error: 'Failed to update platform settings' }, { status: 500 })
  }
}
