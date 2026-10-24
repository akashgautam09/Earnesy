import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
}, { timestamps: true })

likeSchema.index({ postId: 1, userId: 1 }, { unique: true })

export default mongoose.models.Like || mongoose.model('Like', likeSchema);