const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true }, // اسم العنصر
  description: { type: String },
  category: {
    type: String,
    enum: ['avatar', 'frame', 'effect', 'badge', 'background', 'other'],
    required: true,
  },
  imageUrl: { type: String }, // صورة العنصر
  price: { type: Number, required: true }, // السعر بالعملات الافتراضية
  isLimited: { type: Boolean, default: false }, // هل العنصر محدود
  availableCount: { type: Number }, // عدد النسخ المتاحة (إن وُجد)
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Item', itemSchema);
