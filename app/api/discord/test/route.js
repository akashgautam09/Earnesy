import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { testDiscordConnection } from '@/lib/discord'

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { serverId, roleId } = body

    if (!serverId?.trim() || !roleId?.trim()) {
      return NextResponse.json({ error: 'Both Server ID and Role ID are required.' }, { status: 400 })
    }

    const result = await testDiscordConnection({
      guildId: serverId,
      roleId: roleId,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      guildName: result.guildName,
      roleName: result.roleName,
    })
  } catch (error) {
    console.error('Discord test route error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
