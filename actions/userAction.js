"use server"

import mongoose from "mongoose"
import Razorpay from "razorpay"
import User from "@/models/User"
import Payment from "@/models/Payment"
import Post from "@/models/Post"
import Like from "@/models/Like"
import { getCurrentUser } from "@/lib/auth/server"

export const initiate = async (amount, to_user, paymentform) => {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
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

        const keyId = user.razorpayId?.trim()
        const keySecret = user.razorpaySecret?.trim()

        if (!keyId || !keySecret) {
            return { error: 'This user has not connected Razorpay yet.' }
        }

        const instance = new Razorpay({
            key_id: keyId.trim(),
            key_secret: keySecret.trim(),
        })

        const options = {
            amount: amountInPaise,
            currency: "INR",
        }

        const x = await instance.orders.create(options)

        const supporterDiscordId = paymentform?.discordUserId?.trim() || currentUser.discordUserId || ''

        await Payment.create({
            from_user: paymentform.name.trim(),
            amount: amountInPaise,
            to_user: user.username,
            creator_id: user._id,
            order_id: x.id,
            supporter_discord_id: supporterDiscordId,
        })

        return x
    } catch (error) {
        console.error('Payment Error:', error)
        return { error: error.message || 'Payment failed. Please try again.' }
    }
}

// Return only safe public fields. Never return the Razorpay secret.
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

            return {
                id: user._id.toString(),
                name: user.name,
                username: user.username,
                title: user.title || '',
                bio: user.bio || '',
                profileUrl: user.profileUrl,
                coverUrl: user.coverUrl,
                razorpayId,
                paymentsEnabled: Boolean(razorpayId && razorpaySecret),
                hasDiscordRewards: Boolean(user.discordServerId && user.discordRoleId),
                discordInviteUrl: user.discordInviteUrl || '',
            }
        }
        return null
    } catch (error) {
        console.error('Fetch user page error:', error)
        throw error
    }
}

// Return completed payments from highest to lowest amount.
export const fetchPayments = async (username) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        const payments = await Payment.find({ to_user: username?.trim().toLowerCase(), done: true }).sort({ amount: -1 })
        return payments.map(payment => payment.toObject({ flattenObjectIds: true }))
    } catch (error) {
        console.error('Fetch user payments error:', error)
        throw error
    }
}

// Fetch published posts for the public creator profile
export const fetchUserPosts = async (username) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        const user = await User.findOne({ username: username?.trim().toLowerCase() }).select('_id').lean()
        if (!user) return []

        const currentUser = await getCurrentUser()
        const posts = await Post.find({ authorId: user._id, status: 'published' }).sort({ createdAt: -1 }).lean()
        const postIds = posts.map(p => p._id)

        let userLikesSet = new Set()
        if (currentUser) {
            const userLikes = await Like.find({ userId: currentUser._id, postId: { $in: postIds } }).select('postId').lean()
            userLikesSet = new Set(userLikes.map(l => l.postId.toString()))
        }

        return posts.map(post => ({
            id: post._id.toString(),
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl || null,
            likesCount: post.likesCount || 0,
            isLiked: userLikesSet.has(post._id.toString()),
            createdAt: post.createdAt ? post.createdAt.toISOString() : new Date().toISOString(),
        }))
    } catch (error) {
        console.error('Fetch user posts error:', error)
        return []
    }
}