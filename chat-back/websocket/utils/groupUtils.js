// path: utils/groupUtils.js

const mongoose = require('mongoose');
const Group = require('../../models/group');
const User = require('../../models/user');
const GroupMessage = require('../../models/GroupMessage');




async function updateGroupMembers(groupId, userSockets) {
  const User = require('../../models/user');
  const Group = require('../../models/group');

  console.log('🔵 [updateGroupMembers] groupId:', groupId);

  const group = await Group.findById(groupId).lean();
  if (!group) {
    console.log('❌ [updateGroupMembers] Group not found');
    return [];
  }

  console.log('📦 [updateGroupMembers] group.members:', group.members);

  if (!group.members || group.members.length === 0) {
    console.log('⚠️ [updateGroupMembers] Group has no members');
    return [];
  }

  const memberObjectIds = group.members.map(id => {
    try {
      return new mongoose.Types.ObjectId(id);
    } catch (err) {
      console.log(`❌ [updateGroupMembers] Invalid memberId: ${id}`);
      return null;
    }
  }).filter(Boolean);

  console.log('🧪 [updateGroupMembers] memberObjectIds:', memberObjectIds);

  const membersData = await User.find(
    { _id: { $in: memberObjectIds } },
    '_id username avatar'
  ).lean();

  console.log('👥 [updateGroupMembers] Loaded membersData:', membersData);

  group.members.forEach(memberId => {
    const memberIdStr = memberId.toString();
    const userWs = userSockets.get(memberIdStr);

    console.log(`➡️ [updateGroupMembers] Sending to memberId: ${memberIdStr}`);
    console.log('🧪 WebSocket status:', userWs?.readyState);

    if (userWs && userWs.readyState === userWs.OPEN) {
      userWs.send(JSON.stringify({
        type: 'group_members',
        groupId,
        members: membersData,
      }));
    } else {
      console.log(`⚠️ [updateGroupMembers] User ${memberIdStr} not connected`);
    }
  });

  return membersData; // ✅ إرجاع قائمة الأعضاء هنا
}


async function broadcastAllGroups(userSockets) {
  const Group = require('../../models/group');
  try {
    const groups = await Group.find({});
    userSockets.forEach((userWs, userId) => {
      if (userWs.readyState === userWs.OPEN) {
        userWs.send(JSON.stringify({
          type: 'all_groups',
          groups,
        }));
      }
    });
  } catch (error) {
    console.error('فشل في إرسال all_groups:', error);
  }
}


const updateGroupRole = async ({ groupId, actorUserId, targetUserId, roleType, roleAction, userSockets, sendToUser }) => {
  console.log('🔁 Starting role update');
  console.log('Received data:', { groupId, actorUserId, targetUserId, roleType, roleAction });

  const group = await Group.findById(groupId);
  if (!group) {
    console.log('❌ Group not found');
    throw new Error('Group not found');
  }

  const isCreator = group.creator.toString() === actorUserId.toString();
  const isOwner = group.owners.some(id => id.toString() === actorUserId.toString());
  const isAdmin = group.admins.some(id => id.toString() === actorUserId.toString());

  const roleMap = {
    creator: { canAdd: ['owner', 'admin', 'block'], canRemove: ['owner', 'admin', 'block'] },
    owner: { canAdd: ['admin', 'block'], canRemove: ['admin', 'block'] },
    admin: { canAdd: ['block'], canRemove: ['block'] },
    member: { canAdd: [], canRemove: [] },
  };

  let actorRole = 'member';
  if (isCreator) actorRole = 'creator';
  else if (isOwner) actorRole = 'owner';
  else if (isAdmin) actorRole = 'admin';

  const allowedActions = roleMap[actorRole];
  const canModify = roleAction === 'add'
    ? allowedActions.canAdd.includes(roleType)
    : allowedActions.canRemove.includes(roleType);

  if (!canModify) {
    throw new Error('You do not have permission to modify this role');
  }

  if (roleType === 'creator' && !isCreator) {
    throw new Error('Only the creator can manage the creator role');
  }

  const allRoles = ['creator', 'owner', 'admin', 'block'];
  const idStr = targetUserId.toString();

  // دالة مساعدة لإزالة المستخدم من أي قائمة أدوار
  function removeUserFromRole(role) {
    const arr = group[role + 's'] || [];
    const idx = arr.findIndex(id => id.toString() === idStr);
    if (idx !== -1) arr.splice(idx, 1);
  }

  const members = group.members || [];

  if (roleAction === 'add') {
    if (roleType === 'block') {
      // إزالة من كل الأدوار + الأعضاء (member) عند الحظر
      allRoles.concat(['member']).forEach(r => removeUserFromRole(r));

      // إضافة الحظر
      group.blocked = group.blocked || [];
      if (!group.blocked.some(id => id.toString() === idStr)) {
        group.blocked.push(targetUserId);
      }
    } else {
      // إزالة المستخدم من جميع الأدوار السابقة (creator, owner, admin, block) قبل الإضافة
      allRoles.forEach(r => removeUserFromRole(r));

      // إضافة الدور الجديد
      const roleArray = group[roleType + 's'] || [];
      if (!roleArray.some(id => id.toString() === idStr)) {
        roleArray.push(targetUserId);
        group[roleType + 's'] = roleArray;
      }

      // إضافة العضو إلى قائمة الأعضاء members إذا غير موجود
      if (!members.some(id => id.toString() === idStr)) {
        members.push(targetUserId);
        group.members = members;
      }
    }
  } else { // roleAction === 'remove'
    if (roleType === 'block') {
      // إزالة الحظر
      removeUserFromRole('block');

      // إعادة المستخدم لقائمة الأعضاء members إذا غير موجود
      if (!members.some(id => id.toString() === idStr)) {
        members.push(targetUserId);
        group.members = members;
      }
    } else {
      // إزالة الدور فقط
      removeUserFromRole(roleType);
    }
  }

  // تسجيل الحدث في سجل المجموعة
  group.logs.push({
    user: actorUserId,
    action: `${roleAction === 'add' ? 'Added' : 'Removed'} ${roleType} role for ${targetUserId}`,
    timestamp: new Date(),
  });

  // جلب بيانات المستخدمين لتكوين رسالة النظام
  const [actorUser, targetUser] = await Promise.all([
    User.findById(actorUserId),
    User.findById(targetUserId)
  ]);

  const roleIcons = {
    creator: '👑',
    owner: '⭐',
    admin: '🛡️',
    block: '⛔',
  };

  const actionVerbs = {
    add: 'added',
    remove: 'removed',
  };

  const systemText = `${actorUser?.username || 'Someone'} ${actionVerbs[roleAction]} role ${roleIcons[roleType] || ''} ${roleType} for ${targetUser?.username || 'someone'}.`;

  const systemMessage = new GroupMessage({
    groupId,
    sender: null,
    senderType: 'system',
    type: 'text',
    text: systemText,
    timestamp: new Date(),
    status: 'sent',
  });

  await systemMessage.save();

  group.messages.push(systemMessage._id);
  group.lastMessage = systemMessage._id;
  await group.save();

  // إعداد الرسالة للإرسال
  const messageToSend = {
    _id: systemMessage._id.toString(),
    sender: null,
    groupId: groupId.toString(),
    text: systemText,
    messageType: 'text',
    senderType: 'system',
    timestamp: systemMessage.timestamp.toISOString(),
    status: 'sent',
    icon: roleIcons[roleType] || '',
  };

  // إرسال الرسالة لكل أعضاء المجموعة المتصلين
  if (group.members && Array.isArray(group.members)) {
    group.members.forEach(memberId => {
      const memberIdStr = memberId.toString();
      const userWs = userSockets.get(memberIdStr);
      if (userWs && userWs.readyState === userWs.OPEN) {
        userWs.send(JSON.stringify({
          type: 'new_group_message',
          groupId: groupId.toString(),
          newMessage: messageToSend,
          receiver: memberIdStr,
        }));
      }
    });
  } else {
    console.warn('Group members field is missing or not an array');
  }

  console.log('✅ Role update saved and system message with icon sent');
};





module.exports = { updateGroupMembers, broadcastAllGroups, updateGroupRole };
