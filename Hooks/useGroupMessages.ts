import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface Message {
  _id: string;
  messageType: string;
  type: 'text' | 'image' | 'audio';
  text: string;
  sender: string;
  timestamp: string;  // ISO string
  groupId?: string;
}

interface GroupMessagesResponse {
  type: string;
  groupId?: string;
  messages?: Message[];
  message?: string;
  newMessage?: Message;
  tempId?: string;  // معرف الرسالة المؤقتة لتحديثها
}

interface SendMessagePayload {
  type: string;
  groupId: string;
  newMessage: string;  // نص الرسالة فقط
  messageType?: string;
  tempId?: string; // معرف مؤقت من العميل
}

export function useGroupMessages(groupId: string, currentUserId: string) {
  const { ws } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ws.current || !groupId) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: GroupMessagesResponse = JSON.parse(event.data);

        if (data.groupId !== groupId) return; // تجاهل رسائل مجموعات أخرى

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
            if (data.newMessage) {
              setMessages(prev => {
                // استبدال الرسالة المؤقتة بالرسالة الأصلية أو إضافتها إذا غير موجودة
                const exists = prev.some(msg => msg._id === data.newMessage!._id);
                if (exists) {
                  return prev.map(msg =>
                    msg._id === data.tempId ? data.newMessage! : msg
                  );
                } else {
                  // حذف الرسالة المؤقتة ثم إضافة الرسالة الرسمية
                  const filtered = prev.filter(msg => msg._id !== data.tempId);
                  return [...filtered, data.newMessage!];
                }
              });
            }
            break;

          case 'new_group_message':
            if (data.newMessage) {
              setMessages(prev => {
                // منع التكرار
                const exists = prev.some(msg => msg._id === data.newMessage!._id);
                if (exists) return prev;
                return [...prev, data.newMessage!];
              });
            }
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.current.addEventListener('message', handleMessage);

    // طلب جلب الرسائل عند الانضمام للمجموعة
    ws.current.send(JSON.stringify({ type: 'fetch_group_messages', groupId }));

    setLoading(true);
    setError(null);

    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [groupId, ws]);

  // دالة إرسال رسالة جديدة للمجموعة
  const sendMessage = (newMessageText: string, messageType: string = 'text') => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const tempId = `temp-${Date.now()}`;

    // إضافة رسالة مؤقتة للواجهة فوراً
    const tempMessage: Message = {
      _id: tempId,
      text: newMessageText,
      type: messageType as 'text' | 'image' | 'audio',
      sender: currentUserId,
      timestamp: new Date().toISOString(),
      groupId,
      messageType,
    };

    setMessages(prev => [...prev, tempMessage]);

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
