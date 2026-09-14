import PaymentPage from '@/components/PaymentPage'
import { fetchUserPage } from '@/actions/userAction'
import { notFound } from 'next/navigation'
import React from 'react'

const page = async ({params}) => {
  try {
    const user = await fetchUserPage(params.username)
    if (!user) {
      notFound()
    }
  } catch (error) {
    notFound()
  }

  return (
    <>
    <PaymentPage username={params.username} />
    </>
  )
}

export default page