// //websocket/handlers/messageHndlers.js

// const User = require('../../models/user');
// const FriendRequest = require('../../models/friendRequest');
// const { getPendingFriendRequests } = require('../utils/getPendingRequests');
// const { sendToUser, sendFriendRequestList } = require('../utils/sendToUser');

// async function handleMessage(message, ws, userSockets) {
//   let msg;
//   try {
//     msg = JSON.parse(message);
//   } catch {
//     return;
//   }

//   switch (msg.type) {
//     case 'friend_request_sent': {
//       const toUser = await User.findById(msg.toUserId);
//       if (!toUser) return;

//       const exists = await FriendRequest.findOne({
//         sender: ws.userId,
//         receiver: msg.toUserId,
//       });
//       if (exists) return;

//       await FriendRequest.create({
//         sender: ws.userId,
//         receiver: msg.toUserId,
//       });

//       sendToUser(userSockets, msg.toUserId, {
//         type: 'friend_request_received',
//         fromUserId: ws.userId,
//         fromUsername: ws.username,
//       });
//       break;
//     }

//     case 'friend_request_response': {
//       if (msg.accepted) {
//         await User.findByIdAndUpdate(ws.userId, {
//           $addToSet: { friends: msg.toUserId },
//         });
//         await User.findByIdAndUpdate(msg.toUserId, {
//           $addToSet: { friends: ws.userId },
//         });
//       }

//       await FriendRequest.findOneAndDelete({
//         sender: msg.toUserId,
//         receiver: ws.userId,
//       });

//       sendToUser(userSockets, msg.toUserId, {
//         type: 'friend_request_result',
//         fromUserId: ws.userId,
//         accepted: msg.accepted,
//       });
//       break;
//     }

//     case 'get_friend_requests': {
//       const requests = await getPendingFriendRequests(ws.userId);
//       sendFriendRequestList(ws, requests);
//       break;
//     }

//     default:
//       break;
//   }
// }

// module.exports = { handleMessage };

const User = require('../../models/user');
const FriendRequest = require('../../models/friendRequest');
const { getPendingFriendRequests } = require('../utils/getPendingRequests');
const { sendToUser, sendFriendRequestList } = require('../utils/sendToUser');
const Item = require('../../models/item'); // عدّل المسار حسب موقع الملف

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
      break;
    }

    // الرد على طلب صداقة
    case 'friend_request_response': {
      if (msg.accepted) {
        await User.findByIdAndUpdate(ws.userId, {
          $addToSet: { friends: msg.toUserId },
        });
        await User.findByIdAndUpdate(msg.toUserId, {
          $addToSet: { friends: ws.userId },
        });

        // تحديث قائمة الأصدقاء للطرفين
        const [me, friend] = await Promise.all([
          User.findById(ws.userId).select('-password -__v'),
          User.findById(msg.toUserId).select('-password -__v')
        ]);

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
      }

      await FriendRequest.findOneAndDelete({
        sender: msg.toUserId,
        receiver: ws.userId,
      });

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

    default:
      break;
  }
}

module.exports = { handleMessage };
