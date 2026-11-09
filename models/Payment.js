import mongoose from "mongoose";
import { Schema, model } from "mongoose";

// payment details
const paymentSchema = new mongoose.Schema({
    creator_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    supporter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    from_user: {
        type: String,
        required: true
    },
    to_user: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    order_id: {
        type: String,
        required: true
    },
    payment_id: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    done: {
        type: Boolean,
        default: false,
    },
    supporter_discord_id: {
        type: String,
        trim: true,
        default: '',
    },
    discordRoleAssigned: {
        type: Boolean,
        default: false,
    },
    tier_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tier",
    },
    tier_title: {
        type: String,
        trim: true,
        default: '',
    },
    tier_role_id: {
        type: String,
        trim: true,
        default: '',
    },
    platformFee: {
        type: Number,
        default: 0, // in paise (2% cut)
    },
    creatorAmount: {
        type: Number,
        default: 0, // in paise (98% net creator earning)
    },
    feePercentage: {
        type: Number,
        default: 2, // 2%
    },
    payoutStatus: {
        type: String,
        enum: ['unpaid', 'requested', 'paid'],
        default: 'unpaid',
        index: true,
    },
    payoutRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayoutRequest',
        default: null,
    },
    paidAt: {
        type: Date,
        default: null,
    }
});

// Production indexes for high-frequency queries and leaderboards
paymentSchema.index({ to_user: 1, done: 1, createdAt: -1 });
paymentSchema.index({ to_user: 1, done: 1, amount: -1 });
paymentSchema.index({ creator_id: 1, done: 1 });
paymentSchema.index({ supporter_id: 1, done: 1 });
paymentSchema.index({ order_id: 1 });

if (process.env.NODE_ENV !== 'production') {
    delete mongoose.models.Payment;
}

export default mongoose.models.Payment || model("Payment", paymentSchema);
