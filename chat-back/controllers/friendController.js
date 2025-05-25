const User = require('../models/user');
const { sendNotification } = require('../websocket/chatServer');

// إرسال طلب صداقة
// exports.sendFriendRequest = async (req, res) => {
//   const fromUserId = req.userId;
//   const { toUsername } = req.body;

//   try {
//     const fromUser = await User.findById(fromUserId);
//     const toUser = await User.findOne({ username: toUsername });

//     if (!toUser) return res.status(404).json({ message: 'User not found' });
//     if (fromUser.friends.includes(toUser._id)) return res.status(400).json({ message: 'Already friends' });
//     if (fromUser.sentFriendRequests.includes(toUser._id)) return res.status(400).json({ message: 'Request already sent' });

//     fromUser.sentFriendRequests.push(toUser._id);
//     toUser.receivedFriendRequests.push(fromUser._id);

//     await fromUser.save();
//     await toUser.save();

//     sendNotification(toUser._id.toString(), {
//       type: 'friendRequestReceived',
//       from: fromUser.username,
//       fromUserId: fromUser._id.toString(),
//     });

//     res.json({ message: 'Friend request sent' });

//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// };

exports.sendFriendRequest = async (req, res) => {
  const fromUserId = req.userId;
  const { toUsername } = req.body;

  try {
    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findOne({ username: toUsername });

    if (!toUser) return res.status(404).json({ message: 'User not found' });

    if (fromUser._id.equals(toUser._id)) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    if (fromUser.friends.includes(toUser._id)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: fromUserId, receiver: toUser._id },
        { sender: toUser._id, receiver: fromUserId }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }

    await FriendRequest.create({ sender: fromUserId, receiver: toUser._id });

    sendNotification(toUser._id.toString(), {
      type: 'friendRequestReceived',
      from: fromUser.username,
      fromUserId: fromUser._id.toString(),
    });

    res.json({ message: 'Friend request sent' });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
// الرد على طلب الصداقة
exports.respondToFriendRequest = async (req, res) => {
  const toUserId = req.userId;
  const { fromUsername, accept } = req.body;

  try {
    const toUser = await User.findById(toUserId);
    const fromUser = await User.findOne({ username: fromUsername });

    if (!fromUser) return res.status(404).json({ message: 'User not found' });
    if (!toUser.receivedFriendRequests.includes(fromUser._id)) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }

    toUser.receivedFriendRequests = toUser.receivedFriendRequests.filter(id => !id.equals(fromUser._id));
    fromUser.sentFriendRequests = fromUser.sentFriendRequests.filter(id => !id.equals(toUser._id));

    if (accept) {
      toUser.friends.push(fromUser._id);
      fromUser.friends.push(toUser._id);
    }

    await toUser.save();
    await fromUser.save();

    sendNotification(fromUser._id.toString(), {
      type: 'friendRequestResponse',
      to: toUser.username,
      accepted: accept,
    });

    sendNotification(toUser._id.toString(), {
      type: 'friendRequestResponseResult',
      from: fromUser.username,
      accepted: accept,
    });

    res.json({ message: accept ? 'Friend request accepted' : 'Friend request rejected' });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// جلب طلبات الصداقة الواردة للمستخدم
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId)
      .populate('receivedFriendRequests', '_id username');  // إحضار بيانات المرسل

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user.receivedFriendRequests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
