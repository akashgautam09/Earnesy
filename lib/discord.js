const DISCORD_API_BASE = 'https://discord.com/api/v10'

const getBotToken = () => {
  const token = process.env.DISCORD_BOT_TOKEN?.trim()
  if (!token) {
    throw new Error('DISCORD_BOT_TOKEN is not configured')
  }
  return token
}

/**
 * Validates a Discord snowflake ID (typically 17-20 digits)
 */
export const isValidSnowflake = (id) => {
  return typeof id === 'string' && /^\d{17,20}$/.test(id.trim())
}

/**
 * Tests if the bot is in the server, if the role exists,
 * and if the bot has permission to assign that role (hierarchy check).
 */
export const testDiscordConnection = async ({ guildId, roleId }) => {
  try {
    const token = getBotToken()

    const cleanGuildId = guildId?.trim()
    const cleanRoleId = roleId?.trim()

    if (!isValidSnowflake(cleanGuildId)) {
      return { success: false, error: 'Invalid Server ID format. Server IDs are 17-20 numbers.' }
    }
    if (!isValidSnowflake(cleanRoleId)) {
      return { success: false, error: 'Invalid Role ID format. Role IDs are 17-20 numbers.' }
    }

    // 1. Fetch guild info to verify bot presence
    const guildRes = await fetch(`${DISCORD_API_BASE}/guilds/${cleanGuildId}`, {
      headers: { Authorization: `Bot ${token}` },
    })

    if (guildRes.status === 404 || guildRes.status === 403) {
      return {
        success: false,
        error: 'Earnesy Bot is not in this Discord server. Please click "Add Earnesy Bot" above to invite it first.',
      }
    }

    if (!guildRes.ok) {
      return { success: false, error: `Discord error (${guildRes.status}): Could not load server info.` }
    }

    const guildData = await guildRes.json()

    // 2. Fetch guild roles to check if role exists
    const rolesRes = await fetch(`${DISCORD_API_BASE}/guilds/${cleanGuildId}/roles`, {
      headers: { Authorization: `Bot ${token}` },
    })

    if (!rolesRes.ok) {
      return { success: false, error: `Could not retrieve roles from Discord (${rolesRes.status}).` }
    }

    const roles = await rolesRes.json()
    const targetRole = roles.find((r) => r.id === cleanRoleId)

    if (!targetRole) {
      return { success: false, error: 'Role not found in this server. Please double-check your Role ID.' }
    }

    // 3. Fetch bot member details in this guild
    const botMemberRes = await fetch(`${DISCORD_API_BASE}/guilds/${cleanGuildId}/members/@me`, {
      headers: { Authorization: `Bot ${token}` },
    })

    if (botMemberRes.ok) {
      const botMember = await botMemberRes.json()
      const botRoles = roles.filter((r) => botMember.roles.includes(r.id))
      const botHighestPos = botRoles.reduce((max, r) => Math.max(max, r.position || 0), 0)

      if (targetRole.position >= botHighestPos) {
        return {
          success: false,
          error: `Earnesy Bot's role is below @${targetRole.name}. In Discord, drag 'Earnesy Bot' above @${targetRole.name} in Server Settings → Roles.`,
        }
      }
    }

    return {
      success: true,
      guildName: guildData.name,
      roleName: targetRole.name,
    }
  } catch (error) {
    console.error('Discord connection test error:', error)
    return { success: false, error: error.message || 'Failed to connect to Discord.' }
  }
}

/**
 * Assigns a role to a user in a Discord guild.
 */
export const assignDiscordRole = async ({ guildId, userId, roleId }) => {
  try {
    const token = getBotToken()
    const cleanGuild = guildId?.trim()
    const cleanUser = userId?.trim()
    const cleanRole = roleId?.trim()

    if (!cleanGuild || !cleanUser || !cleanRole) {
      return { success: false, error: 'Missing guildId, userId, or roleId' }
    }

    if (!isValidSnowflake(cleanGuild) || !isValidSnowflake(cleanUser) || !isValidSnowflake(cleanRole)) {
      return { success: false, error: 'Invalid Discord ID format' }
    }

    const url = `${DISCORD_API_BASE}/guilds/${cleanGuild}/members/${cleanUser}/roles/${cleanRole}`

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${token}`,
        'X-Audit-Log-Reason': 'Earnesy Supporter VIP Role',
      },
    })

    if (res.status === 204) {
      return { success: true }
    }

    if (res.status === 404) {
      return {
        success: false,
        memberNotFound: true,
        error: 'Supporter has not joined this Discord server yet.',
      }
    }

    if (res.status === 403) {
      return {
        success: false,
        error: "Earnesy Bot does not have permission to assign this role. Please ensure the bot's role is higher than the supporter role.",
      }
    }

    const errData = await res.json().catch(() => null)
    return {
      success: false,
      error: errData?.message || `Discord API returned status ${res.status}`,
    }
  } catch (error) {
    console.error('Error assigning Discord role:', error)
    return { success: false, error: error.message || 'Failed to assign Discord role' }
  }
}
