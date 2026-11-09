import mongoose from "mongoose";
import { encrypt, decrypt } from "@/utils/encryption";

const { Schema, model } = mongoose;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-z0-9_-]+$/,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  title: {
    type: String,
    maxlength: 120,
    default: '',
    trim: true,
  },
  category: {
    type: String,
    default: '',
    trim: true,
    maxlength: 40,
    index: true,
  },
  bio: {
    type: String,
    maxlength: 1000,
    trim: true,
    default: '',
  },
  coverUrl:{
    type: String,
  },
  profileUrl:{
    type: String,
  },
  razorpayId:{
    type: String,
    // Store encrypted in database
    set: (value) => value ? encrypt(value) : value,
    get: (value) => value ? decrypt(value) : value,
  },
  razorpaySecret:{
    type: String,
    // Store encrypted in database
    set: (value) => value ? encrypt(value) : value,
    get: (value) => value ? decrypt(value) : value,
  },
  payoutMethod: {
    type: String,
    enum: ['upi', 'bank'],
    default: 'upi',
  },
  payoutUpiId: {
    type: String,
    trim: true,
    default: '',
  },
  payoutAccountName: {
    type: String,
    trim: true,
    default: '',
  },
  payoutAccountNumber: {
    type: String,
    trim: true,
    default: '',
  },
  payoutIfsc: {
    type: String,
    trim: true,
    default: '',
  },
  discordServerId: {
    type: String,
    trim: true,
    default: '',
  },
  discordRoleId: {
    type: String,
    trim: true,
    default: '',
  },
  discordInviteUrl: {
    type: String,
    trim: true,
    default: '',
  },
  discordUserId: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Production indexes for Explore directory and sorting
userSchema.index({ createdAt: -1 });
userSchema.index({ category: 1, createdAt: -1 });

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.User
}

export default mongoose.models.User || model("User", userSchema);