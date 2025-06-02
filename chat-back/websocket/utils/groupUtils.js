// path: utils/groupUtils.js

async function updateGroupMembers(groupId, userSockets) {
  const User = require('../../models/user');
  const Group = require('../../models/group');

  const group = await Group.findById(groupId).lean();
  if (!group) return;

  const membersData = await User.find(
    { _id: { $in: group.members } },
    '_id username avatar'
  ).lean();

  group.members.forEach(memberId => {
    const memberIdStr = memberId.toString();
    const userWs = userSockets.get(memberIdStr);
    if (userWs && userWs.readyState === userWs.OPEN) {
      userWs.send(JSON.stringify({
        type: 'group_members',
        groupId,
        members: membersData,
      }));
    }
  });
}

module.exports = { updateGroupMembers };
