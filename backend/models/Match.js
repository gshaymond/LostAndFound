const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  lostItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  foundItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0,
    required: true
  },
  status: {
    type: String,
    enum: ['suggested', 'contacted', 'confirmed', 'rejected'],
    default: 'suggested'
  },
  matchReasons: [{
    type: String,
    enum: ['text_similarity', 'location_proximity', 'category_match', 'date_correlation', 'image_similarity'],
    required: true
  }],
  metadata: {
    textSimilarity: Number,
    locationDistance: Number, // in meters
    categoryMatch: Boolean,
    dateDifference: Number, // in days
    imageSimilarity: Number
  },
  contactedAt: Date,
  confirmedAt: Date,
  rejectedAt: Date
}, {
  timestamps: true
});

// Compound index to ensure unique matches
matchSchema.index({ lostItemId: 1, foundItemId: 1 }, { unique: true });

// Index for efficient queries
matchSchema.index({ status: 1 });
matchSchema.index({ confidence: -1 });
matchSchema.index({ createdAt: -1 });

// Virtual for match age
matchSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to set timestamps based on status
matchSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case 'contacted':
        this.contactedAt = now;
        break;
      case 'confirmed':
        this.confirmedAt = now;
        break;
      case 'rejected':
        this.rejectedAt = now;
        break;
    }
  }
  next();
});

// Ensure virtual fields are serialized
matchSchema.set('toJSON', { virtuals: true });
matchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Match', matchSchema);