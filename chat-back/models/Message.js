// const mongoose = require('mongoose');

// const messageSchema = new mongoose.Schema({
//   sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   text: { type: String, required: true },
//   timestamp: { type: Date, default: Date.now },
//   status: {
//     type: String,
//     enum: ['sent', 'delivered', 'received', 'seen'],
//     default: 'sent'
//   },
//   isBlocked: { type: Boolean, default: false }
// });
// module.exports = mongoose.model('Message', messageSchema);

const mongoose = require('mongoose');

const mediaExtensions = {
  image: /\.(jpg|jpeg|png|gif|webp)$/i,
  video: /\.(mp4|mov|avi|mkv|webm)$/i,
  sound: /\.(mp3|wav|ogg|aac)$/i,
  gif: /\.(gif)$/i  // يمكن ترك gif كنوع مستقل أو ضمن الصور حسب التصميم العام
};

const messageSchema = new mongoose.Schema({
  // sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return this.senderType === 'user'; // مطلوب فقط لو المرسل مستخدم
    }
  },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messageType: {
    type: String,
    enum: ['text', 'image', 'sound', 'video', 'gif'],
    default: 'text',
    required: true
  },
    senderType: {
    type: String,
    enum: ['user', 'system'],
    default: 'user',
    required: false  // ✅ مطلوب لتحديد نوع المُرسل
  },
  text: {
    type: String,
    required: true,
    validate: {
      validator: function(value) { // استخدام function عادية وليس arrow function
        const urlRegex = /^(https?:\/\/[^\s]+)$/i;

        switch (this.messageType) {
          case 'text':
            return typeof value === 'string' && value.trim().length > 0;
          case 'image':
          case 'video':
          case 'sound':
          case 'gif':
            return (
              urlRegex.test(value) &&
              mediaExtensions[this.messageType].test(value)
            );
          default:
            return false;
        }
      },
      message: function() {
        return `Invalid 'text' value for messageType '${this.messageType}'. It must be a valid ${this.messageType} URL.`;
      }
    }
  },
  timestamp: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'received', 'seen'],
    default: 'sent'
  },
  isBlocked: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema);
