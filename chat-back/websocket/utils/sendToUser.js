
//websocket/utils/sendToUser.js
function sendToUser(userSockets, userId, data) {
  const ws = userSockets.get(userId);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function sendFriendRequestList(ws, requests) {
  ws.send(JSON.stringify({
    type: 'friend_requests_list',
    requests: requests.map(r => ({
      id: r._id,
      fromUserId: r.sender._id,
      fromUsername: r.sender.username,
    })),
  }));
}

module.exports = { sendToUser, sendFriendRequestList };
