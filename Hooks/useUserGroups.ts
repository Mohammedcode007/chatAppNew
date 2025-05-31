import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface UserGroupsResponse {
  type: string;
  groups?: any[];
  message?: string;
}

export function useUserGroups(userId: string) {
  const { ws } = useWebSocket();
  const [groups, setGroups] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: UserGroupsResponse = JSON.parse(event.data);

        if (data.type === 'get_user_groups_success' && data.groups) {
          setGroups(data.groups);
          setError(null);
          setLoading(false);
        }

        if (data.type === 'get_user_groups_failed') {
          setError(data.message || 'فشل في جلب المجموعات التي تنتمي إليها');
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

  const fetchUserGroups = () => {
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
      type: 'get_user_groups',
      userId,
    };

    ws.current.send(JSON.stringify(message));
  };

  return {
    groups,
    loading,
    error,
    fetchUserGroups,
  };
}
