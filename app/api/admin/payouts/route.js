import mongoose from 'mongoose'
import PayoutRequest from '@/models/PayoutRequest'
import { requireAdmin } from '@/lib/auth/admin'

const ensureDb = async () => {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured')
    await mongoose.connect(process.env.MONGODB_URI)
  }
}

// GET /api/admin/payouts — list all payout requests (filterable by status)
export async function GET(request) {
  try {
    const auth = await requireAdmin()
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status })
    }

    await ensureDb()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending' | 'completed' | 'rejected' | null (all)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = 20

    const filter = {}
    if (status && ['pending', 'completed', 'rejected'].includes(status)) {
      filter.status = status
    }

    const [total, requests] = await Promise.all([
      PayoutRequest.countDocuments(filter),
      PayoutRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ])

    return Response.json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      payoutRequests: requests.map((r) => ({
        id: r._id.toString(),
        creatorId: r.creatorId.toString(),
        username: r.username,
        amount: r.amount,
        payoutMethod: r.payoutMethod,
        payoutDetails: r.payoutDetails,
        status: r.status,
        notes: r.notes || '',
        referenceId: r.referenceId || '',
        createdAt: r.createdAt,
        processedAt: r.processedAt,
      })),
    })
  } catch (error) {
    console.error('Admin payouts fetch error:', error)
    return Response.json({ error: 'Failed to load payout requests' }, { status: 500 })
  }
}

// PATCH /api/admin/payouts — update status of a payout request
// Body: { id, status: 'completed' | 'rejected', referenceId?, notes? }
export async function PATCH(request) {
  try {
    const auth = await requireAdmin()
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status })
    }

    await ensureDb()

    const body = await request.json().catch(() => ({}))
    const { id, status, referenceId, notes } = body

    if (!id || typeof id !== 'string') {
      return Response.json({ error: 'Payout request ID is required' }, { status: 400 })
    }

    if (!['completed', 'rejected'].includes(status)) {
      return Response.json({ error: 'Status must be "completed" or "rejected"' }, { status: 400 })
    }

    if (status === 'completed' && !referenceId?.trim()) {
      return Response.json({ error: 'Reference ID (UTR/transaction ID) is required for completed payouts' }, { status: 400 })
    }

    const updateData = {
      status,
      processedAt: new Date(),
    }

    if (referenceId?.trim()) {
      updateData.referenceId = referenceId.trim()
    }

    if (notes?.trim()) {
      updateData.notes = notes.trim()
    }

    const updated = await PayoutRequest.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean()

    if (!updated) {
      return Response.json({ error: 'Payout request not found' }, { status: 404 })
    }

    return Response.json({
      success: true,
      message: `Payout request marked as ${status}`,
      payoutRequest: {
        id: updated._id.toString(),
        username: updated.username,
        amount: updated.amount,
        status: updated.status,
        referenceId: updated.referenceId || '',
        processedAt: updated.processedAt,
      },
    })
  } catch (error) {
    console.error('Admin payout update error:', error)
    return Response.json({ error: 'Failed to update payout request' }, { status: 500 })
  }
}
