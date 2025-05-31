// const mongoose = require('mongoose');
// const Item = require('../models/item');

// const inventoryItemSchema = new mongoose.Schema({
//   itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
//   acquiredAt: { type: Date, default: Date.now },
//   expiresAt: { type: Date }, // (اختياري)
// });

// const userSchema = new mongoose.Schema({
//   // معلومات المستخدم الأساسية
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true, select: false }, // إخفاؤها من النتائج افتراضيًا
//   email: { type: String, unique: true, sparse: true, default: '' },
//   phone: { type: String, sparse: true, default: '+201000000000' },
//   gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
//   age: { type: Number, default: 18 },
//   birthday: { type: Date, default: () => new Date('2000-01-01') },
//   verified: { type: Boolean, default: true },

//   country: { type: String, default: 'Unknown' },
//   views: { type: Number, default: 0 },
//   messages: { type: Number, default: 0 },

//   // حالة المستخدم
//   status: {
//     type: String,
//     enum: ['offline', 'online', 'busy'],
//     default: 'offline',
//   },

//   // الأصدقاء وطلبات الصداقة
//   friends: {
//     type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//     default: [],
//   },
//   blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

//   sentFriendRequests: {
//     type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//     default: [],
//   },
//   receivedFriendRequests: {
//     type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//     default: [],
//   },

//   // العملات داخل التطبيق
//   coins: { type: Number, default: 1500 },

//   // المنشورات والمتابعين
//   posts: { type: Number, default: 0 },
//   followers: { type: Number, default: 0 },
//   following: { type: Number, default: 0 },

//   // العناصر التي يمتلكها المستخدم
//   inventory: {
//     type: [inventoryItemSchema],
//     default: [],
//   },

//   // تخصيصات تجميلية
//   selectedAvatar: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
//   selectedFrame: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
//   selectedEffect: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
//   selectedBackground: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },

//   // الاشتراك
//   subscription: {
//     plan: {
//       type: String,
//       enum: ['free', 'silver', 'gold', 'vip'],
//       default: 'free',
//     },
//     expiresAt: { type: Date, default: null },
//   },

//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('User', userSchema);

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

const badgeSchema = new mongoose.Schema({
  badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  acquiredAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: false },
});

const activeCustomBadgeSchema = new mongoose.Schema({
  badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', default: null },
  activatedAt: { type: Date, default: null },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  email: { type: String, unique: true, sparse: true, default: '' },
  phone: { type: String, sparse: true, default: '+201000000000' },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
  age: { type: Number, default: 18 },
  birthday: { type: Date, default: () => new Date('2000-01-01') },
  verified: { type: Boolean, default: true },  // حالة التحقق

  country: { type: String, default: 'Unknown' },
  views: { type: Number, default: 0 },
  messages: { type: Number, default: 0 },
  status: { type: String, enum: ['offline', 'online', 'busy'], default: 'offline' },

  friends: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sentFriendRequests: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  receivedFriendRequests: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },

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

  badges: { type: [badgeSchema], default: [] },

  activeCustomBadge: { type: activeCustomBadgeSchema, default: {} }, // الشارة المفعلة المخصصة

  subscription: {
    plan: { type: String, enum: ['free', 'silver', 'gold', 'vip'], default: 'free' },
    expiresAt: { type: Date, default: null },
  },

  specialWelcomeMessage: { type: String, default: "مرحبا بك في التطبيق!" },  // رسالة ترحيب خاصة

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
