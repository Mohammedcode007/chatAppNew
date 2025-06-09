const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  avatar: { type: String, default: '' },
  isPublic: { type: Boolean, default: true },
  password: { type: String, default: '' },
  tag: { type: String, default: '' },

  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  owners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  membersJoinedAt: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now }
  }],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // الرسائل كمصفوفة من مراجع Message
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GroupMessage' }],

  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupMessage', default: null },

  logs: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: String,
    timestamp: { type: Date, default: Date.now }
  }],

  inviteLink: { type: String, default: '' },

  pinMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupMessage', default: null },

  welcomeMessageText: {
    type: String,
    default: "مرحباً بك في المجموعة! نتمنى لك وقتاً ممتعاً معنا."
  },
  points: { type: Number, default: 0 },  // نقاط الغرفة التي ترتفع عند الضغط على "Post"


  welcomeMessageEnabled: { type: Boolean, default: true },
  autoDeleteMessagesAfterHours: { type: Number, default: 24 },

}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
