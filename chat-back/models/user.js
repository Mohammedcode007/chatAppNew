

const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  acquiredAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // (اختياري) في حال العناصر مؤقتة
});

const userSchema = new mongoose.Schema({
  // معلومات المستخدم الأساسية
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // حالة المستخدم
  status: {
    type: String,
    enum: ['offline', 'online', 'busy'],
    default: 'offline',
  },

  // الأصدقاء وطلبات الصداقة
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sentFriendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  receivedFriendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // العملات داخل التطبيق
  coins: { type: Number, default: 0 },

  // العناصر التي يمتلكها المستخدم
  inventory: [inventoryItemSchema],

  // تخصيصات تجميلية
  selectedAvatar: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  selectedFrame: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  selectedEffect: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  selectedBackground: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },

  // اشتراك (اختياري)
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'silver', 'gold', 'vip'],
      default: 'free',
    },
    expiresAt: { type: Date },
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
