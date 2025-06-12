
const mongoose = require('mongoose');
const Item = require('../models/item');

const inventoryItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  quantity: { type: Number, default: 1 },
  acquiredAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  active: { type: Boolean, default: false },
});

const purchaseRecordSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  price: { type: Number, required: true },
  purchasedAt: { type: Date, default: Date.now },
  paymentMethod: { type: String, default: 'coins' },
});






const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  email: { type: String, unique: true, sparse: true, default: '' },
  phone: { type: String, sparse: true, default: '+201000000000' },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
  age: { type: Number, default: 18 },
  birthday: { type: Date, default: () => new Date('2000-01-01') },
  verified: { type: Boolean, default: false },  // حالة التحقق
avatarUrl: { type: String, default: '' },  // رابط الصورة الشخصية
coverUrl: { type: String, default: '' },   // رابط صورة الغلاف

  country: { type: String, default: 'Unknown' },
  views: { type: Number, default: 0 },
  messages: { type: Number, default: 0 },
  status: { type: String, enum: ['offline', 'online', 'busy'], default: 'offline' },

  friends: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sentFriendRequests: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  receivedFriendRequests: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
allowDirectGroupJoin: { type: Boolean, default: true },

  coins: { type: Number, default: 1500 },
  posts: { type: Number, default: 0 },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },

  inventory: { type: [inventoryItemSchema], default: [] },
  purchaseHistory: { type: [purchaseRecordSchema], default: [] },

  // التخصيصات التجميلية
  selectedAvatar: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
  selectedFrame: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
  selectedEffect: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
  selectedBackground: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },

  customUsernameColor: { type: String, default: 'black' },  // لون اسم المستخدم

  badge: { type: String, default: '' },

  subscription: {
    plan: { type: String, enum: ['free', 'silver', 'gold', 'vip'], default: 'free' },
    expiresAt: { type: Date, default: null },
  },
  favoriteGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],


  specialWelcomeMessage: { type: String, default: "مرحبا بك في التطبيق!" },  // رسالة ترحيب خاصة

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
