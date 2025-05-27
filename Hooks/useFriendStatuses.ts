// hooks/useFriendStatuses.ts
import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

type Status = 'online' | 'offline' | 'busy';

type FriendStatuses = {
  [userId: string]: Status;
};

export function useFriendStatuses() {
  const { ws } = useWebSocket();
  const [friendStatuses, setFriendStatuses] = useState<FriendStatuses>({});

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'friend_status_updated') {
          const { userId, status } = data;

          setFriendStatuses(prev => ({
            ...prev,
            [userId]: status,
          }));
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.current.addEventListener('message', handleMessage);

    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  return { friendStatuses };
}
