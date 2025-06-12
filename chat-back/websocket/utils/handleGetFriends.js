const jwt = require('jsonwebtoken');
const User = require('../../models/user'); // تأكد من المسار الصحيح لموديل المستخدم
const { JWT_SECRET } = require('../../config');


async function handleGetFriends(ws, data) {
  try {
    const decoded = jwt.verify(data.token, JWT_SECRET);
    const userId = decoded.id;

    const user = await User.findById(userId).populate({
      path: 'friends',
      select: 'username avatarUrl status', // حدد الحقول التي تريد إرسالها
    });

    if (!user) {
      return ws.send(JSON.stringify({
        type: 'get_friends',
        status: 'error',
        message: 'المستخدم غير موجود'
      }));
    }

    ws.send(JSON.stringify({
      type: 'get_friends',
      status: 'success',
      friends: user.friends
    }));
  } catch (error) {
    console.error('خطأ في جلب الأصدقاء:', error.message);
    ws.send(JSON.stringify({
      type: 'get_friends',
      status: 'error',
      message: 'توكن غير صالح أو خطأ في السيرفر'
    }));
  }
}
module.exports = handleGetFriends; // هذا مهم جدًا
