import PaymentPage from '@/components/PaymentPage'
import { fetchUserPage } from '@/actions/userAction'
import { notFound } from 'next/navigation'
import React from 'react'

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