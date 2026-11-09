"use server"

import mongoose from "mongoose"
import Razorpay from "razorpay"
import User from "@/models/User"
import Payment from "@/models/Payment"
import Post from "@/models/Post"
import Like from "@/models/Like"
import Tier from "@/models/Tier"
import { getPlatformSettings } from "@/models/PlatformSettings"
import { getCurrentUser } from "@/lib/auth/server"

const ensureDb = async () => {
    if (mongoose.connection.readyState !== 1) {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined')
        }
        await mongoose.connect(process.env.MONGODB_URI)
    }
}

export const initiate = async (amount, to_user, paymentform) => {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            return { error: 'Please log in before making a payment.' }
        }

        if (!paymentform?.name?.trim()) {
            return { error: 'Your name is required.' }
        }

        await ensureDb()

        // Emergency Maintenance Mode check
        const settings = await getPlatformSettings()
        if (settings?.maintenanceMode) {
            return { error: 'Platform checkouts are temporarily paused for scheduled maintenance. Please try again shortly.' }
        }

        // Resolve the actual page owner/creator strictly from the target username
        const recipientCreator = await User.findOne({ username: to_user?.trim().toLowerCase() })
        if (!recipientCreator) {
            return { error: 'Recipient creator not found.' }
        }

        // Account moderation check
        if (recipientCreator.status === 'suspended') {
            return { error: 'This creator account is currently suspended. Contributions are temporarily paused.' }
        }
        if (recipientCreator.canAcceptTips === false) {
            return { error: 'This creator is currently not accepting contributions.' }
        }

        // Prevent self-payment (creator paying themselves or purchasing own tier)
        if (
            currentUser._id.toString() === recipientCreator._id.toString() ||
            currentUser.username?.toLowerCase() === recipientCreator.username?.toLowerCase() ||
            currentUser.email?.toLowerCase() === recipientCreator.email?.toLowerCase()
        ) {
            return { error: 'You cannot pay yourself or purchase your own membership tier.' }
        }

        // Creator-specific credential resolution — NEVER use supporter credentials,
        // NEVER use another creator's credentials, and NEVER fall back to global environment.
        let creatorKeyId = ''
        let creatorKeySecret = ''
        try {
            creatorKeyId = recipientCreator.razorpayId?.trim() || ''
            creatorKeySecret = recipientCreator.razorpaySecret?.trim() || ''
        } catch (decryptErr) {
            console.error('Error decrypting creator credentials:', decryptErr)
            return { error: 'This creator has not configured their payment gateway yet. Payments are currently unavailable.' }
        }

        if (!creatorKeyId || !creatorKeySecret) {
            return { error: 'This creator has not configured their payment gateway yet. Payments are currently unavailable.' }
        }

        let amountInPaise = Number(amount)
        let tierId = null
        let tierTitle = ''
        let tierRoleId = ''

        // Server-side validation for membership tiers: NEVER trust client price or role IDs
        if (paymentform?.tierId) {
            if (!mongoose.Types.ObjectId.isValid(paymentform.tierId)) {
                return { error: 'Invalid membership tier.' }
            }

            const tier = await Tier.findOne({
                _id: paymentform.tierId,
                creatorId: recipientCreator._id,
                isActive: true,
            })

            if (!tier) {
                return { error: 'Selected membership tier is not available or does not belong to this creator.' }
            }

            // Enforce price and tier details strictly from the database
            amountInPaise = Math.round(Number(tier.price) * 100)
            tierId = tier._id
            tierTitle = tier.title || ''
            tierRoleId = tier.discordRoleId || ''
        } else {
            // Validate standard donation/tip amount (₹1 to ₹1,000,000)
            if (!Number.isInteger(amountInPaise) || amountInPaise < 100 || amountInPaise > 100000000) {
                return { error: 'Payment amount must be between ₹1 and ₹1,000,000.' }
            }
        }

        // Platform Fee Calculation (integer paise): use creator's customPlatformFee if set, else global platform fee
        const globalFee = settings?.globalFeePercentage ?? 2
        const feePercentage = typeof recipientCreator.customPlatformFee === 'number' && recipientCreator.customPlatformFee >= 0
            ? recipientCreator.customPlatformFee
            : globalFee
        const platformFee = Math.round(amountInPaise * (feePercentage / 100))
        const creatorAmount = amountInPaise - platformFee

        // Initialize Razorpay SDK strictly with the target creator's credentials
        const instance = new Razorpay({
            key_id: creatorKeyId,
            key_secret: creatorKeySecret,
        })

        const options = {
            amount: amountInPaise,
            currency: "INR",
        }

        const x = await instance.orders.create(options)

        const supporterDiscordId = paymentform?.discordUserId?.trim() || currentUser.discordUserId || ''

        await Payment.create({
            supporter_id: currentUser._id,
            from_user: paymentform.name.trim(),
            amount: amountInPaise,
            platformFee,
            creatorAmount,
            feePercentage,
            payoutStatus: 'unpaid',
            to_user: recipientCreator.username,
            creator_id: recipientCreator._id,
            order_id: x.id,
            supporter_discord_id: supporterDiscordId,
            tier_id: tierId,
            tier_title: tierTitle,
            tier_role_id: tierRoleId,
        })

        // Send ONLY public Key ID and order info to client. Secret is kept exclusively on backend.
        return {
            id: x.id,
            keyId: creatorKeyId,
            amount: x.amount,
            currency: x.currency,
        }
    } catch (error) {
        console.error('Payment Error:', error)
        return { error: error.message || 'Payment failed. Please try again.' }
    }
}

// Return only safe public fields. Never return Razorpay secrets or credentials.
export const fetchUserPage = async (username) => {
    try {
        await ensureDb()
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

            const currentUser = await getCurrentUser().catch(() => null)
            const isOwner = Boolean(
                currentUser &&
                (currentUser._id?.toString() === user._id?.toString() ||
                 currentUser.username?.toLowerCase() === user.username?.toLowerCase() ||
                 currentUser.email?.toLowerCase() === user.email?.toLowerCase())
            )

            // Payments are enabled ONLY if creator has valid gateway AND is active AND can accept tips
            const isSuspended = user.status === 'suspended'
            const canAcceptTips = user.canAcceptTips !== false
            const hasGateway = Boolean(razorpayId && razorpaySecret)
            const paymentsEnabled = Boolean(hasGateway && !isSuspended && canAcceptTips)

            return {
                id: user._id.toString(),
                name: user.name,
                username: user.username,
                title: user.title || '',
                category: user.category || '',
                bio: user.bio || '',
                profileUrl: user.profileUrl,
                coverUrl: user.coverUrl,
                paymentsEnabled,
                hasGateway,
                isSuspended,
                canAcceptTips,
                payoutUpiId: user.payoutUpiId || '',
                payoutMethod: user.payoutMethod || 'upi',
                hasDiscordRewards: Boolean(user.discordServerId && user.discordRoleId),
                discordInviteUrl: user.discordInviteUrl || '',
                isOwner,
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
        await ensureDb()
        const payments = await Payment.find({ to_user: username?.trim().toLowerCase(), done: true }).sort({ amount: -1 })
        return payments.map(payment => payment.toObject({ flattenObjectIds: true }))
    } catch (error) {
        console.error('Fetch user payments error:', error)
        throw error
    }
}

// Fetch published posts for the public creator profile with access control
export const fetchUserPosts = async (username) => {
    try {
        await ensureDb()
        const user = await User.findOne({ username: username?.trim().toLowerCase() }).select('_id username').lean()
        if (!user) return []

        const currentUser = await getCurrentUser()
        const posts = await Post.find({ authorId: user._id, status: 'published' }).sort({ createdAt: -1 }).lean()
        const postIds = posts.map(p => p._id)

        let userLikesSet = new Set()
        let isAuthor = false
        let isMember = false

        if (currentUser) {
            isAuthor = currentUser._id.toString() === user._id.toString()
            const [userLikes, memberPayment] = await Promise.all([
                Like.find({ userId: currentUser._id, postId: { $in: postIds } }).select('postId').lean(),
                Payment.exists({
                    creator_id: user._id,
                    done: true,
                    $or: [
                        { supporter_id: currentUser._id },
                        { from_user: currentUser.name },
                        { from_user: currentUser.username }
                    ]
                })
            ])
            userLikesSet = new Set(userLikes.map(l => l.postId.toString()))
            isMember = Boolean(memberPayment)
        }

        return posts.map(post => {
            const isMembersOnly = post.visibility === 'members'
            const hasAccess = !isMembersOnly || isAuthor || isMember

            return {
                id: post._id.toString(),
                title: post.title,
                content: hasAccess ? post.content : (post.content ? post.content.slice(0, 100) + '...' : ''),
                imageUrl: hasAccess ? (post.imageUrl || null) : null,
                likesCount: post.likesCount || 0,
                commentsCount: post.commentsCount || 0,
                isLiked: userLikesSet.has(post._id.toString()),
                visibility: post.visibility || 'public',
                isLocked: !hasAccess,
                createdAt: post.createdAt ? post.createdAt.toISOString() : new Date().toISOString(),
            }
        })
    } catch (error) {
        console.error('Fetch user posts error:', error)
        return []
    }
}

// Fetch active tiers for the public creator profile
export const fetchUserTiers = async (username) => {
    try {
        await ensureDb()
        const user = await User.findOne({ username: username?.trim().toLowerCase() }).select('_id').lean()
        if (!user) return []

        const tiers = await Tier.find({ creatorId: user._id, isActive: true }).sort({ price: 1, order: 1 }).lean()
        return tiers.map(t => ({
            id: t._id.toString(),
            title: t.title,
            price: t.price,
            description: t.description || '',
            perks: t.perks || [],
            discordPerk: Boolean(t.discordPerk),
            discordRoleId: t.discordRoleId || '',
        }))
    } catch (error) {
        console.error('Fetch user tiers error:', error)
        return []
    }
}
