const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  query: { type: Object, required: true }
}, { timestamps: true });

module.exports = mongoose.model('SavedSearch', savedSearchSchema);