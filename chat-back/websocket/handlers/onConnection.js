//websocket/handlers/getPendingRequests.js

const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const { JWT_SECRET } = require('../../config');
const { getPendingFriendRequests } = require('../utils/getPendingRequests');
const { handleMessage } = require('./messageHandlers');
const { sendFriendRequestList } = require('../utils/sendToUser');

const userSockets = new Map(); // Map<userId, WebSocket>

async function handleConnection(ws, req) {
  try {
    const params = new URLSearchParams((req.url.split('?')[1]) || '');
    const token = params.get('token');

    if (!token) return ws.close(1008, 'Missing token');

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ws.close(1008, 'Invalid token');
    }

    const user = await User.findById(payload.id);
    if (!user) return ws.close(1008, 'Invalid user');

    ws.userId = user._id.toString();
    ws.username = user.username;
    userSockets.set(ws.userId, ws);

    // إرسال الطلبات المعلقة عند الاتصال
    const pendingRequests = await getPendingFriendRequests(ws.userId);
    sendFriendRequestList(ws, pendingRequests);

    // الاستماع للرسائل
    ws.on('message', (message) => {
      handleMessage(message, ws, userSockets);
    });

    // عند قطع الاتصال
    ws.on('close', () => {
      userSockets.delete(ws.userId);
    });

  } catch (err) {
    ws.close(1011, 'Internal server error');
  }
}

module.exports = { handleConnection };
