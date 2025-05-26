
// //websocket/chatserver.js
// const WebSocket = require('ws');
// const jwt = require('jsonwebtoken');
// const User = require('../models/user');
// const FriendRequest = require('../models/friendRequest');
// const { JWT_SECRET } = require('../config');

// const userSockets = new Map(); // Map<userId, WebSocket>

// async function getPendingFriendRequests(userId) {
//   // جلب طلبات الصداقة التي استلمها المستخدم ولم يتم الرد عليها بعد
//   return await FriendRequest.find({ receiver: userId }).populate('sender', 'username');
// }

// function createFriendRequestServer(server) {
//   const wss = new WebSocket.Server({ server });

//   wss.on('connection', async (ws, req) => {
//     try {
//       const urlParts = req.url.split('?');
//       const queryString = urlParts[1] || '';
//       const params = new URLSearchParams(queryString);
//       const token = params.get('token');

//       if (!token) {
//         ws.close(1008, 'Missing token');
//         return;
//       }

//       let payload;
//       try {
//         payload = jwt.verify(token, JWT_SECRET);
//       } catch {
//         ws.close(1008, 'Invalid token');
//         return;
//       }

//       const user = await User.findById(payload.id);
//       if (!user) {
//         ws.close(1008, 'Invalid user');
//         return;
//       }

//       ws.userId = user._id.toString();
//       userSockets.set(ws.userId, ws);

//       // عند الاتصال، نرسل قائمة طلبات الصداقة المعلقة مباشرة (اختياري)
//       const pendingRequests = await getPendingFriendRequests(ws.userId);
//       ws.send(
//         JSON.stringify({
//           type: 'friend_requests_list',
//           requests: pendingRequests.map(r => ({
//             id: r._id,
//             fromUserId: r.sender._id,
//             fromUsername: r.sender.username,
//           })),
//         })
//       );

//       ws.on('message', async (message) => {
//         let msg;
//         try {
//           msg = JSON.parse(message);
//         } catch {
//           return;
//         }

//         switch (msg.type) {
//           case 'friend_request_sent':
//             {
//               const toUser = await User.findById(msg.toUserId);
//               if (!toUser) return;

//               // التأكد أن الطلب غير موجود مسبقاً
//               const existingRequest = await FriendRequest.findOne({
//                 sender: ws.userId,
//                 receiver: msg.toUserId,
//               });
//               if (existingRequest) return;

//               await FriendRequest.create({
//                 sender: ws.userId,
//                 receiver: msg.toUserId,
//               });

//               sendToUser(msg.toUserId, {
//                 type: 'friend_request_received',
//                 fromUserId: ws.userId,
//                 fromUsername: user.username,
//               });
//             }
//             break;

//           case 'friend_request_response':
//             {
//               if (msg.accepted) {
//                 await User.findByIdAndUpdate(ws.userId, {
//                   $addToSet: { friends: msg.toUserId },
//                 });
//                 await User.findByIdAndUpdate(msg.toUserId, {
//                   $addToSet: { friends: ws.userId },
//                 });
//               }

//               await FriendRequest.findOneAndDelete({
//                 sender: msg.toUserId,
//                 receiver: ws.userId,
//               });

//               sendToUser(msg.toUserId, {
//                 type: 'friend_request_result',
//                 fromUserId: ws.userId,
//                 accepted: msg.accepted,
//               });
//             }
//             break;

//           case 'get_friend_requests':
//             {
//               const requests = await getPendingFriendRequests(ws.userId);
//               ws.send(
//                 JSON.stringify({
//                   type: 'friend_requests_list',
//                   requests: requests.map(r => ({
//                     id: r._id,
//                     fromUserId: r.sender._id,
//                     fromUsername: r.sender.username,
//                   })),
//                 })
//               );
//             }
//             break;

//           default:
//             break;
//         }
//       });

//       ws.on('close', () => {
//         userSockets.delete(ws.userId);
//       });
//     } catch (err) {
//       ws.close(1011, 'Internal server error');
//     }
//   });

//   return wss;
// }

// function sendToUser(userId, data) {
//   const ws = userSockets.get(userId);
//   if (ws && ws.readyState === WebSocket.OPEN) {
//     ws.send(JSON.stringify(data));
//   }
// }

// module.exports = { createFriendRequestServer };
//websocket/chatserver.js

const WebSocket = require('ws');
const { handleConnection } = require('./handlers/onConnection');

function createFriendRequestServer(server) {
  const wss = new WebSocket.Server({ server });
  wss.on('connection', (ws, req) => {
    handleConnection(ws, req);
  });
  return wss;
}

module.exports = { createFriendRequestServer };
