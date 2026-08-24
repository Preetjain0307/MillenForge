// NeuraMinds — OTP Storage Mongoose Model
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    lastRequestedAt: {
      type: Date,
      default: Date.now,
    },
    used: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

// TTL index to automatically clean up expired OTP records after 1 hour
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

const Otp = mongoose.models.Otp || mongoose.model('Otp', otpSchema);

module.exports = Otp;
