const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
  pageId: {
    type: String,
    required: true,
    index: true
  },
  version: {
    type: Number,
    required: true,
    default: 1
  },
  pageState: {
    type: Object,
    required: true
  },
  changeSummary: {
    type: String,
    default: 'Initial version'
  }
}, { timestamps: true });

// Ensure version number is unique per page
VersionSchema.index({ pageId: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('Version', VersionSchema);
