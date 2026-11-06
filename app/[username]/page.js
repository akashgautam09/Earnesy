import PaymentPage from '@/components/PaymentPage'
import { fetchUserPage } from '@/actions/userAction'
import { notFound } from 'next/navigation'
import React from 'react'

export async function generateMetadata({ params }) {
  try {
    const { username } = await params
    const user = await fetchUserPage(username)
    if (!user) {
      return {
        title: 'Creator Not Found | Earnesy',
      }
    }

    const title = `${user.name} (@${user.username}) | Earnesy`
    const description =
      user.bio?.trim() ||
      user.title?.trim() ||
      `Support ${user.name} on Earnesy. Join membership tiers, unlock exclusive posts, and get VIP community perks.`
    const imageUrl = user.profileUrl || user.coverUrl || '/tea.gif'

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: imageUrl, alt: user.name }],
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    }
  } catch (error) {
    return {
      title: 'Creator Profile | Earnesy',
    }
  }
}

const page = async ({ params }) => {
  try {
    const { username } = await params
    const user = await fetchUserPage(username)
    if (!user) {
      notFound()
    }

    return <PaymentPage username={username} />
  } catch (error) {
    notFound()
  }
}

export default page
