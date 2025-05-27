

const User = require('../../models/user');
const FriendRequest = require('../../models/friendRequest');
const { getPendingFriendRequests } = require('../utils/getPendingRequests');
const { sendToUser, sendFriendRequestList } = require('../utils/sendToUser');
const Item = require('../../models/item'); // عدّل المسار حسب موقع الملف
const Notification = require('../../models/notification');
const { JWT_SECRET } = require('../../config');
const jwt = require('jsonwebtoken');
const Message = require('../../models/Message');

async function handleMessage(message, ws, userSockets) {
  let msg;
  try {
    msg = JSON.parse(message);
  } catch {
    return;
  }

  switch (msg.type) {

    // إرسال طلب صداقة
    case 'friend_request_sent': {
      const toUser = await User.findById(msg.toUserId);
      if (!toUser) return;

      const exists = await FriendRequest.findOne({
        sender: ws.userId,
        receiver: msg.toUserId,
      });
      if (exists) return;

      await FriendRequest.create({
        sender: ws.userId,
        receiver: msg.toUserId,
      });


      sendToUser(userSockets, msg.toUserId, {
        type: 'friend_request_received',
        fromUserId: ws.userId,
        fromUsername: ws.username,
      });

      // إذا لم يكن متصلًا، خزّن إشعارًا
      if (!userSockets[msg.toUserId]) {
        await Notification.create({
          user: msg.toUserId,
          type: 'friend_request',
          data: {
            fromUserId: ws.userId,
            fromUsername: ws.username,
          },
        });
      }

      break;
    }

    // نوع جديد من الرسائل
    case 'get_notifications': {
      const notifications = await Notification.find({ user: ws.userId, read: false });
      sendToUser(userSockets, ws.userId, {
        type: 'notifications_list',
        notifications,
      });
      break;
    }

    // الرد على طلب صداقة
   case 'friend_request_response': {
  if (msg.accepted) {
    // تحقق من صحة المعرفات
    if (!ws.userId || !msg.toUserId) {
      console.error('Missing user IDs for friend request response');
      return;
    }

    try {
      // تحديث أصدقاء الطرفين بالتوازي وانتظار اكتمالهما
      await Promise.all([
        User.findByIdAndUpdate(ws.userId, { $addToSet: { friends: msg.toUserId } }),
        User.findByIdAndUpdate(msg.toUserId, { $addToSet: { friends: ws.userId } }),
      ]);

      // جلب بيانات المستخدمين بعد التحديث بدون الحقول الحساسة
      const [me, friend] = await Promise.all([
        User.findById(ws.userId).select('-password -__v'),
        User.findById(msg.toUserId).select('-password -__v')
      ]);

      if (!me || !friend) {
        console.error('User data not found after update');
        return;
      }

      // إرسال إشعار إضافة الصديق للمستخدم الذي قبل الطلب
      sendToUser(userSockets, ws.userId, {
        type: 'new_friend_added',
        user: {
          _id: friend._id,
          username: friend.username,
          profilePic: friend.profilePic,
          status: friend.status,
          selectedAvatar: friend.selectedAvatar,
          selectedFrame: friend.selectedFrame,
          selectedEffect: friend.selectedEffect,
          selectedBackground: friend.selectedBackground,
          subscription: friend.subscription,
          coins: friend.coins
        }
      });

      // إرسال إشعار إضافة الصديق للطرف الآخر (مرسل الطلب)
      sendToUser(userSockets, msg.toUserId, {
        type: 'new_friend_added',
        user: {
          _id: me._id,
          username: me.username,
          profilePic: me.profilePic,
          status: me.status,
          selectedAvatar: me.selectedAvatar,
          selectedFrame: me.selectedFrame,
          selectedEffect: me.selectedEffect,
          selectedBackground: me.selectedBackground,
          subscription: me.subscription,
          coins: me.coins
        }
      });

    } catch (error) {
      console.error('Error updating friends:', error);
      return;
    }
  }

  // حذف طلب الصداقة بعد قبول أو رفض الطلب
  await FriendRequest.findOneAndDelete({
    sender: msg.toUserId,
    receiver: ws.userId,
  });

  // إرسال نتيجة قبول أو رفض طلب الصداقة للطرف الآخر
  sendToUser(userSockets, msg.toUserId, {
    type: 'friend_request_result',
    fromUserId: ws.userId,
    accepted: msg.accepted,
  });
  break;
}

    // جلب طلبات الصداقة المعلقة
    case 'get_friend_requests': {
      const requests = await getPendingFriendRequests(ws.userId);
      sendFriendRequestList(ws, requests);
      break;
    }

    // تعديل الملف الشخصي
    case 'update_profile': {
      const updates = msg.updates || {};

      const allowedFields = [
        'username', 'profilePic', 'status',
        'selectedAvatar', 'selectedFrame', 'selectedEffect', 'selectedBackground',
        'subscription', 'coins'
      ];

      const updateData = {};
      for (const key of allowedFields) {
        if (key in updates) {
          updateData[key] = updates[key];
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        ws.userId,
        updateData,
        {
          new: true,
          select: '-password -__v'
        }
      ).populate([
        { path: 'selectedAvatar', select: 'name imageUrl' },
        { path: 'selectedFrame', select: 'name imageUrl' },
        { path: 'selectedEffect', select: 'name imageUrl' },
        { path: 'selectedBackground', select: 'name imageUrl' },
      ]);

      // إخطار كل الأصدقاء بالتحديث
      for (const friendId of updatedUser.friends) {
        sendToUser(userSockets, friendId.toString(), {
          type: 'friend_profile_updated',
          user: {
            _id: updatedUser._id,
            username: updatedUser.username,
            profilePic: updatedUser.profilePic,
            status: updatedUser.status,
            coins: updatedUser.coins,
            selectedAvatar: updatedUser.selectedAvatar,
            selectedFrame: updatedUser.selectedFrame,
            selectedEffect: updatedUser.selectedEffect,
            selectedBackground: updatedUser.selectedBackground,
            subscription: updatedUser.subscription,
          }
        });
      }

      // تأكيد التعديل للمستخدم نفسه
      sendToUser(userSockets, ws.userId, {
        type: 'profile_updated_successfully',
        user: updatedUser
      });

      break;
    }
    case 'update_status': {
      const { status: newStatus, token } = msg;
      const validStatuses = ['offline', 'online', 'busy'];

      if (!validStatuses.includes(newStatus)) {
        return;
      }

      if (!token) {
        sendToUser(userSockets, ws.userId, {
          type: 'status_update_failed',
          message: 'توكن المصادقة مفقود',
        });
        return;
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded JWT:', decoded); // لمعرفة محتوى التوكن
      } catch (err) {
        console.error('JWT verification failed:', err.message);
        sendToUser(userSockets, ws.userId, {
          type: 'status_update_failed',
          message: 'توكن المصادقة غير صالح',
        });
        return;
      }

      // تحقق من معرف المستخدم داخل التوكن
    if (decoded.id !== ws.userId) {
  sendToUser(userSockets, ws.userId, {
    type: 'status_update_failed',
    message: 'عدم تطابق هوية المستخدم',
  });
  return;
}



     

      const updatedUser = await User.findByIdAndUpdate(
        ws.userId,
        { status: newStatus },
        { new: true, select: '-password -__v' }
      );

      if (!updatedUser) return;

      // إرسال الحالة لكل من يحتوي هذا المستخدم ضمن أصدقائه
      const allUsersWithHimAsFriend = await User.find({ friends: ws.userId }).select('_id');
      for (const user of allUsersWithHimAsFriend) {
        sendToUser(userSockets, user._id.toString(), {
          type: 'friend_status_updated',
          userId: updatedUser._id,
          status: updatedUser.status,
        });
      }

      // إرسال التحديث لأصدقائه الحاليين
      for (const friendId of updatedUser.friends) {
        sendToUser(userSockets, friendId.toString(), {
          type: 'friend_status_updated',
          userId: updatedUser._id,
          status: updatedUser.status,
        });
      }

      // تأكيد التحديث للمستخدم نفسه
      sendToUser(userSockets, ws.userId, {
        type: 'status_updated_successfully',
        status: updatedUser.status,
      });

      break;
    }

case 'private_message': {
  const { toUserId, text, tempId } = msg;
  console.log(`[private_message] Received message from ${ws.userId} to ${toUserId}: ${text}`);

  // التحقق من وجود المستخدم المستقبل
  const receiver = await User.findById(toUserId);
  if (!receiver) {
    console.log(`[private_message] Receiver with ID ${toUserId} not found.`);
    return;
  }
  console.log(`[private_message] Receiver found: ${receiver.username}`);

  // التحقق من الحظر المتبادل
  if (receiver.blockedUsers?.includes(ws.userId) || ws.blockedUsers?.includes(toUserId)) {
    console.log(`[private_message] Message blocked: sender ${ws.userId} or receiver ${toUserId} has blocked the other.`);
    return sendToUser(userSockets, ws.userId, {
      type: 'message_failed',
      reason: 'تم الحظر من أحد الطرفين'
    });
  }

  // إنشاء الرسالة في قاعدة البيانات
  const newMessage = await Message.create({
    sender: ws.userId,
    receiver: toUserId,
    text,
    status: userSockets[toUserId] ? 'delivered' : 'sent',
    isBlocked: false
  });
  console.log(`[private_message] Message saved with ID ${newMessage._id} and status ${newMessage.status}`);

  // إرسال الرسالة إلى المستقبل إذا كان متصلاً
  if (userSockets[toUserId]) {
    sendToUser(userSockets, toUserId, {
      type: 'new_private_message',
      message: {
        _id: newMessage._id,
        sender: ws.userId,
        receiver: toUserId,
        text: newMessage.text,
        timestamp: newMessage.timestamp,
        status: newMessage.status
      }
    });
    console.log(`[private_message] Message sent to receiver ${toUserId}`);
  } else {
    console.log(`[private_message] Receiver ${toUserId} is offline, message status set to 'sent'`);
  }

  // تأكيد الإرسال للمرسل مع إعادة tempId
  sendToUser(userSockets, ws.userId, {
    type: 'message_sent_confirmation',
    tempId,
    messageId: newMessage._id,
    status: newMessage.status
  });
  console.log(`[private_message] Confirmation sent to sender ${ws.userId}`);

  // طباعة المحادثة الحالية بين الطرفين بعد إرسال الرسالة
  const conversation = await Message.find({
    $or: [
      { sender: ws.userId, receiver: toUserId },
      { sender: toUserId, receiver: ws.userId }
    ]
  }).sort({ timestamp: 1 });

  console.log(`[private_message] Conversation between ${ws.userId} and ${toUserId}:`);
  conversation.forEach(msg => {
    const senderLabel = msg.sender.toString() === ws.userId ? 'Me' : receiver.username;
    console.log(`  [${msg.timestamp.toISOString()}] ${senderLabel}: ${msg.text}`);
  });

  break;
}

case 'update_message_status': {
  const { messageId, status } = msg;
  const validStatuses = ['delivered', 'received', 'seen'];

  if (!validStatuses.includes(status)) return;

  const messageDoc = await Message.findById(messageId);
  if (!messageDoc) return;

  // تحقق أن المستقبل هو المستخدم الحالي
  if (messageDoc.receiver.toString() !== ws.userId) return;

  messageDoc.status = status;
  await messageDoc.save();

  // إرسال تحديث الحالة للطرف الآخر (المرسل)
  sendToUser(userSockets, messageDoc.sender.toString(), {
    type: 'message_status_updated',
    messageId: messageDoc._id,
    status: messageDoc.status
  });

  break;
}

case 'get_conversation': {
  const { withUserId } = msg;

  // جلب الرسائل التي أرسلها أو استلمها المستخدم مع الطرف الآخر، مرتبة زمنياً
  const messages = await Message.find({
    $or: [
      { sender: ws.userId, receiver: withUserId },
      { sender: withUserId, receiver: ws.userId }
    ]
  }).sort({ timestamp: 1 }); // ترتيب تصاعدي حسب التاريخ

  // طباعة بيانات المحادثة في سجل السيرفر
  console.log(`[get_conversation] Conversation between ${ws.userId} and ${withUserId}:`);
  messages.forEach(msg => {
    const senderLabel = msg.sender.toString() === ws.userId ? 'Me' : 'Them';
    console.log(`  [${msg.timestamp.toISOString()}] ${senderLabel}: ${msg.text}`);
  });

  // إرسال المحادثة إلى المستخدم
  sendToUser(userSockets, ws.userId, {
    type: 'conversation_history',
    messages
  });

  break;
}




    default:
      break;
  }
}

module.exports = { handleMessage };
