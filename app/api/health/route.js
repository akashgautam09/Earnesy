import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET() {
  let dbStatus = 'disconnected'

  try {
    if (mongoose.connection.readyState !== 1 && process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI)
    }

    if (mongoose.connection.readyState === 1) {
      dbStatus = 'connected'
    }
  } catch (error) {
    dbStatus = 'error'
  }

  const isHealthy = dbStatus === 'connected'

  return Response.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptimeSeconds: Math.floor(process.uptime()),
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  )
}
