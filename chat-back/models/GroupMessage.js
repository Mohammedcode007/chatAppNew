const mongoose = require('mongoose');

const mediaExtensions = {
  image: /\.(jpg|jpeg|png|gif|webp)$/i,
  video: /\.(mp4|mov|avi|mkv|webm)$/i,
  audio: /\.(mp3|wav|ogg|aac)$/i,
  gif: /\.(gif)$/i
};

const groupMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return this.senderType === 'user';
    }
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'audio', 'video', 'gif'],
    default: 'text',
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'system'],
    default: 'user',
    required: true
  },
  text: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        const urlRegex = /^(https?:\/\/[^\s]+)$/i;

        switch (this.messageType) {
          case 'text':
          case 'gif':

            return typeof value === 'string' && value.trim().length > 0;
          case 'image':
          case 'video':
          case 'audio':
            // case 'gif':
            return (
              urlRegex.test(value) &&
              mediaExtensions[this.messageType].test(value)
            );
          default:
            return false;
        }
      },
      message: function () {
        return `Invalid 'text' value for messageType '${this.messageType}'. It must be a valid ${this.messageType} URL.`;
      }
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'seen'],
    default: 'sent'
  },
  isBlocked: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
