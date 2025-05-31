import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface CreateGroupResponse {
  type: string;
  group?: any;
  message?: string;
}

export function useCreateGroup(userId: string, token: string | null) {
  const { ws } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [group, setGroup] = useState<any>(null);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: CreateGroupResponse = JSON.parse(event.data);

        if (data.type === 'create_group_success' && data.group) {
          setGroup(data.group);
          setSuccessMessage('تم إنشاء المجموعة بنجاح');
          setLoading(false);
          setError(null);
        }

        if (data.type === 'create_group_failed') {
          setError(data.message || 'فشل إنشاء المجموعة');
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

  const createGroup = (groupName: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket غير متصل');
      return;
    }

    if (!groupName.trim()) {
      setError('اسم المجموعة لا يمكن أن يكون فارغًا');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setGroup(null);

    const message = {
      type: 'create_group',
      groupName,
      userId,
      token,
    };

    ws.current.send(JSON.stringify(message));
  };

  return {
    group,
    loading,
    error,
    successMessage,
    createGroup,
  };
}
