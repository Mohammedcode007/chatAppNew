import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

export function useUserFetcherById(userId: string | null) {
  const { ws } = useWebSocket();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ws.current || !userId) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'user_data_by_id':
            setUserData(data.user);
            setLoading(false);
            break;

          case 'error':
            setErrorMessage(data.message || 'حدث خطأ أثناء جلب المستخدم');
            setLoading(false);
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('خطأ في تحليل رسالة WebSocket:', err);
        setErrorMessage('حدث خطأ في الاتصال');
        setLoading(false);
      }
    };

    ws.current.addEventListener('message', handleMessage);

    // إرسال الطلب
    setLoading(true);
    setUserData(null);
    setErrorMessage(null);

    ws.current.send(
      JSON.stringify({
        type: 'get_user_by_id',
        userId,
      })
    );

    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [ws, userId]);

  return {
    userData,
    loading,
    errorMessage,
  };
}
