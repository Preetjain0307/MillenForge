// NeuraMindss — User Mongoose Model
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: function () {
        return this.email ? this.email.split('@')[0] : 'NeuraMindss User';
      },
    },
    avatar: {
      type: String,
      default: '',
    },
    provider: {
      type: String,
      enum: ['email', 'google', 'hybrid'],
      default: 'email',
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Method to return safe public profile without sensitive internal fields
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    email: this.email,
    name: this.name,
    avatar: this.avatar,
    provider: this.provider,
    googleId: this.googleId || null,
    emailVerified: this.emailVerified,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    lastLoginAt: this.lastLoginAt,
  };
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
