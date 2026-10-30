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
    required: true,
    maxlength: 120,
    default: '',
    trim: true,
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

export default mongoose.models.User || model("User", userSchema);