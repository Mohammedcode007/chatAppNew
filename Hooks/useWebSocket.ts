import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

type FriendRequest = {
  fromUserId: string;
  fromUsername: string;
};

type FriendRequestResponse = {
  accepted: boolean;
  fromUserId: string;
};

export function useFriendRequests() {
  const { ws } = useWebSocket();

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

 useEffect(() => {
  if (!ws.current) return;

  const sendGetRequests = () => {
    ws.current?.send(JSON.stringify({ type: 'get_friend_requests' }));
    ws.current?.send(JSON.stringify({ type: 'get_notifications' })); // ⬅️ لجلب الإشعارات عند الاتصال
  };

  const handleOpen = () => {
    sendGetRequests();
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'friend_requests_list':
          setFriendRequests(data.requests || []);
          break;

        case 'friend_request_received':
          setFriendRequests((prev) => [
            ...prev,
            {
              fromUserId: data.fromUserId,
              fromUsername: data.fromUsername,
            },
          ]);
          setNotifications((prev) => [
            ...prev,
            `طلب صداقة جديد من ${data.fromUsername}`,
          ]);
          break;

        case 'friend_request_result':
          setNotifications((prev) => [
            ...prev,
            `تم ${data.accepted ? 'قبول' : 'رفض'} طلب الصداقة من المستخدم ${data.fromUserId}`,
          ]);
          setFriendRequests((prev) =>
            prev.filter((req) => req.fromUserId !== data.fromUserId)
          );
          break;

        case 'notifications_list': // ⬅️ معالجة الإشعارات المخزنة
          if (Array.isArray(data.notifications)) {
            const texts = data.notifications.map((n: { type: string; data: { fromUsername: any; }; }) => {
              if (n.type === 'friend_request') {
                return `طلب صداقة جديد من ${n.data.fromUsername}`;
              }
              return 'إشعار جديد';
            });
            setNotifications((prev) => [...prev, ...texts]);
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

  if (ws.current.readyState === WebSocket.OPEN) {
    sendGetRequests();
  } else {
    ws.current.addEventListener('open', handleOpen);
  }

  return () => {
    ws.current?.removeEventListener('message', handleMessage);
    ws.current?.removeEventListener('open', handleOpen);
  };
}, [ws]);


  const sendFriendRequest = (toUserId: string) => {
    ws.current?.send(
      JSON.stringify({
        type: 'friend_request_sent',
        toUserId,
      })
    );
  };

  const respondToFriendRequest = (fromUserId: string, accepted: boolean) => {
    ws.current?.send(
      JSON.stringify({
        type: 'friend_request_response',
        toUserId: fromUserId,
        accepted,
      })
    );
    setFriendRequests((prev) =>
      prev.filter((req) => req.fromUserId !== fromUserId)
    );
  };

  return {
    friendRequests,
    notifications,
    sendFriendRequest,
    respondToFriendRequest,
  };
}
