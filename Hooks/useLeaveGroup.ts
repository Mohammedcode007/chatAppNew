import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface LeaveGroupResponse {
  type: string;
  groupId?: string;
  message?: string;
}

export function useLeaveGroup(userId: string) {
  const { ws } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [leftGroupId, setLeftGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: LeaveGroupResponse = JSON.parse(event.data);

        if (data.type === 'leave_group_success' && data.groupId) {
          setLeftGroupId(data.groupId);
          setSuccessMessage('تم الخروج من المجموعة بنجاح');
          setLoading(false);
          setError(null);
        }

        if (data.type === 'leave_group_failed') {
          setError(data.message || 'فشل الخروج من المجموعة');
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

  const leaveGroup = (groupId: string) => {
    console.log(groupId);
    
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket غير متصل');
      return;
    }

    if (!groupId) {
      setError('معرف المجموعة غير صالح');
      return;
    }

    if (!userId) {
      setError('معرف المستخدم غير صالح');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setLeftGroupId(null);

    const message = {
      type: 'leave_group',
      groupId,
      userId,
    };

    ws.current.send(JSON.stringify(message));
  };

  return {
    leftGroupId,
    loading,
    error,
    successMessage,
    leaveGroup,
  };
}
