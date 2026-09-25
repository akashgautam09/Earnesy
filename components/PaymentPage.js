"use client"

import React from 'react'
import Script from 'next/script'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import { fetchPayments, initiate, fetchUserPage } from '@/actions/userAction'
import { ToastContainer, toast, Bounce } from 'react-toastify'
import { useSearchParams } from 'next/navigation'

export const PaymentPage = ({ username }) => {
    const { data: session, status } = useSession()
    const router = useRouter()
    const isMounted = useRef(true)
    const [paymentform, setPaymentform] = useState({ name: '', amount: '' })
    const [currentUser, setCurrentUser] = useState({})
    const [paymentReceived, setPaymentReceived] = useState([])
    const [pageLoading, setPageLoading] = useState(true)
    const searchParams = useSearchParams()

    const loadUserPage = useCallback(async () => {
        if (!isMounted.current) return
        try {
            // These requests are independent, so load them at the same time.
            const [user, payments] = await Promise.all([
                fetchUserPage(username),
                fetchPayments(username),
            ])

            if (isMounted.current) {
                setCurrentUser(user || {})
                setPaymentReceived(payments)
            }
        } catch (error) {
            console.error('Error fetching user page:', error)
        } finally {
            if (isMounted.current) setPageLoading(false)
        }
    }, [username])

    useEffect(() => {
        isMounted.current = true
        loadUserPage()

        return () => {
            isMounted.current = false
        }
    }, [loadUserPage])

    useEffect(() => {
        if (searchParams.get("paymentdone") === "true" && isMounted.current) {
            toast.success("Payment done successfully")
            router.replace(`/${username}`)
        }
    }, [searchParams, username, router])

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-slate-600">Loading page...</p>
            </div>
        )
    }

    const handlechange = (e) => {
        setPaymentform({ ...paymentform, [e.target.name]: e.target.value })
    }

    const pay = async (amount) => {
        try {
            if (!paymentform.name || !amount) {
                toast.error('Please fill in all fields');
                return;
            }

            // Profiles are public, but starting a payment requires a session.
            if (status !== 'authenticated') {
                toast.info('Please log in before making a payment.')
                router.push('/login')
                return
            }

            if (!currentUser?.paymentsEnabled) {
                toast.error('This user is currently unable to accept payments.')
                return;
            }

            // The server validates the session, amount, and payment credentials again.
            const x = await initiate(amount, username, paymentform)
            if (x?.error) {
                toast.error(x.error)
                return
            }
            let order_id = x.id

            const options = {
                "key": currentUser.razorpayId,
                "amount": amount, // Amount is in currency subunits. 
                "currency": "INR",
                "name": "Earnesy", //your business name
                "description": "Test Transaction",
                "image": "https://example.com/your_logo",
                "order_id": order_id, // This is a sample Order ID. Pass the id obtained in the response of Step 1
                "callback_url": `${process.env.NEXT_PUBLIC_URL}/api/razorpay/`,
                "prefill": { //We recommend using the prefill parameter to auto-fill customer's contact information especially their phone number
                    "name": paymentform.name, //your customer's name
                    "email": session?.user.email,
                    "contact": "+919876543210" //Provide the customer's phone number for better conversion rates 
                },
                "notes": {
                    "address": "Razorpay Corporate Office"
                },
                "theme": {
                    "color": "#3399cc"
                }
            };
            if (!window.Razorpay) {
                toast.error('Payment checkout is still loading. Please try again.')
                return
            }

            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } catch (error) {
            console.error('Payment error:', error || error.message);
            toast.error(`Error: ${error.message || 'Payment failed. Please try again.'}`);
        }
    }

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js"></Script>
            <ToastContainer
                position="bottom-left"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Bounce}
            />

            <div className="relative mb-12 sm:mb-16 md:mb-20">
                <div className="coverImage w-full h-32 sm:h-44 md:h-56 lg:h-72 bg-slate-200 overflow-hidden">
                    <img src={currentUser.coverUrl} alt="cover image" className="w-full h-full object-cover" />
                </div>
                <span className="profileImage absolute w-20 sm:w-24 md:w-28 -bottom-10 sm:-bottom-12 left-1/2 -translate-x-1/2 overflow-hidden aspect-square rounded-full bg-slate-200 border-4 border-[#fffdf8]">
                    <img src={currentUser.profileUrl} alt="profile image" className="w-full h-full object-cover object-center" />
                </span>
            </div>
            <div>
                <div className="flex flex-col gap-1 text-center py-6 sm:py-8 md:py-10 px-2 sm:px-4">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{username}</div>
                    <p className="text-xs sm:text-sm md:text-base px-2 sm:px-4 text-slate-700">exploring conceal topics and telling amazing stories</p>
                    <div className="text-xs sm:text-sm text-slate-600 mt-1"><span>934 members </span><span className="mx-1">•</span><span>105 Posts</span></div>
                </div>
                <div className="flex flex-col gap-2 sm:gap-3 justify-center items-center px-4">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 sm:py-2.5 w-full max-w-xs sm:max-w-sm rounded-lg sm:rounded-xl cursor-pointer text-xs sm:text-sm md:text-base font-medium transition-all active:scale-95">Join for free</button>
                    <button className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-2 sm:py-2.5 w-full max-w-xs sm:max-w-sm rounded-lg sm:rounded-xl cursor-pointer text-xs sm:text-sm md:text-base font-medium transition-all active:scale-95">See membership options</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full px-4 sm:px-6 lg:px-10 my-8 sm:my-12 md:my-16">

                {/* Supporters Section */}

                <div className="bg-white rounded-lg p-4 sm:p-6 lg:max-h-[450px] shadow-lg border border-slate-200">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-3 sm:mb-4 md:mb-6">Top Supporters</h2>
                    <ul className="space-y-2 sm:space-y-3 overflow-y-auto max-h-64 sm:max-h-80 md:max-h-96 custom-scrollbar pr-2">
                        {paymentReceived.map((supporter, index) => (
                            <li key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-sm sm:text-base">
                                <span className="text-slate-800 font-medium break-words">{supporter.from_user}</span>
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-semibold self-start sm:self-auto flex-shrink-0">₹{supporter.amount / 100}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {currentUser.paymentsEnabled ? (
                    <div className="bg-white rounded-lg lg:max-h-[350px] p-4 sm:p-6 shadow-lg border border-slate-200">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-3 sm:mb-4 md:mb-6">Support This User</h2>

                        <form className="space-y-3 sm:space-y-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Your Name</label>
                                <input onChange={handlechange} value={paymentform.name}
                                    type="text"
                                    name="name"
                                    placeholder="Enter your name"
                                    className="w-full px-3 sm:px-4 py-2 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-500 border border-slate-300 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">Donation Amount (₹)</label>
                                <input onChange={handlechange} value={paymentform.amount}
                                    type="number"
                                    name="amount"
                                    placeholder="Enter amount"
                                    min="1"
                                    className="w-full px-3 sm:px-4 py-2 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-500 border border-slate-300 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                                />
                            </div>
                            <div className="w-full flex justify-center items-center pt-2">
                                <button onClick={(e) => {
                                    e.preventDefault();
                                    pay(paymentform.amount * 100);
                                }}
                                    type="button"
                                    className="w-32 sm:w-36 bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm sm:text-base font-semibold py-2 sm:py-2.5 rounded-lg transition-all duration-200 transform hover:scale-105"
                                >
                                    Donate Now
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg border border-slate-200">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Razorpay not connected</h2>
                        <p className="text-sm text-slate-700">This user is currently unable to accept payments.</p>
                    </div>
                )}
            </div>
        </>
    )
}

// https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
export default PaymentPage