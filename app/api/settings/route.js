import mongoose from 'mongoose'
import { getPlatformSettings } from '@/models/PlatformSettings'

const ensureDb = async () => {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured')
    await mongoose.connect(process.env.MONGODB_URI)
  }
}

export async function GET() {
  try {
    await ensureDb()
    const settings = await getPlatformSettings()

    return Response.json({
      success: true,
      settings: {
        globalFeePercentage: settings?.globalFeePercentage ?? 2,
        minPayoutAmountPaise: settings?.minPayoutAmountPaise ?? 10000,
        maintenanceMode: Boolean(settings?.maintenanceMode),
        announcement: settings?.announcement || { enabled: false, message: '', level: 'info', link: '' },
      },
    })
  } catch (error) {
    console.error('Public settings GET error:', error)
    return Response.json(
      {
        success: true,
        settings: {
          globalFeePercentage: 2,
          minPayoutAmountPaise: 10000,
          maintenanceMode: false,
          announcement: { enabled: false, message: '', level: 'info', link: '' },
        },
      },
      { status: 200 }
    )
  }
}
