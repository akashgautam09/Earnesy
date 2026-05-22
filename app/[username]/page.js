import PaymentPage from '@/components/PaymentPage'
import { fetchCreator } from '@/actions/userAction'
import { notFound } from 'next/navigation'
import React from 'react'

const page = async ({params}) => {
  try {
    const creator = await fetchCreator(params.username)
    if (!creator) {
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