const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: { type: String, required: true },           // اسم الغرفة
  sender: { type: String, required: true },         // اسم المرسل (username)
  content: { type: String, required: true },        // نص الرسالة
  timestamp: { type: Date, default: Date.now },     // توقيت الإرسال
});

module.exports = mongoose.model('Message', messageSchema);
