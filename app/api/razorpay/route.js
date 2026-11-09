import { NextResponse } from "next/server";
import { validatePaymentVerification, validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import Payment from "@/models/Payment";
import User from "@/models/User";
import Notification from "@/models/Notification";
import mongoose from "mongoose";
import { assignDiscordRole } from "@/lib/discord";

export const POST = async (request) => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not configured")
        }

        await mongoose.connect(process.env.MONGODB_URI)
        const applicationUrl = (process.env.NEXT_PUBLIC_URL || new URL(request.url).origin).replace(/\/$/, "")

        const contentType = request.headers.get("content-type") || ""
        let orderId = ""
        let paymentId = ""
        let signature = ""
        let isJson = false
        let isWebhookEvent = false
        let rawBodyText = ""

        if (contentType.includes("application/json")) {
            isJson = true
            rawBodyText = await request.text()
            let parsedBody = {}
            try {
                parsedBody = JSON.parse(rawBodyText)
            } catch {
                return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
            }

            const webhookSignature = request.headers.get("x-razorpay-signature")
            if (webhookSignature && parsedBody.event && parsedBody.payload) {
                isWebhookEvent = true
                signature = webhookSignature
                orderId = parsedBody.payload?.payment?.entity?.order_id || parsedBody.payload?.order?.entity?.id || ""
                paymentId = parsedBody.payload?.payment?.entity?.id || ""
            } else {
                orderId = parsedBody.razorpay_order_id || ""
                paymentId = parsedBody.razorpay_payment_id || ""
                signature = parsedBody.razorpay_signature || ""
            }
        } else {
            const formData = await request.formData()
            const formObj = Object.fromEntries(formData)
            orderId = formObj.razorpay_order_id || ""
            paymentId = formObj.razorpay_payment_id || ""
            signature = formObj.razorpay_signature || ""
        }

        // Validate required fields
        if (!orderId || !paymentId || !signature) {
            console.error("Missing required payment verification fields")
            return isJson
                ? NextResponse.json({ error: "Missing required payment fields" }, { status: 400 })
                : NextResponse.redirect(`${applicationUrl}/dashboard?paymentfailed=true`)
        }

        // Find payment details from DB
        const paymentDetails = await Payment.findOne({ order_id: orderId })
        if (!paymentDetails) {
            console.error(`Payment record not found for order_id: ${orderId}`)
            return isJson
                ? NextResponse.json({ error: "Payment details not found" }, { status: 404 })
                : NextResponse.redirect(`${applicationUrl}/dashboard?paymentfailed=true`)
        }

        // Idempotency check: prevent duplicate payment processing
        if (paymentDetails.done) {
            if (isJson) {
                return NextResponse.json({ success: true, message: "Payment has already been processed" })
            }
            return NextResponse.redirect(`${applicationUrl}/${encodeURIComponent(paymentDetails.to_user)}?paymentdone=true`)
        }

        // Retrieve the recipient creator's account to obtain THEIR specific Razorpay secret.
        // Never use another creator's secret or global fallback.
        const creator = paymentDetails.creator_id
            ? await User.findById(paymentDetails.creator_id)
            : await User.findOne({ username: paymentDetails.to_user })

        if (!creator) {
            console.error(`Recipient creator not found for payment ${orderId}`)
            return isJson
                ? NextResponse.json({ error: "Recipient creator not found" }, { status: 404 })
                : NextResponse.redirect(`${applicationUrl}/dashboard?paymentfailed=true`)
        }

        let creatorSecret = ""
        try {
            creatorSecret = creator.razorpaySecret?.trim() || ""
        } catch (decryptErr) {
            console.error("Error decrypting creator secret for verification:", decryptErr)
        }

        if (!creatorSecret) {
            console.error(`Creator credentials missing for payment verification (order: ${orderId})`)
            return isJson
                ? NextResponse.json({ error: "Creator payment configuration missing" }, { status: 400 })
                : NextResponse.redirect(`${applicationUrl}/dashboard?paymentfailed=true`)
        }

        // Verify signature strictly with this creator's secret
        let isPaymentValid = false
        try {
            if (isWebhookEvent) {
                const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || creatorSecret
                isPaymentValid = validateWebhookSignature(rawBodyText, signature, webhookSecret)
            } else {
                isPaymentValid = validatePaymentVerification(
                    {
                        order_id: orderId,
                        payment_id: paymentId,
                    },
                    signature,
                    creatorSecret
                )
            }
        } catch (verifyError) {
            console.error("Signature verification error:", verifyError.message)
            isPaymentValid = false
        }

        if (isPaymentValid) {
            const platformFee = paymentDetails.platformFee || Math.round((paymentDetails.amount || 0) * 0.02)
            const creatorAmount = paymentDetails.creatorAmount || ((paymentDetails.amount || 0) - platformFee)

            // Atomic update: only update if done is still false (prevents duplicate fulfillment under concurrency)
            const updatedDetails = await Payment.findOneAndUpdate(
                { order_id: orderId, done: false },
                {
                    $set: {
                        done: true,
                        payment_id: paymentId,
                        platformFee,
                        creatorAmount,
                    }
                },
                { new: true }
            )

            // If another concurrent request already marked it done, handle gracefully
            if (!updatedDetails) {
                if (isJson) {
                    return NextResponse.json({ success: true, message: "Payment already processed" })
                }
                return NextResponse.redirect(`${applicationUrl}/${encodeURIComponent(paymentDetails.to_user)}?paymentdone=true`)
            }

            // Assign Discord VIP Role if creator has Discord configured
            let discordStatus = ''
            const roleToAssign = updatedDetails.tier_role_id || creator.discordRoleId
            if (creator.discordServerId && roleToAssign && updatedDetails.supporter_discord_id) {
                try {
                    const discordResult = await assignDiscordRole({
                        guildId: creator.discordServerId,
                        roleId: roleToAssign,
                        userId: updatedDetails.supporter_discord_id,
                    })

                    if (discordResult.success) {
                        await Payment.updateOne({ _id: updatedDetails._id }, { discordRoleAssigned: true })
                        discordStatus = '&discordrole=assigned'
                    } else if (discordResult.memberNotFound) {
                        discordStatus = '&discordrole=not_in_server'
                    }
                } catch (discordErr) {
                    console.error('Discord role assignment error:', discordErr)
                }
            }

            // Trigger in-app notification for the creator
            try {
                const isTier = Boolean(updatedDetails.tier_title || updatedDetails.tier_id)
                const amountFormatted = `₹${Math.round((updatedDetails.amount || 0) / 100)}`
                await Notification.create({
                    userId: creator._id,
                    type: isTier ? 'membership' : 'coffee',
                    fromName: updatedDetails.from_user || 'Supporter',
                    title: isTier ? `New Member: ${updatedDetails.tier_title}!` : 'New Coffee Tip!',
                    message: isTier
                        ? `${updatedDetails.from_user} joined ${updatedDetails.tier_title} (${amountFormatted})`
                        : `${updatedDetails.from_user} sent you a ${amountFormatted} coffee tip!`,
                    link: isTier ? '/memberships?tab=members' : '/payouts',
                })
            } catch (notifErr) {
                console.error('Failed to create payment notification:', notifErr)
            }

            if (isJson) {
                return NextResponse.json({ success: true, message: "Payment verified and recorded successfully" })
            }

            const tierQuery = updatedDetails.tier_title ? `&tier=${encodeURIComponent(updatedDetails.tier_title)}` : ''
            return NextResponse.redirect(`${applicationUrl}/${encodeURIComponent(updatedDetails.to_user)}?paymentdone=true${discordStatus}${tierQuery}`)
        } else {
            console.error(`Payment verification failed for order_id: ${orderId}`)
            if (isJson) {
                return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
            }
            return NextResponse.redirect(`${applicationUrl}/dashboard?paymentfailed=true`)
        }

    } catch (error) {
        console.error("Razorpay processing error:", error.message)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
