const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'clothing', 'accessories', 'documents', 'keys', 'bags', 'pets', 'other'],
    default: 'other'
  },
  images: [{
    type: String, // URLs to images
    trim: true
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: {
      type: String,
      trim: true
    },
    city: String,
    state: String,
    country: String
  },
  locationDescription: {
    type: String,
    trim: true,
    maxlength: 200
  },
  dateFound: {
    type: Date,
    required: function() {
      return this.type === 'found';
    }
  },
  dateLost: {
    type: Date,
    required: function() {
      return this.type === 'lost';
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'expired'],
    default: 'active'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  contactInfo: {
    phone: String,
    email: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
itemSchema.index({ location: '2dsphere' });
itemSchema.index({ category: 1 });
itemSchema.index({ status: 1 });
itemSchema.index({ type: 1 });
itemSchema.index({ userId: 1 });
itemSchema.index({ title: 'text', description: 'text' }); // Text search index

// Virtual for item's age in days
itemSchema.virtual('ageInDays').get(function() {
  const referenceDate = this.type === 'lost' ? this.dateLost : this.dateFound;
  if (!referenceDate) return 0;
  return Math.floor((Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Item', itemSchema);