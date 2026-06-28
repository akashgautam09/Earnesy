import { NextResponse } from "next/server";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import Payment from "@/models/Payment";
import User from "@/models/User";
import mongoose from "mongoose";

export const POST = async (request) => {
    await mongoose.connect(process.env.MONGODB_URI)

    try {
        // Parse the form data from Razorpay webhook
        let body = await request.formData()
        body = Object.fromEntries(body)

        // Validate required fields
        if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
            console.error("Missing required fields from Razorpay webhook")
            return NextResponse.json({ error: "Missing required payment fields" }, { status: 400 })
        }

        // Finding payment details from db
        const paymentDetails = await Payment.findOne({ order_id: body.razorpay_order_id })
        if (!paymentDetails) {
            return NextResponse.json({ error: "Payment details not found" }, { status: 404 })
        }

        const user = await User.findOne({ username: paymentDetails.to_user })
        if (!user) {
            return NextResponse.json({ error: "Recipient user not found" }, { status: 404 })
        }
        // Verify the payment signature
        const isPaymentValid = validatePaymentVerification({
            "order_id": body.razorpay_order_id,
            "payment_id": body.razorpay_payment_id
        }, body.razorpay_signature, user.razorpaySecret)

        if (isPaymentValid) {
            // Update payment status to completed
            const updatedDetails = await Payment.findOneAndUpdate(
                { order_id: body.razorpay_order_id },
                { done: true, payment_id: body.razorpay_payment_id },
                { new: true }
            )

            if (!updatedDetails) {
                console.error(`Failed to update payment for order_id: ${body.razorpay_order_id}`)
                return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 })
            }

            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL}/${updatedDetails.to_user}?paymentdone=true`)
        }
        else {
            console.error(`Payment verification failed for order_id: ${body.razorpay_order_id}`)
            // Update payment status to failed
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL}/dashboard?paymentfailed=true`)
        }

    } catch (error) {
        console.error("Razorpay webhook error:", error.message)
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
    }
}