const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  price: { type: Number, required: true },
  purchasedAt: { type: Date, default: Date.now },
  paymentMethod: {
    type: String,
    enum: ['coins', 'gift', 'admin', 'free'],
    default: 'coins',
  },
});

module.exports = mongoose.model('Purchase', purchaseSchema);
