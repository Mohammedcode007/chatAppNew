import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

type Status = 'online' | 'offline' | 'busy';

export function useUserStatus(initialStatus?: Status) {
  const { ws } = useWebSocket();
  const [status, setStatus] = useState<Status | null>(initialStatus || null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'status_updated_successfully':
            setStatus(data.status);
            setNotifications((prev) => [...prev, 'تم تحديث الحالة بنجاح']);
            setLoading(false);
            setError(null);
            break;

          case 'status_update_failed':
            setError(data.message || 'فشل تحديث الحالة');
            setLoading(false);
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('خطأ في تحليل رسالة WebSocket:', err);
        setError('خطأ في معالجة رد السيرفر');
        setLoading(false);
      }
    };

    ws.current.addEventListener('message', handleMessage);

    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  // دالة لتحديث الحالة مع التوكن
  const updateStatus = (newStatus: Status, token: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket غير متصل');
      return;
    }

    if (!['online', 'offline', 'busy'].includes(newStatus)) {
      setError('حالة غير صحيحة');
      return;
    }

    setLoading(true);
    setError(null);

    const message = {
      type: 'update_status',
      status: newStatus,
      token,
    };

    ws.current.send(JSON.stringify(message));
  };

  return { status, notifications, error, loading, updateStatus };
}
