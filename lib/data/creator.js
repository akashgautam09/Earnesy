import Payment from '@/models/Payment'

export const getCreatorStats = async (user) => {
  const [summary, supporters] = await Promise.all([
    Payment.aggregate([
      {
        $match: {
          $or: [
            { to_user: user.username?.trim().toLowerCase(), done: true },
            { creator_id: user._id, done: true },
          ],
        },
      },
      {
        $group: {
          _id: null,
          grossEarnings: { $sum: '$amount' },
          platformFees: {
            $sum: {
              $cond: [
                { $gt: ['$platformFee', 0] },
                '$platformFee',
                { $round: [{ $multiply: ['$amount', 0.02] }, 0] },
              ],
            },
          },
          netEarnings: {
            $sum: {
              $cond: [
                { $gt: ['$creatorAmount', 0] },
                '$creatorAmount',
                { $subtract: ['$amount', { $round: [{ $multiply: ['$amount', 0.02] }, 0] }] },
              ],
            },
          },
        },
      },
    ]),
    Payment.distinct('from_user', {
      $or: [
        { to_user: user.username?.trim().toLowerCase(), done: true },
        { creator_id: user._id, done: true },
      ],
    }),
  ])

  const stats = summary[0] || {}
  const gross = stats.grossEarnings || 0
  const fee = stats.platformFees || Math.round(gross * 0.02)
  const net = stats.netEarnings || (gross - fee)

  return {
    totalEarnings: gross,
    grossEarnings: gross,
    platformFees: fee,
    netEarnings: net,
    supporters: supporters.length,
    membership: {
      plan: 'Free creator',
      status: 'Active',
      since: user.createdAt,
    },
  }
}

export const getCreatorPayments = async (user) =>
  Payment.find({
    $or: [
      { to_user: user.username?.trim().toLowerCase(), done: true },
      { creator_id: user._id, done: true },
    ],
  })
    .sort({ createdAt: -1 })
    .lean()
