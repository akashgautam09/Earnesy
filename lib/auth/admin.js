import { getCurrentUser } from '@/lib/auth/server'

/**
 * Returns the current user only if they are the platform admin.
 * Admin is determined by matching the user's email to ADMIN_EMAIL env var.
 * Returns null if not authenticated or not admin.
 */
export const getAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return null

  const user = await getCurrentUser()
  if (!user) return null

  const userEmail = user.email?.trim().toLowerCase()
  if (userEmail !== adminEmail) return null

  return user
}

export const requireAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) {
    return { error: 'Admin access is not configured on this platform', status: 503 }
  }

  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Unauthorized: Please login first', status: 401 }
  }

  const userEmail = user.email?.trim().toLowerCase()
  if (userEmail !== adminEmail) {
    return { error: 'Forbidden: Admin access only', status: 403 }
  }

  return { user }
}
