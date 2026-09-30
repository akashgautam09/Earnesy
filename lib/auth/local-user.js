import User from '@/models/User'
import Account from '@/models/Account'

const normalizeEmail = (email) => email?.trim().toLowerCase()

const createUsername = async (email) => {
  const base = normalizeEmail(email)
    .split('@')[0]
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 24) || 'user'

  let username = base.length >= 3 ? base : `${base}-user`
  let suffix = 1

  while (await User.exists({ username })) {
    const suffixText = `-${suffix}`
    username = `${base.slice(0, 30 - suffixText.length)}${suffixText}`
    suffix += 1
  }

  return username
}

export const getProviderEmail = async ({ user, account, profile }) => {
  if (account?.provider === 'github' && account.access_token) {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${account.access_token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    if (!response.ok) {
      return null
    }

    const emails = await response.json()
    const verifiedEmail = emails.find((email) => email.verified && email.primary)
      || emails.find((email) => email.verified)

    return normalizeEmail(verifiedEmail?.email)
  }

  if (account?.provider === 'google' && profile?.email_verified !== true) {
    return null
  }

  return normalizeEmail(user?.email || profile?.email)
}

export const ensureLocalUser = async ({ user, account, profile }) => {
  const email = await getProviderEmail({ user, account, profile })

  if (!account?.provider || !account.providerAccountId || !email) {
    return null
  }

  const linkedAccount = await Account.findOne({
    provider: account.provider,
    providerAccountId: account.providerAccountId,
  })

  let currentUser = linkedAccount ? await User.findById(linkedAccount.userId)
    : await User.findOne({ email })

  if (linkedAccount && currentUser && normalizeEmail(currentUser.email) !== email) {
    return null
  }

  if (!currentUser) {
    try {
      currentUser = await User.create({
        name: user.name || '',
        username: await createUsername(email),
        email,
      })
    } catch (error) {
      if (error?.code !== 11000) {
        throw error
      }

      currentUser = await User.findOne({ email })
    }
  }

  if (!currentUser) {
    throw new Error('OAuth user could not be loaded after creation')
  }

  await Account.findOneAndUpdate(
    { provider: account.provider, providerAccountId: account.providerAccountId },
    {
      userId: currentUser._id,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      type: account.type,
    },
    { upsert: true, setDefaultsOnInsert: true }
  )

  return currentUser
}

export { normalizeEmail }