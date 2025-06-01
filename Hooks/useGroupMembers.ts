import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface Member {
  _id: string;
  username: string;
  avatar?: string;
  // أضف أي خصائص إضافية هنا
}

interface GroupMembersResponse {
  type: string;
  groupId?: string;
  members?: Member[];
  message?: string;
}

export function useGroupMembers(groupId: string | null) {
  const { ws } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!ws.current || !groupId) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: GroupMembersResponse = JSON.parse(event.data);

        if (data.type === 'group_members' && data.groupId === groupId) {
          setMembers(data.members || []);
          setLoading(false);
          setError(null);
        }

        if (data.type === 'get_group_members_failed' && data.groupId === groupId) {
          setError(data.message || 'فشل في جلب الأعضاء');
          setLoading(false);
        }
      } catch (err) {
        setError('حدث خطأ أثناء معالجة رد السيرفر');
        setLoading(false);
      }
    };

    ws.current.addEventListener('message', handleMessage);

    // طلب جلب الأعضاء عند توفر groupId
    setLoading(true);
    setError(null);
    setMembers([]);

    const request = {
      type: 'get_group_members',
      groupId,
    };

    ws.current.send(JSON.stringify(request));

    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [groupId, ws]);

  return {
    members,
    loading,
    error,
  };
}
