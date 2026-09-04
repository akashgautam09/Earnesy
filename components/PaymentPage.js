"use client"

import React from 'react'
import Script from 'next/script'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback, useRef } from "react"
import { creatorPayments, initiate, fetchCreator } from '@/actions/userAction'
import { ToastContainer, toast, Bounce } from 'react-toastify'
import { useSearchParams } from 'next/navigation'

export const PaymentPage = ({ username }) => {
    const { data: session, status } = useSession()
    const router = useRouter()
    const isMounted = useRef(true)
    const [paymentform, setPaymentform] = useState({ name: '', amount: '' })
    const [currentCreator, setcurrentCreator] = useState({})
    const [paymentReceived, setPaymentReceived] = useState([])
    const searchParams = useSearchParams()

    const fetchCurrentCreator = useCallback(async () => {
        if (!isMounted.current) return
        try {
            let user = await fetchCreator(username)
            if (isMounted.current) setcurrentCreator(user);
            let payments = await creatorPayments(username)
            if (isMounted.current) setPaymentReceived(payments);
        } catch (error) {
            console.error('Error fetching creator:', error)
        }
    }, [username])

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
    }, [status, router])

    useEffect(() => {
        fetchCurrentCreator()
    }, [fetchCurrentCreator])

    useEffect(() => {
        if (searchParams.get("paymentdone") === "true" && isMounted.current) {
            toast.success("Payment done successfully")
            router.replace(`/${username}`)
        }
    }, [searchParams, username])

    // Show loading state while checking authentication
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-400">Loading...</p>
            </div>
        )
    }

    // Don't render if not authenticated
    if (status === 'unauthenticated') {
        return null
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

            if (!currentCreator?.razorpayId) {
                toast.error('This creator has not configured Razorpay payments yet.');
                return;
            }

            let x = await initiate(amount, username, paymentform)
            if (x?.error) {
                toast.error(x.error)
                return
            }
            let order_id = x.id

            var options = {
                "key": currentCreator.razorpayId, // Enter the Key ID generated from the Dashboard
                "amount": amount, // Amount is in currency subunits. 
                "currency": "INR",
                "name": "Get Me A Kofi", //your business name
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
            var rzp1 = new window.Razorpay(options);
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
                theme="dark"
                transition={Bounce}
            />

            <div className="relative mb-12 sm:mb-16 md:mb-20">
                <div className="coverImage w-full h-32 sm:h-44 md:h-56 lg:h-72 bg-gray-500 overflow-hidden">
                    {/* Get the cover image url from the currentCreator */}
                    <img src={currentCreator.coverUrl} alt="cover image" className="w-full h-full object-cover" />
                </div>
                <span className="profileImage absolute w-20 sm:w-24 md:w-28 -bottom-10 sm:-bottom-12 left-1/2 -translate-x-1/2 overflow-hidden aspect-square rounded-full bg-gray-500 border-4 border-gray-950">
                    <img src={currentCreator.profileUrl} alt="profile image" className="w-full h-full object-cover object-center" />
                </span>
            </div>
            <div>
                <div className="flex flex-col gap-1 text-center py-6 sm:py-8 md:py-10 px-2 sm:px-4">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{username}</div>
                    <p className="text-xs sm:text-sm md:text-base px-2 sm:px-4 text-gray-300">exploring conceal topics and telling amazing stories</p>
                    <div className="text-xs sm:text-sm text-gray-400 mt-1"><span>934 members </span><span className="mx-1">•</span><span>105 Posts</span></div>
                </div>
                <div className="flex flex-col gap-2 sm:gap-3 justify-center items-center px-4">
                    <button className="bg-[#047cfc] hover:bg-[#1e84f1] px-5 py-2 sm:py-2.5 w-full max-w-xs sm:max-w-sm rounded-lg sm:rounded-xl cursor-pointer text-xs sm:text-sm md:text-base font-medium transition-all active:scale-95">Join for free</button>
                    <button className="bg-[#7377836a] hover:bg-[#858a996a] px-5 py-2 sm:py-2.5 w-full max-w-xs sm:max-w-sm rounded-lg sm:rounded-xl cursor-pointer text-xs sm:text-sm md:text-base font-medium transition-all active:scale-95">See membership options</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full px-4 sm:px-6 lg:px-10 my-8 sm:my-12 md:my-16">

                {/* Supporters Section */}

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 sm:p-6 lg:max-h-[450px] shadow-lg border border-gray-700">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 md:mb-6">Top Supporters</h2>
                    <ul className="space-y-2 sm:space-y-3 overflow-y-auto max-h-64 sm:max-h-80 md:max-h-96 custom-scrollbar pr-2">
                        {paymentReceived.map((supporter, index) => (
                            <li key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base">
                                <span className="text-gray-100 font-medium break-words">{supporter.from_user}</span>
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-semibold self-start sm:self-auto flex-shrink-0">₹{supporter.amount / 100}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Donation Form Section */}

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg lg:max-h-[350px] p-4 sm:p-6 shadow-lg border border-gray-700">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 md:mb-6">Support This Creator</h2>

                    <form className="space-y-3 sm:space-y-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Your Name</label>
                            <input onChange={handlechange} value={paymentform.name}
                                type="text"
                                name="name"
                                placeholder="Enter your name"
                                className="w-full px-3 sm:px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Donation Amount (₹)</label>
                            <input onChange={handlechange} value={paymentform.amount}
                                type="number"
                                name="amount"
                                placeholder="Enter amount"
                                min="1"
                                className="w-full px-3 sm:px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                            />
                        </div>
                        <div className="w-full flex justify-center items-center pt-2">
                            <button onClick={(e) => {
                                e.preventDefault();
                                pay(paymentform.amount * 100);
                            }}
                                type="button"
                                className="w-32 sm:w-36 bg-white hover:bg-[#F5F1E8] text-[#171717] text-sm sm:text-base font-semibold py-2 sm:py-2.5 rounded-lg transition-all duration-200 transform hover:scale-105"
                            >
                                Donate Now
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

// https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
export default PaymentPage