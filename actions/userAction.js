"use server"

import mongoose from "mongoose"
import Razorpay from "razorpay"
import User from "@/models/User"
import Payment from "@/models/Payment"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export const initiate = async (amount, to_user, paymentform) => {
    try {
        // Server actions can be called directly, so validate everything here.
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { error: 'Please log in before making a payment.' }
        }

        const amountInPaise = Number(amount)
        if (!Number.isInteger(amountInPaise) || amountInPaise < 100 || amountInPaise > 100000000) {
            return { error: 'Payment amount must be between ₹1 and ₹1,000,000.' }
        }

        if (!paymentform?.name?.trim()) {
            return { error: 'Your name is required.' }
        }

        await mongoose.connect(process.env.MONGODB_URI)
        const user = await User.findOne({ username: to_user?.trim().toLowerCase() })
        if (!user) {
            return { error: 'Recipient user not found.' }
        }
        // Mongoose getters decrypt these values on the server only.
        const keyId = user.razorpayId?.trim()
        const keySecret = user.razorpaySecret?.trim()


        if (!keyId || !keySecret) {
            return { error: 'This user has not connected Razorpay yet.' }
        }

        var instance = new Razorpay({
            key_id: keyId.trim(),
            key_secret: keySecret.trim()
        })

        const options = {
            amount: amountInPaise,
            currency: "INR",
        }

        let x = await instance.orders.create(options)

        await Payment.create({
            from_user: paymentform.name.trim(),
            amount: amountInPaise,
            to_user: user.username,
            creator_id: user._id,
            order_id: x.id
        })

        return x
    } catch (error) {
        console.error('Payment Error:', error);
        return { error: error.message || 'Payment failed. Please try again.' }
    }
}

// Return only public fields. Never return the Razorpay secret.
export const fetchUserPage = async (username) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        const user = await User.findOne({ username: username?.trim().toLowerCase() })
        if (user) {
            let razorpayId = ''
            let razorpaySecret = ''

            try {
                razorpayId = user.razorpayId?.trim() || ''
                razorpaySecret = user.razorpaySecret?.trim() || ''
            } catch (error) {
                console.error('Payment credentials could not be read')
            }

            // Public pages need only this safe payment capability flag.
            return {
                id: user._id.toString(),
                name: user.name,
                username: user.username,
                profileUrl: user.profileUrl,
                coverUrl: user.coverUrl,
                razorpayId,
                paymentsEnabled: Boolean(razorpayId && razorpaySecret),
            }
        }
        return null
    } catch (error) {
        console.error('Fetch user page error:', error);
        throw error;
    }
}

// Return completed payments from highest to lowest amount.
export const fetchPayments = async (username) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        const payments = await Payment.find({ to_user: username?.trim().toLowerCase(), done: true }).sort({ amount: -1 })
        return payments.map(payment => payment.toObject({ flattenObjectIds: true }))
    } catch (error) {
        console.error('Fetch user payments error:', error);
        throw error;
    }
}