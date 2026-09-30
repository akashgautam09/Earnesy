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

const getVerifiedPrimaryEmail = (clerkUser) => {
  const emailAddress = clerkUser.emailAddresses?.find(
    (address) => address.id === clerkUser.primaryEmailAddressId
  )

  if (emailAddress?.verification?.status !== 'verified') {
    return null
  }

  return normalizeEmail(emailAddress.emailAddress)
}

const getDisplayName = (clerkUser) => clerkUser.fullName
  || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ')
  || ''

export const ensureClerkUser = async ({ clerkUserId, clerkUser }) => {
  if (!clerkUserId || !clerkUser) {
    return null
  }

  const email = getVerifiedPrimaryEmail(clerkUser)
  if (!email) {
    return null
  }

  const linkedAccount = await Account.findOne({
    provider: 'clerk',
    providerAccountId: clerkUserId,
  })

  if (linkedAccount) {
    return User.findById(linkedAccount.userId)
  }

  let currentUser = await User.findOne({ email })

  if (!currentUser) {
    try {
      currentUser = await User.create({
        name: getDisplayName(clerkUser),
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
    throw new Error('Clerk user could not be loaded after creation')
  }

  const account = await Account.findOneAndUpdate(
    { provider: 'clerk', providerAccountId: clerkUserId },
    {
      $setOnInsert: {
        userId: currentUser._id,
        provider: 'clerk',
        providerAccountId: clerkUserId,
        type: 'oauth',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  if (account.userId.toString() !== currentUser._id.toString()) {
    return null
  }

  return currentUser
}

