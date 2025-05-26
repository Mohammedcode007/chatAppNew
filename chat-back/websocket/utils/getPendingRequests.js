
//websocket/utils/getPendingRequests.js

const FriendRequest = require('../../models/friendRequest');

async function getPendingFriendRequests(userId) {
  return await FriendRequest.find({ receiver: userId }).populate('sender', 'username');
}

module.exports = { getPendingFriendRequests };
