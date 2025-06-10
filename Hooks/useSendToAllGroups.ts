import { useWebSocket } from '@/context/WebSocketContext';

interface SendToAllGroupsPayload {
  type: 'send_message_to_all_groups';
  newMessage: string;
  messageType?: 'text' | 'image' | 'audio';
  tempId?: string;
  senderType?: 'user' | 'system';
}

export function useSendToAllGroups(currentUserId: string) {
  const { ws } = useWebSocket();

  const sendToAllGroups = (
    newMessageText: string,
    messageType: 'text' | 'image' | 'audio' = 'text',
    senderType: 'user' | 'system' = 'user'
  ) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;

    const tempId = `temp-${Date.now()}`;

    const payload: SendToAllGroupsPayload = {
      type: 'send_message_to_all_groups',
      newMessage: newMessageText,
      messageType,
      tempId,
      senderType,
    };

    ws.current.send(JSON.stringify(payload));
  };

  return { sendToAllGroups };
}
