import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface GroupDetails {
  _id: string;
  name: string;
  description: string;
  avatar: string;
  isPublic: boolean;
  tag: string;
  inviteLink: string;
  welcomeMessageText: string;
  welcomeMessageEnabled: boolean;
  autoDeleteMessagesAfterHours: number;
  points: number;
  creator: { _id: string; username: string; avatar: string | null };
  members: Array<{ _id: string; username: string; avatar: string | null }>;
  owners: Array<{ _id: string; username: string; avatar: string | null }>;
  admins: Array<{ _id: string; username: string; avatar: string | null }>;
  blocked: Array<{ _id: string; username: string; avatar: string | null }>;
  pinMessage: string | null;
  lastMessage: string | null;
}

interface FetchGroupDetailsResponse {
  type: string;
  group?: GroupDetails;
  message?: string;
}

export function useFetchGroupDetails() {
  const { ws } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: FetchGroupDetailsResponse = JSON.parse(event.data);

        if (data.type === 'fetch_group_details_success' && data.group) {
          setGroupDetails(data.group);
          setLoading(false);
          setError(null);
        }

        if (data.type === 'fetch_group_details_failed') {
          setError(data.message || 'فشل جلب تفاصيل المجموعة');
          setLoading(false);
          setGroupDetails(null);
        }
      } catch (err) {
        setError('حدث خطأ أثناء معالجة رد السيرفر');
        setLoading(false);
        setGroupDetails(null);
      }
    };

    ws.current.addEventListener('message', handleMessage);
    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  const fetchGroupDetails = (groupId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        setError('WebSocket غير متصل');
        return resolve(false);
      }

      if (!groupId.trim()) {
        setError('معرف المجموعة لا يمكن أن يكون فارغًا');
        return resolve(false);
      }

      setLoading(true);
      setError(null);
      setGroupDetails(null);

      const message = {
        type: 'fetch_group_details',
        groupId,
      };

      const handleMessage = (event: MessageEvent) => {
        try {
          const data: FetchGroupDetailsResponse = JSON.parse(event.data);

          if (data.type === 'fetch_group_details_success' && data.group?._id === groupId) {
            setGroupDetails(data.group);
            setLoading(false);
            setError(null);
            ws.current?.removeEventListener('message', handleMessage);
            resolve(true);
          } else if (data.type === 'fetch_group_details_failed') {
            setError(data.message || 'فشل جلب تفاصيل المجموعة');
            setLoading(false);
            setGroupDetails(null);
            ws.current?.removeEventListener('message', handleMessage);
            resolve(false);
          }
        } catch (err) {
          setError('حدث خطأ أثناء معالجة رد السيرفر');
          setLoading(false);
          setGroupDetails(null);
          ws.current?.removeEventListener('message', handleMessage);
          resolve(false);
        }
      };

      ws.current.addEventListener('message', handleMessage);
      ws.current.send(JSON.stringify(message));
    });
  };

  return {
    groupDetails,
    loading,
    error,
    fetchGroupDetails,
  };
}
