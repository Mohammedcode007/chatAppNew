export const isUserBlocked = (receiver, senderId) => {
  return receiver.blockedUsers.includes(senderId.toString());
};
