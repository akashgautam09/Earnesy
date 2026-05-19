import PaymentPage from '@/components/PaymentPage'
import React from 'react'

const page = ({params}) => {
  return (
    <>
    <PaymentPage username={params.username} />
    </>
  )
}

export default page