const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  messageType: {
    type: String,
    enum: ['text', 'image', 'system'],
    default: 'text'
  },
  metadata: {
    imageUrl: String,
    systemMessageType: {
      type: String,
      enum: ['match_suggested', 'item_claimed', 'item_returned']
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ matchId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ read: 1 });

// Pre-save middleware to set readAt when read status changes
messageSchema.pre('save', function(next) {
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Static method to mark messages as read
messageSchema.statics.markAsRead = function(matchId, userId) {
  return this.updateMany(
    { matchId, receiverId: userId, read: false },
    { read: true, readAt: new Date() }
  );
};

// Virtual for message age
messageSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
});

// Ensure virtual fields are serialized
messageSchema.set('toJSON', { virtuals: true });
messageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Message', messageSchema);