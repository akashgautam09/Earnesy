import mongoose from "mongoose";
import { Schema, model } from "mongoose";
// payment details
const paymentSchema = new mongoose.Schema({
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
    createdAt: {
        type: Date,
        default: Date.now
    },done: {
        type: Boolean,
        default: false
    }
});

export default mongoose.models.Payment || model("Payment", paymentSchema);