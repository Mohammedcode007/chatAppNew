import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface FavoriteGroupsResponse {
  type: string;
  groups?: any[];
  message?: string;
}

export function useFavoriteGroups(userId: string) {

  const { ws } = useWebSocket();
  const [groups, setGroups] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: FavoriteGroupsResponse = JSON.parse(event.data);

        if (data.type === 'get_favorite_groups_success' && data.groups) {
          setGroups(data.groups);
          setError(null);
          setLoading(false);
        }

        if (data.type === 'get_favorite_groups_failed') {
          setError(data.message || 'فشل في جلب المجموعات المفضلة');
          setLoading(false);
        }
      } catch (err) {
        setError('حدث خطأ أثناء معالجة رد السيرفر');
        setLoading(false);
      }
    };

    ws.current.addEventListener('message', handleMessage);
    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  const fetchFavoriteGroups = () => {
    if (!userId) {
      setError('معرف المستخدم غير متوفر');
      return;
    }

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket غير متصل');
      return;
    }

    setLoading(true);
    setError(null);
    setGroups(null);

    const message = {
      type: 'get_favorite_groups',
      userId,
    };

    console.log('إرسال الرسالة:', message);
    ws.current.send(JSON.stringify(message));
  };

  return {
    groups,
    loading,
    error,
    fetchFavoriteGroups,
  };
}
