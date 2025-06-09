import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface AddMembersResponse {
  type: string;
  groupId?: string;
  message?: string;
  added?: string[];
}

export function useAddMembersToGroup(actorUserId: string) {
  const { ws } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [addedUserIds, setAddedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: AddMembersResponse = JSON.parse(event.data);

        if (data.type === 'add_members_success') {
          setAddedUserIds(data.added || []);
          setSuccessMessage(data.message || 'تمت إضافة الأعضاء بنجاح');
          setError(null);
          setLoading(false);
        }

        if (data.type === 'add_members_failed') {
          setError(data.message || 'فشل في إضافة الأعضاء');
          setSuccessMessage(null);
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

  const addMembers = (groupId: string, userIds: string[]): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        setError('WebSocket غير متصل');
        return resolve(false);
      }

      if (!groupId.trim() || !actorUserId || userIds.length === 0) {
        setError('يرجى تحديد معرف المجموعة والمستخدمين');
        return resolve(false);
      }

      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      setAddedUserIds([]);

      const message = {
        type: 'add_members_to_group',
        groupId,
        actorUserId,
        userIds,
      };

      const handleMessage = (event: MessageEvent) => {
        try {
          const data: AddMembersResponse = JSON.parse(event.data);

          if (data.type === 'add_members_success' && data.groupId === groupId) {
            setAddedUserIds(data.added || []);
            setSuccessMessage(data.message || 'تمت إضافة الأعضاء بنجاح');
            setLoading(false);
            setError(null);
            ws.current?.removeEventListener('message', handleMessage);
            resolve(true);
          } else if (data.type === 'add_members_failed' && data.groupId === groupId) {
            setError(data.message || 'فشل في إضافة الأعضاء');
            setSuccessMessage(null);
            setLoading(false);
            ws.current?.removeEventListener('message', handleMessage);
            resolve(false);
          }
        } catch (err) {
          setError('حدث خطأ أثناء معالجة رد السيرفر');
          setLoading(false);
          ws.current?.removeEventListener('message', handleMessage);
          resolve(false);
        }
      };

      ws.current.addEventListener('message', handleMessage);
      ws.current.send(JSON.stringify(message));
    });
  };

  return {
    addMembers,
    loading,
    error,
    successMessage,
    addedUserIds,
  };
}
