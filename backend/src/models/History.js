// NeuraMinds — Generation History Mongoose Model
// Minimal schema for persisting UI generation history records.

const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    generationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    pageName: {
      type: String,
      default: 'Home',
      trim: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success',
    },
    wireframe: {
      filename: { type: String },
      originalName: { type: String },
    },
    page: {
      type: mongoose.Schema.Types.Mixed,
    },
    meta: {
      executionTimeMs: { type: Number },
    },
    userId: {
      type: String,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Prevent re-compilation model errors in dev/testing environments
const History = mongoose.models.History || mongoose.model('History', historySchema);

module.exports = History;
