import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface Group {
  _id: string;
  name: string;
  creator: string;
  members: string[];
  // أضف باقي الحقول حسب نموذج المجموعة لديك
}

interface AllGroupsResponse {
  type: string;
  groups?: Group[];
  message?: string;
}

export function useAllGroups(userId: string) {
  const { ws } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: AllGroupsResponse = JSON.parse(event.data);

        if (data.type === 'all_groups' && data.groups) {
          setGroups(data.groups);
          setError(null);
          setLoading(false);
        }

        if (data.type === 'get_all_groups_failed') {
          setError(data.message || 'فشل في جلب المجموعات');
          setLoading(false);
        }
      } catch (err) {
        setError('حدث خطأ أثناء معالجة البيانات');
        setLoading(false);
      }
    };

    ws.current.addEventListener('message', handleMessage);
    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  const fetchGroups = () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket غير متصل');
      return;
    }

    setLoading(true);
    setError(null);

    const message = {
      type: 'get_all_groups',
      userId,
    };

    ws.current.send(JSON.stringify(message));
  };

  return {
    groups,
    loading,
    error,
    fetchGroups,
  };
}
