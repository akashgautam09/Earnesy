"use server"

import mongoose from "mongoose"
import Razorpay from "razorpay"
import User from "@/models/User"
import Payment from "@/models/Payment"

export const initiate = async (amount, to_user, paymentform) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;


        if (!keyId || !keySecret) {
            console.error('Missing Razorpay keys:', { 
                keyId: keyId || 'UNDEFINED', 
                keySecret: keySecret ? 'SET' : 'UNDEFINED' 
            });
            throw new Error('Razorpay API keys not configured. Check .env.local file.');
        }

        var instance = new Razorpay({ 
            key_id: keyId, 
            key_secret: keySecret 
        })

        const options = {
            amount: Number.parseInt(amount),
            currency: "INR",
        }

        let x = await instance.orders.create(options)

        await Payment.create({
            from_user: paymentform.name,
            amount: amount,
            to_user: to_user,
            order_id: x.id
        })

        return x
    } catch (error) {
        console.error('Payment Error:', error);
        throw error;
    }
}