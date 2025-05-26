const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['avatar', 'frame', 'effect', 'badge', 'background', 'other'],
    required: true,
  },
  imageUrl: { type: String },
  price: { type: Number, required: true },
  isLimited: { type: Boolean, default: false },
  availableCount: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Item', itemSchema);
