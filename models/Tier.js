import mongoose from "mongoose";

const { Schema, model } = mongoose;

const tierSchema = new Schema(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 1,
    },
    perks: {
      type: [String],
      default: [],
    },
    discordPerk: {
      type: Boolean,
      default: false,
    },
    discordRoleId: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Production index for active creator tiers in priority order
tierSchema.index({ creatorId: 1, isActive: 1, order: 1 });

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.Tier;
}

export default mongoose.models.Tier || model("Tier", tierSchema);

