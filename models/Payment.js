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
    }
});

export default mongoose.models.Payment || model("Payment", paymentSchema);
