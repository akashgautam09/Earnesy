import Payment from '@/models/Payment'

export const getCreatorStats = async (user) => {
  const [summary, supporters] = await Promise.all([
    Payment.aggregate([
      { $match: { to_user: user.username, done: true } },
      { $group: { _id: null, totalEarnings: { $sum: '$amount' } } },
    ]),
    Payment.distinct('from_user', { to_user: user.username, done: true }),
  ])

  return {
    totalEarnings: summary[0]?.totalEarnings || 0,
    supporters: supporters.length,
    membership: {
      plan: 'Free creator',
      status: 'Active',
      since: user.createdAt,
    },
  }
}

export const getCreatorPayments = async (user) => Payment.find({
  to_user: user.username,
  done: true,
}).sort({ createdAt: -1 }).lean()
