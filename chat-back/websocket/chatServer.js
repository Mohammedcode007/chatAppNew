const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const User = require('../models/user');
const { JWT_SECRET } = require('../config');

const userSockets = new Map(); // Map<userId, WebSocket>

function createFriendRequestServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws, req) => {
    console.log('Full request URL:', req.url);

  try {
const urlParts = req.url.split('?');
const queryString = urlParts[1] || '';
const params = new URLSearchParams(queryString);
const token = params.get('token');
console.log('Extracted token:', token);

    if (!token) {
      ws.close(1008, 'Missing token');
      return;
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
      console.log('Token payload:', payload);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      ws.close(1008, 'Invalid token');
      return;
    }

    const user = await User.findById(payload.id);
    if (!user) {
      console.log('User not found with id:', payload.id);
      ws.close(1008, 'Invalid user');
      return;
    }

    ws.userId = user._id.toString();
    userSockets.set(ws.userId, ws);

    ws.on('message', (message) => {
      let msg;
      try {
        msg = JSON.parse(message);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'friend_request_sent':
          sendToUser(msg.toUserId, {
            type: 'friend_request_received',
            fromUserId: ws.userId,
            fromUsername: user.username
          });
          break;

        case 'friend_request_response':
          sendToUser(msg.toUserId, {
            type: 'friend_request_result',
            fromUserId: ws.userId,
            accepted: msg.accepted
          });
          break;

        default:
          break;
      }
    });

    ws.on('close', () => {
      userSockets.delete(ws.userId);
    });
  } catch (err) {
    console.error('WebSocket unexpected error:', err);
    ws.close(1011, 'Internal server error');
  }
});


  return wss;
}

function sendToUser(userId, data) {
  const ws = userSockets.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

module.exports = { createFriendRequestServer };
