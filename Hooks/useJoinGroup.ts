import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface JoinGroupResponse {
  type: string;
  groupId?: string;
  message?: string;
}

export function useJoinGroup(userId: string) {
  const { ws } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: JoinGroupResponse = JSON.parse(event.data);

        if (data.type === 'join_group_success' && data.groupId) {
          setJoinedGroupId(data.groupId);
          setSuccessMessage('تم الانضمام إلى المجموعة بنجاح');
          setLoading(false);
          setError(null);
        }

        if (data.type === 'join_group_failed') {
          setError(data.message || 'فشل الانضمام إلى المجموعة');
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

  const joinGroup = (groupId: string) => {
    
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket غير متصل');
      return;
    }

    if (!groupId.trim()) {
      setError('معرف المجموعة لا يمكن أن يكون فارغًا');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setJoinedGroupId(null);

    const message = {
      type: 'join_group',
      groupId,
      userId,
    };

    ws.current.send(JSON.stringify(message));
  };

  return {
    joinedGroupId,
    loading,
    error,
    successMessage,
    joinGroup,
  };
}
