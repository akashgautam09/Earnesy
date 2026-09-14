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