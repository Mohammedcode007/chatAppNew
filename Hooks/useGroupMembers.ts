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
    if (!ws.current || ws.current.readyState !== 1) return;
    if (!groupId) return;

    setLoading(true);
    setError(null);

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: GroupMembersResponse = JSON.parse(event.data);

        // طباعة الرد من السيرفر

        if (data.type === 'group_members' && data.groupId === groupId) {
                  console.log('Received WebSocket message:5', data);

          setMembers(data.members ?? []);
          setLoading(false);
          setError(null);
        }

        if (data.type === 'get_group_members_failed' && data.groupId === groupId) {
          setError(data.message ?? 'حدث خطأ في جلب الأعضاء.');
          setLoading(false);
        }
      } catch {
        setError('خطأ في معالجة بيانات الخادم.');
        setLoading(false);
      }
    };

    ws.current.addEventListener('message', handleMessage);

    ws.current.send(
      JSON.stringify({
        type: 'get_group_members',
        groupId,
      })
    );

    return () => {
      if (ws.current) {
        ws.current.removeEventListener('message', handleMessage);
      }
      setMembers([]);
      setError(null);
      setLoading(false);
    };
  }, [ws, groupId]);


  return { members, loading, error };
}
