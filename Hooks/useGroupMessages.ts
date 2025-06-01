import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface Message {
  _id: string;
  messageType: string;
  type: 'text' | 'image' | 'audio';
  text: string;
  sender: string;
  timestamp: string;
  groupId?: string;
  tempId?: string;
}

interface GroupMessagesResponse {
  type: string;
  groupId?: string;
  messages?: Message[];
  message?: string;
  newMessage?: Message;
  tempId?: string;
}

interface SendMessagePayload {
  type: string;
  groupId: string;
  newMessage: string;
  messageType?: string;
  tempId?: string;
}

export function useGroupMessages(groupId: string, currentUserId: string) {
  const { ws } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ws.current || !groupId) return;

    const fetchMessages = () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'fetch_group_messages', groupId }));
        setLoading(true);
      }
    };

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: GroupMessagesResponse = JSON.parse(event.data);
        const messageGroupId = data.groupId || data.newMessage?.groupId;

        if (messageGroupId !== groupId) return;

        switch (data.type) {
          case 'fetch_group_messages_success':
            if (data.messages) {
              setMessages(data.messages);
              setLoading(false);
              setError(null);
            }
            break;

          case 'fetch_group_messages_failed':
            setError(data.message || 'فشل في جلب الرسائل');
            setLoading(false);
            break;

          case 'group_message_sent_confirmation':
            if (data.newMessage && data.tempId) {
              setMessages((prev) => {
                // إزالة الرسالة المؤقتة التي تم إرسالها
                const filtered = prev.filter((msg) => msg.tempId !== data.tempId);
                // دمج الرسالة الجديدة في القائمة
                const updated = [...filtered, data.newMessage!];
                // فرز الرسائل حسب الوقت
                updated.sort(
                  (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
                return updated;
              });
            }
            break;

       case 'new_group_message':
  if (data.newMessage) {
    console.log(data,'888888');
    
    setMessages((prev) => {
      if (prev.find((msg) => msg._id === data.newMessage!._id)) return prev;
      const updated = [...prev, data.newMessage!];
      updated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return updated;
    });
  }
  break;

          default:
            break;
        }
      } catch (err) {
        console.error('خطأ في معالجة رسالة WebSocket:', err);
      }
    };

    ws.current.addEventListener('message', handleMessage);

    // جلب الرسائل عند دخول المجموعة لأول مرة
    fetchMessages();

    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [groupId, ws]);

  const sendMessage = (newMessageText: string, messageType: string = 'text') => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      _id: tempId,
      text: newMessageText,
      type: messageType as 'text' | 'image' | 'audio',
      sender: currentUserId,
      timestamp: new Date().toISOString(),
      groupId,
      messageType,
      tempId,
    };

    // عرض الرسالة مؤقتًا فور الإرسال
    setMessages((prev) => [...prev, tempMessage]);

    const payload: SendMessagePayload = {
      type: 'send_group_message',
      groupId,
      newMessage: newMessageText,
      messageType,
      tempId,
    };

    ws.current.send(JSON.stringify(payload));
  };

  return { messages, loading, error, sendMessage };
}
