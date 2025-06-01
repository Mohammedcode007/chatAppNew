

const User = require('../../models/user');
const FriendRequest = require('../../models/friendRequest');
const { getPendingFriendRequests } = require('../utils/getPendingRequests');
const { sendToUser, sendFriendRequestList } = require('../utils/sendToUser');
const Item = require('../../models/item'); // عدّل المسار حسب موقع الملف
const Notification = require('../../models/notification');
const { JWT_SECRET } = require('../../config');
const jwt = require('jsonwebtoken');
const Message = require('../../models/Message');
const activeChats = {}; // userId -> currently opened chat userId
const handleGetFriends = require('../utils/handleGetFriends');
const globalUserStatusMap = new Map();

async function handleMessage(message, ws, userSockets) {
  const parsed = JSON.parse(message);

  let msg;
  try {
    msg = JSON.parse(message);
  } catch {
    return;
  }

  switch (msg.type) {

    // إرسال طلب صداقة
    case 'friend_request_sent': {
      if (!msg.toUserId || !msg.toUserId) {
        return;
      }
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
        console.log('Decoded JWT:', decoded);
      } catch (err) {
        console.error('JWT verification failed:', err.message);
        sendToUser(userSockets, ws.userId, {
          type: 'status_update_failed',
          message: 'توكن المصادقة غير صالح',
        });
        return;
      }

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

      // --- الجزء الجديد: إرسال قائمة الأصدقاء المحدثة للمستخدم نفسه ---
      const userWithFriends = await User.findById(ws.userId).populate({
        path: 'friends',
        select: 'username avatar status',
      });

      if (userWithFriends) {
        sendToUser(userSockets, ws.userId, {
          type: 'friends_list_updated',
          friends: userWithFriends.friends,
        });
      }

      break;
    }



    case 'update_or_get_coins': {
      const { userId, newCoins } = msg;

      // السماح فقط للمستخدم بتعديل أو جلب بياناته هو
      if (userId !== ws.userId) {
        sendToUser(userSockets, ws.userId, {
          type: 'update_coins_failed',
          message: 'لا يمكنك تعديل أو جلب عملات مستخدم آخر',
        });
        return;
      }

      try {
        if (!userId) {
          return;
        }
        const user = await User.findById(userId);

        if (!user) {
          sendToUser(userSockets, ws.userId, {
            type: 'update_coins_failed',
            message: 'المستخدم غير موجود',
          });
          return;
        }

        // إذا تم إرسال قيمة جديدة لإضافتها
        if (typeof newCoins !== 'undefined') {
          if (typeof newCoins !== 'number' || isNaN(newCoins)) {
            sendToUser(userSockets, ws.userId, {
              type: 'update_coins_failed',
              message: 'عدد العملات غير صالح',
            });
            return;
          }

          // جمع العملات الجديدة على الرصيد الحالي
          user.coins += newCoins;
          await user.save();
        }

        // إرسال البيانات النهائية بعد التعديل أو فقط للجلب
        sendToUser(userSockets, userId, {
          type: 'coins_info',
          coins: user.coins,
        });

      } catch (error) {
        console.error('خطأ في جلب/تحديث العملات:', error.message);
        sendToUser(userSockets, ws.userId, {
          type: 'update_coins_failed',
          message: 'حدث خطأ أثناء جلب أو تحديث العملات',
        });
      }

      break;
    }


    case 'update_store_profile': {
      const {
        userId,
        inventory,
        purchaseHistory,
        selectedAvatar,
        selectedFrame,
        selectedEffect,
        selectedBackground,
        customUsernameColor,
        badge,
        subscription,
        specialWelcomeMessage,
        verified, // ✅ الحالة الجديدة: التحقق من الحساب

        cost, // سعر التحديث (عدد العملات)
      } = msg;
      if (!userId) {
        return;
      }
      // البحث عن المستخدم حسب المعرف
      const user = await User.findById(userId)
        .populate('selectedAvatar selectedFrame selectedEffect selectedBackground')
        .exec();

      if (!user) return;

      // التحقق من وجود رصيد كافٍ
      if (cost !== undefined) {
        if ((user.coins ?? 0) < cost) {
          // إرسال رسالة خطأ لعدم كفاية الرصيد
          sendToUser(userSockets, userId, {
            type: 'update_store_profile_failed',
            message: 'رصيد العملات غير كافٍ لإجراء هذا التحديث.',
          });
          break;
        } else {
          // خصم العملات
          user.coins = (user.coins ?? 0) - cost;
        }
      }

      // تحديث الحقول إذا تم إرسالها في الرسالة
      if (inventory !== undefined) {
        user.inventory = inventory;
      }

      if (purchaseHistory !== undefined) {
        user.purchaseHistory = purchaseHistory;
      }

      if (selectedAvatar !== undefined) {
        user.selectedAvatar = selectedAvatar;
      }

      if (selectedFrame !== undefined) {
        user.selectedFrame = selectedFrame;
      }

      if (selectedEffect !== undefined) {
        user.selectedEffect = selectedEffect;
      }

      if (selectedBackground !== undefined) {
        user.selectedBackground = selectedBackground;
      }

      if (customUsernameColor !== undefined) {
        user.customUsernameColor = customUsernameColor;
      }

      if (badge !== undefined) {
        user.badge = msg.badge;
      }


      if (subscription !== undefined) {
        user.subscription = subscription;
      }

      if (specialWelcomeMessage !== undefined) {
        user.specialWelcomeMessage = specialWelcomeMessage;
      }
      // ✅ تحديث حالة التحقق إذا تم إرسالها
      if (verified !== undefined) {
        user.verified = verified;
      }

      await user.save();

      // إرسال تأكيد التحديث مع إرسال بيانات البروفايل المحدثة كاملة
      sendToUser(userSockets, userId, {
        type: 'update_store_profile_success',
        message: 'تم تحديث بيانات المتجر بنجاح',
        profile: user,
      });

      break;
    }






    case 'private_message': {
      const { toUserId, text, tempId, messageType = 'text' } = msg; // استخراج نوع الرسالة مع قيمة افتراضية
      if (!toUserId || !ws.userId) {
        return;
      }
      // التحقق من وجود المرسل والمستلم
      const sender = await User.findById(ws.userId);
      const receiver = await User.findById(toUserId);

      if (!sender || !receiver) {
        sendToUser(userSockets, ws.userId, {
          type: 'message_failed',
          tempId,
          reason: 'المستخدم غير موجود',
        });
        return;
      }

      // التحقق من الحظر
      const senderBlockedReceiver = sender.blockedUsers.includes(toUserId);
      const receiverBlockedSender = receiver.blockedUsers.includes(ws.userId);

      if (senderBlockedReceiver || receiverBlockedSender) {
        sendToUser(userSockets, ws.userId, {
          type: 'message_blocked',
          tempId,
          reason: senderBlockedReceiver
            ? 'لقد قمت بحظر هذا المستخدم'
            : 'هذا المستخدم قام بحظرك، لا يمكنك إرسال رسائل إليه',
        });
        return;
      }

      // إنشاء الرسالة الجديدة
      const newMessage = new Message({
        sender: ws.userId,
        receiver: toUserId,
        text,
        messageType, // ✅ الاسم الصحيح
        timestamp: new Date(),
        status: 'sent',
      });

      await newMessage.save();

      // تأكيد للمرسل
      sendToUser(userSockets, ws.userId, {
        type: 'message_sent_confirmation',
        messageId: newMessage._id.toString(),
        tempId,
        status: 'sent',
        messageType, // ✅ الاسم الصحيح
      });

      // إرسال الرسالة للمستلم
      sendToUser(userSockets, toUserId, {
        type: 'new_private_message',
        message: {
          _id: newMessage._id.toString(),
          sender: ws.userId,
          receiver: toUserId,
          text,
          messageType, // ✅ الاسم الصحيح
          timestamp: newMessage.timestamp.toISOString(),
          status: 'sent',
        },
      });

      // تحديث حالة الرسالة حسب حالة المستلم
      if (receiver.status === 'online') {
        const isChatOpen = activeChats[toUserId] === ws.userId;

        newMessage.status = isChatOpen ? 'seen' : 'delivered';
        await newMessage.save();

        // إشعار المرسل بتحديث الحالة
        sendToUser(userSockets, ws.userId, {
          type: 'message_status_updated',
          messageId: newMessage._id.toString(),
          status: newMessage.status,
          receiverId: toUserId,
        });

        // إرسال إشعار للمستلم إذا لم يكن يفتح المحادثة
        if (!isChatOpen) {
          const unreadCount = await Message.countDocuments({
            sender: ws.userId,
            receiver: toUserId,
            status: { $ne: 'seen' },
          });
          if (!ws.userId) {
            return;
          }
          const senderUser = await User.findById(ws.userId, 'username avatarUrl').lean();

          sendToUser(userSockets, toUserId, {
            type: 'conversation_updated',
            conversation: {
              withUserId: ws.userId,
              withUsername: senderUser?.username || 'Unknown',
              withAvatarUrl: senderUser?.avatarUrl || null,
              unreadCount,
              lastMessage: {
                _id: newMessage._id.toString(),
                sender: ws.userId,
                receiver: toUserId,
                text,
                messageType, // ✅ الاسم الصحيح
                timestamp: newMessage.timestamp,
                status: newMessage.status,
              },
            },
          });
        }
      }

      break;
    }



    case 'update_message_status': {
      const { messageId, status } = msg;
      const validStatuses = ['delivered', 'received', 'seen'];

      if (!validStatuses.includes(status)) return;

      // جلب الرسالة من قاعدة البيانات
      const messageDoc = await Message.findById(messageId);
      if (!messageDoc) return;

      // تحقق من أن المستخدم الحالي هو المستلم للرسالة
      if (messageDoc.receiver.toString() !== ws.userId) return;

      // تحديث حالة الرسالة إذا كانت الحالة الجديدة أعلى ترتيبًا من الحالة السابقة
      // ترتيب الحالات: sent < delivered < received < seen
      const statusOrder = {
        sent: 0,
        delivered: 1,
        received: 2,
        seen: 3
      };

      if (statusOrder[status] > statusOrder[messageDoc.status]) {
        messageDoc.status = status;
        await messageDoc.save();

        // إرسال التحديث للمرسل
        sendToUser(userSockets, messageDoc.sender.toString(), {
          type: 'message_status_updated',
          messageId: messageDoc._id,
          status: messageDoc.status,
          receiverId: ws.userId
        });
      }
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

    case 'mark_as_read': {
      const { messageId } = msg;

      const message = await Message.findById(messageId);
      if (!message) {
        return;
      }

      // تأكد أن المستخدم الحالي هو المستقبل
      if (message?.receiver?.toString() !== ws.userId) {
        return;
      }

      // إذا كانت الحالة أقل من "read"، حدّثها
      if (message.status !== 'read') {
        message.status = 'read';
        await message.save();

        // أرسل للطرف الآخر أن الرسالة قُرئت
        const senderId = message.sender.toString();
        if (userSockets[senderId]) {
          sendToUser(userSockets, senderId, {
            type: 'message_read',
            messageId: message._id
          });
        }
      }

      break;
    }

    case 'open_private_chat': {
      const { withUserId } = msg;

      if (!withUserId) {
        sendToUser(userSockets, ws.userId, {
          type: 'chat_open_failed',
          message: 'معرف المستخدم الآخر مفقود.',
        });
        return;
      }

      try {
        // جلب كل الرسائل بين المستخدمين
        const messages = await Message.find({
          $or: [
            { sender: ws.userId, receiver: withUserId },
            { sender: withUserId, receiver: ws.userId }
          ]
        }).sort({ timestamp: 1 }); // ترتيب حسب الوقت

        // تحديث حالة الرسائل التي استلمها هذا المستخدم ولم تتم قراءتها بعد
        await Message.updateMany(
          {
            sender: withUserId,
            receiver: ws.userId,
            status: { $ne: 'seen' }
          },
          { $set: { status: 'seen' } }
        );

        // إرسال كل الرسائل للمستخدم الذي فتح المحادثة
        sendToUser(userSockets, ws.userId, {
          type: 'chat_history',
          withUserId,
          messages: messages.map(m => ({
            _id: m._id.toString(),
            sender: m.sender,
            receiver: m.receiver,
            text: m.text,
            timestamp: m.timestamp.toISOString(),
            status: m.status,
          }))
        });

        // إعلام الطرف الآخر أن الرسائل تمّت قراءتها (اختياري)
        sendToUser(userSockets, withUserId, {
          type: 'messages_seen',
          byUserId: ws.userId,
        });

      } catch (err) {
        console.error('خطأ أثناء فتح المحادثة:', err);
        sendToUser(userSockets, ws.userId, {
          type: 'chat_open_failed',
          message: 'حدث خطأ أثناء جلب الرسائل.',
        });
      }

      break;
    }

    case 'open_chat': {
      const { withUserId } = msg;
      activeChats[ws.userId] = withUserId;
      console.log(`${ws.userId} is now viewing chat with ${withUserId}`);
      break;
    }

    case 'close_chat': {
      delete activeChats[ws.userId];
      console.log(`${ws.userId} has closed the chat`);
      break;
    }

    case 'get_all_conversations': {
      const allMessages = await Message.find({
        $or: [
          { sender: ws.userId },
          { receiver: ws.userId }
        ]
      }).sort({ timestamp: 1 });

      const conversationsMap = {};

      allMessages.forEach(message => {
        const otherUserId = message.sender.toString() === ws.userId
          ? message?.receiver?.toString()
          : message.sender.toString();

        if (!conversationsMap[otherUserId]) {
          conversationsMap[otherUserId] = {
            messages: [],
            unreadCount: 0,
            lastMessage: null,
          };
        }

        conversationsMap[otherUserId].messages.push(message);
        conversationsMap[otherUserId].lastMessage = message;

        if (
          message?.receiver?.toString() === ws.userId &&
          message.status !== 'seen'
        ) {
          conversationsMap[otherUserId].unreadCount++;
        }
      });

      const otherUserIds = Object.keys(conversationsMap);

      const usersData = await User.find(
        { _id: { $in: otherUserIds } },
        'username avatarUrl status'
      ).lean();

      const usersMap = {};
      usersData.forEach(user => {
        const userIdStr = user._id.toString();
        usersMap[userIdStr] = {
          username: user.username,
          avatarUrl: user.avatarUrl,
          status: user.status, // إما 'online' أو 'offline' أو 'busy'
        };
      });

      const conversations = otherUserIds.map(userId => {
        const convo = conversationsMap[userId];
        const user = usersMap[userId] || {
          username: 'Unknown',
          avatarUrl: null,
          status: 'offline',
        };

        return {
          withUserId: userId,
          withUsername: user.username,
          withAvatarUrl: user.avatarUrl,
          userStatus: user.status, // الحالة الفعلية
          unreadCount: convo.unreadCount,
          lastMessage: {
            _id: convo.lastMessage._id.toString(),
            sender: convo.lastMessage.sender.toString(),
            receiver: convo?.lastMessage?.receiver?.toString(),
            text: convo.lastMessage.text,
            timestamp: convo.lastMessage.timestamp,
            status: convo.lastMessage.status,
            messageType: convo.lastMessage.messageType || 'text', // ← تمت الإضافة هنا

          },
          messages: convo.messages.map(msg => ({
            _id: msg._id.toString(),
            sender: msg.sender.toString(),
            receiver: msg.receiver.toString(),
            text: msg.text,
            timestamp: msg.timestamp,
            status: msg.status,
          })),
        };
      });

      sendToUser(userSockets, ws.userId, {
        type: 'all_conversations',
        conversations,
      });

      break;
    }
    case 'block_user': {
      const { targetUserId } = msg;

      if (!targetUserId) return;
      if (!targetUserId || !ws.userId) {
        return;
      }
      const user = await User.findById(ws.userId);
      const targetUser = await User.findById(targetUserId);

      if (!user || !targetUser) {
        sendToUser(userSockets, ws.userId, {
          type: 'block_failed',
          message: 'المستخدم غير موجود',
        });
        return;
      }

      // تحقق إذا المستخدم محظور مسبقاً
      if (user.blockedUsers.includes(targetUserId)) {
        sendToUser(userSockets, ws.userId, {
          type: 'block_failed',
          message: 'المستخدم محظور بالفعل',
        });
        return;
      }

      user.blockedUsers.push(targetUserId);
      await user.save();

      sendToUser(userSockets, ws.userId, {
        type: 'user_blocked_successfully',
        blockedUserId: targetUserId,
      });

      break;
    }

    case 'unblock_user': {
      const { targetUserId } = msg;

      if (!targetUserId) return;
      if (!ws.userId) {
        return;
      }
      const user = await User.findById(ws.userId);

      if (!user) {
        sendToUser(userSockets, ws.userId, {
          type: 'unblock_failed',
          message: 'المستخدم غير موجود',
        });
        return;
      }

      // تحقق إذا المستخدم غير محظور أصلاً
      if (!user.blockedUsers.includes(targetUserId)) {
        sendToUser(userSockets, ws.userId, {
          type: 'unblock_failed',
          message: 'المستخدم غير محظور أصلاً',
        });
        return;
      }

      user.blockedUsers = user.blockedUsers.filter(
        (blockedId) => blockedId.toString() !== targetUserId
      );
      await user.save();

      sendToUser(userSockets, ws.userId, {
        type: 'user_unblocked_successfully',
        unblockedUserId: targetUserId,
      });

      break;
    }

    case 'get_blocked_users': {
      if (!ws.userId) {
        return;
      }
      const user = await User.findById(ws.userId);

      if (!user) {
        sendToUser(userSockets, ws.userId, {
          type: 'get_blocked_users_failed',
          message: 'المستخدم غير موجود',
        });
        return;
      }

      // جلب تفاصيل المستخدمين المحظورين (الاسم فقط)
      const blockedUsersDetails = await User.find(
        { _id: { $in: user.blockedUsers } },
        { username: 1 }  // نطلب فقط حقل username مع _id افتراضياً
      );

      sendToUser(userSockets, ws.userId, {
        type: 'blocked_users_list',
        blockedUsers: blockedUsersDetails.map(u => ({
          id: u._id,
          name: u.username,
        })),
      });

      break;
    }
    case 'create_group': {
      const { groupName, userId } = msg;

      if (!groupName || !userId) {
        sendToUser(userSockets, userId || ws.userId, {
          type: 'create_group_failed',
          message: 'يجب تقديم اسم المجموعة ومعرف المستخدم',
        });
        break;
      }

      try {
        const Group = require('../../models/group');
        const User = require('../../models/user'); // تأكد من استدعاء نموذج المستخدم

        // التحقق من عدم وجود مجموعة بنفس الاسم مسبقًا
        const existingGroup = await Group.findOne({ name: groupName });
        if (existingGroup) {
          sendToUser(userSockets, userId, {
            type: 'create_group_failed',
            message: 'اسم المجموعة مستخدم بالفعل، يرجى اختيار اسم آخر.',
          });
          break;
        }

        // إنشاء المجموعة
        const newGroup = await Group.create({
          name: groupName,
          creator: userId,
          members: [userId],
          owners: [userId],
          admins: [],
          blocked: [],
          description: '',
          avatar: '',
          isPublic: true,
          password: '',
          tag: '',
          messages: [],
          lastMessage: null,
          logs: [`تم إنشاء المجموعة بواسطة المستخدم ${userId}`],
          inviteLink: '',
          pinMessage: null,
          welcomeMessageText: "مرحباً بك في المجموعة! نتمنى لك وقتاً ممتعاً معنا.",
          welcomeMessageEnabled: true,
          autoDeleteMessagesAfterHours: 24,
          points: 0,
        });

        // تحديث المستخدم لإضافة المجموعة إلى المفضلة
        await User.findByIdAndUpdate(userId, {
          $addToSet: { favoriteGroups: newGroup._id }, // $addToSet لضمان عدم التكرار
        });

        sendToUser(userSockets, userId, {
          type: 'create_group_success',
          group: newGroup,
        });

      } catch (error) {
        console.error('Error creating group:', error);
        sendToUser(userSockets, userId || ws.userId, {
          type: 'create_group_failed',
          message: 'حدث خطأ أثناء إنشاء المجموعة',
        });
      }

      break;
    }

    case 'get_user_groups': {
      const { userId } = msg;

      if (!userId) {
        sendToUser(userSockets, ws.userId, {
          type: 'get_user_groups_failed',
          message: 'يجب تقديم معرف المستخدم.',
        });
        break;
      }

      try {
        const Group = require('../../models/group');

        // جلب جميع المجموعات التي يكون المستخدم عضوًا فيها
        const groups = await Group.find({ members: userId }).sort({ updatedAt: -1 });

        sendToUser(userSockets, userId, {
          type: 'get_user_groups_success',
          groups,
        });

      } catch (error) {
        console.error('Error fetching user groups:', error);
        sendToUser(userSockets, userId, {
          type: 'get_user_groups_failed',
          message: 'حدث خطأ أثناء جلب المجموعات.',
        });
      }

      break;
    }

    case 'get_favorite_groups': {
      const { userId } = msg;

      if (!userId) {
        sendToUser(userSockets, ws.userId, {
          type: 'get_favorite_groups_failed',
          message: 'يجب تقديم معرف المستخدم',
        });
        break;
      }

      try {
        const User = require('../../models/user');
        const Group = require('../../models/group');
        if (!userId) {
          return;
        }
        const user = await User.findById(userId).lean();

        if (!user) {
          sendToUser(userSockets, userId, {
            type: 'get_favorite_groups_failed',
            message: 'المستخدم غير موجود',
          });
          break;
        }

        // جلب المجموعات المفضلة بالتفاصيل
        const favoriteGroups = await Group.find({
          _id: { $in: user.favoriteGroups || [] }
        }).lean();

        sendToUser(userSockets, userId, {
          type: 'get_favorite_groups_success',
          groups: favoriteGroups,
        });

      } catch (error) {
        console.error('Error getting favorite groups:', error);
        sendToUser(userSockets, userId, {
          type: 'get_favorite_groups_failed',
          message: 'حدث خطأ أثناء جلب المجموعات المفضلة',
        });
      }

      break;
    }




    case 'fetch_group_messages': {
      const { groupId } = msg;

      if (!groupId) {
        sendToUser(userSockets, ws.userId, {
          type: 'fetch_group_messages_failed',
          message: 'يجب تقديم معرف المجموعة.',
        });
        break;
      }

      try {
        const mongoose = require('mongoose');
        const Group = require('../../models/group');
        const GroupMessage = require('../../models/GroupMessage');

        const group = await Group.findById(groupId);
        if (!group) {
          sendToUser(userSockets, ws.userId, {
            type: 'fetch_group_messages_failed',
            message: 'المجموعة غير موجودة.',
          });
          break;
        }

        if (!group.members.some(memberId => memberId.equals(ws.userId))) {
          sendToUser(userSockets, ws.userId, {
            type: 'fetch_group_messages_failed',
            message: 'أنت لست عضواً في هذه المجموعة.',
          });
          break;
        }

        const messages = await GroupMessage.find({
          groupId: new mongoose.Types.ObjectId(groupId)
        }).sort({ timestamp: 1 }).lean();


        console.log('Fetched Messages:', messages);

        sendToUser(userSockets, ws.userId, {
          type: 'fetch_group_messages_success',
          groupId,
          messages,
        });

      } catch (error) {
        console.error('Error fetching group messages:', error);
        sendToUser(userSockets, ws.userId, {
          type: 'fetch_group_messages_failed',
          message: 'حدث خطأ أثناء جلب رسائل المجموعة.',
        });
      }

      break;
    }

   case 'send_group_message': {
  const { groupId, newMessage, messageType = 'text', tempId } = msg;

  if (!groupId || !newMessage || typeof newMessage !== 'string' || newMessage.trim() === '') {
    sendToUser(userSockets, ws.userId, {
      type: 'send_group_message_failed',
      message: 'بيانات غير مكتملة لإرسال الرسالة.',
    });
    break;
  }

  try {
    const Group = require('../../models/group');
    const GroupMessage = require('../../models/GroupMessage');

    const group = await Group.findById(groupId);
    if (!group) {
      sendToUser(userSockets, ws.userId, {
        type: 'send_group_message_failed',
        message: 'المجموعة غير موجودة.',
      });
      break;
    }

    if (!group.members.includes(ws.userId)) {
      sendToUser(userSockets, ws.userId, {
        type: 'send_group_message_failed',
        message: 'أنت لست عضواً في هذه المجموعة.',
      });
      break;
    }

    const newMsgDoc = new GroupMessage({
      sender: ws.userId,
      groupId,
      text: newMessage.trim(),
      messageType,
      timestamp: new Date(),
      status: 'sent',
    });

    await newMsgDoc.save();

    // تحديث بيانات المجموعة (مثلاً آخر رسالة)
    group.lastMessage = newMsgDoc._id;
    await group.save();

    const messageToSend = {
      _id: newMsgDoc._id.toString(),
      sender: ws.userId,
      groupId,
      text: newMsgDoc.text,
      messageType,
      timestamp: newMsgDoc.timestamp.toISOString(),
      status: 'sent',
    };

    // إرسال تأكيد المرسل مع الرسالة الجديدة
    sendToUser(userSockets, ws.userId, {
      type: 'group_message_sent_confirmation',
      tempId,
      newMessage: messageToSend,
    });

    // إرسال الرسالة الجديدة لجميع أعضاء المجموعة (بما فيهم المرسل)
    group.members.forEach(memberId => {
      const userWs = userSockets[memberId];
      if (userWs && userWs.readyState === 1) {
        userWs.send(JSON.stringify({
          type: 'new_group_message',
          newMessage: messageToSend,
          receiver: memberId,
        }));
      }
    });

  } catch (error) {
    console.error('Error sending group message:', error);
    sendToUser(userSockets, ws.userId, {
      type: 'send_group_message_failed',
      message: 'حدث خطأ أثناء إرسال الرسالة.',
    });
  }

  break;
}




    case 'get_group_members': {
      const { groupId } = msg;

      console.log('Received get_group_members request:', { groupId });

      if (!groupId) {
        sendToUser(userSockets, ws.userId, {
          type: 'get_group_members_failed',
          message: 'Group ID is required.',
        });
        break;
      }

      try {
        const Group = require('../../models/group');
        const User = require('../../models/user'); // إذا أردت جلب بيانات العضو وليس فقط الـ ID

        const group = await Group.findById(groupId).lean();

        if (!group) {
          sendToUser(userSockets, ws.userId, {
            type: 'get_group_members_failed',
            message: 'Group not found.',
          });
          break;
        }

        // جلب بيانات الأعضاء (اختياري: يمكنك استرجاع username, avatar فقط)
        const membersData = await User.find({ _id: { $in: group.members } }, '_id username avatar').lean();

        sendToUser(userSockets, ws.userId, {
          type: 'group_members',
          groupId,
          members: membersData,
        });
      } catch (error) {
        console.error('Error getting group members:', error);
        sendToUser(userSockets, ws.userId, {
          type: 'get_group_members_failed',
          message: 'An error occurred while fetching group members.',
        });
      }

      break;
    }

    case 'join_group': {
      const { groupId, userId } = msg;

      console.log('Received join_group request:', { groupId, userId });

      if (!groupId) {
        sendToUser(userSockets, ws.userId, {
          type: 'join_group_failed',
          message: 'Group ID is required to join the group.',
        });
        break;
      }

      if (!userId) {
        sendToUser(userSockets, ws.userId, {
          type: 'join_group_failed',
          message: 'User ID is required to join the group.',
        });
        break;
      }

      try {
        const Group = require('../../models/group');

        // البحث عن الجروب
        const group = await Group.findById(groupId);
        if (!group) {
          sendToUser(userSockets, ws.userId, {
            type: 'join_group_failed',
            message: 'Group not found.',
          });
          break;
        }

        // التحقق إذا كان المستخدم عضوًا بالفعل
        if (group.members.includes(userId)) {
          sendToUser(userSockets, ws.userId, {
            type: 'join_group_failed',
            message: 'You are already a member of this group.',
          });
          break;
        }

        // إضافة المستخدم إلى أعضاء الجروب
        group.members.push(userId);
        await group.save();

        // تأكيد الانضمام للمستخدم
        sendToUser(userSockets, ws.userId, {
          type: 'join_group_success',
          groupId,
          message: 'You have successfully joined the group.',
        });

        // إرسال رسالة نظام لباقي الأعضاء
        const systemMessage = {
          _id: `sys_${Date.now()}`,
          sender: null,
          senderType: 'system',
          groupId,
          text: `User ${userId} has joined the group.`,
          messageType: 'system',
          timestamp: new Date().toISOString(),
          status: 'sent',
        };

        group.members.forEach(memberId => {
          if (memberId === userId) return; // لا نرسل رسالة للعضو الذي انضم الآن
          const userWs = userSockets[memberId];
          if (userWs && userWs.readyState === 1) {
            userWs.send(JSON.stringify({
              type: 'new_group_message',
              message: systemMessage,
            }));
          }
        });

      } catch (error) {
        console.error('Error joining group:', error);
        sendToUser(userSockets, ws.userId, {
          type: 'join_group_failed',
          message: 'An error occurred while trying to join the group.',
        });
      }

      break;
    }

    case 'leave_group': {
      const { groupId, userId } = msg;

      console.log('Received leave_group request:', { groupId, userId });

      if (!groupId) {
        sendToUser(userSockets, ws.userId, {
          type: 'leave_group_failed',
          message: 'Group ID is required to leave the group.',
        });
        break;
      }

      if (!userId) {
        sendToUser(userSockets, ws.userId, {
          type: 'leave_group_failed',
          message: 'User ID is required to leave the group.',
        });
        break;
      }

      try {
        const Group = require('../../models/group');

        // البحث عن الغرفة
        const group = await Group.findById(groupId);
        if (!group) {
          sendToUser(userSockets, ws.userId, {
            type: 'leave_group_failed',
            message: 'Group not found.',
          });
          break;
        }

        // التحقق مما إذا كان المستخدم عضوًا في الغرفة
        if (!group.members.includes(userId)) {
          sendToUser(userSockets, ws.userId, {
            type: 'leave_group_failed',
            message: 'You are not a member of this group.',
          });
          break;
        }

        // إزالة المستخدم من أعضاء الغرفة (تحويل كل id إلى نص للمقارنة)
        group.members = group.members.filter(id => id.toString() !== userId.toString());


        await group.save();

        // تأكيد للمستخدم
        sendToUser(userSockets, ws.userId, {
          type: 'leave_group_success',
          groupId,
          message: 'You have successfully left the group.',
        });

        // إرسال رسالة نظام إلى باقي الأعضاء
        const systemMessage = {
          _id: `sys_${Date.now()}`,
          sender: null,
          senderType: 'system',
          groupId,
          text: `User ${userId} has left the group.`,
          messageType: 'system',
          timestamp: new Date().toISOString(),
          status: 'sent',
        };

        group.members.forEach(memberId => {
          const userWs = userSockets[memberId];
          if (userWs && userWs.readyState === 1) {
            userWs.send(JSON.stringify({
              type: 'new_group_message',
              message: systemMessage,
            }));
          }
        });

      } catch (error) {
        console.error('Error leaving group:', error);
        sendToUser(userSockets, ws.userId, {
          type: 'leave_group_failed',
          message: 'An error occurred while trying to leave the group.',
        });
      }

      break;
    }


    case 'get_all_groups': {
      try {
        const Group = require('../../models/group');

        // جلب كل الغرف من قاعدة البيانات
        const groups = await Group.find({});

        // إرسال كل الغرف إلى المستخدم عبر WebSocket
        sendToUser(userSockets, ws.userId, {
          type: 'all_groups',
          groups,
        });
      } catch (error) {
        console.error('خطأ في جلب الغرف:', error);
        sendToUser(userSockets, ws.userId, {
          type: 'get_all_groups_failed',
          message: 'حدث خطأ أثناء جلب الغرف',
        });
      }
      break;
    }


    case 'get_friends':
      handleGetFriends(ws, parsed);
      break;
    default:
      break;
  }
}

module.exports = { handleMessage };
