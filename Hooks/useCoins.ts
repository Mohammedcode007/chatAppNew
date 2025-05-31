import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface CoinsResponse {
  type: string;
  coins?: number;
  message?: string;
}

export function useCoins(userId: string, token: string | null) {
  const { ws } = useWebSocket();
  const [coins, setCoins] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: CoinsResponse = JSON.parse(event.data);

        if (data.type === 'coins_info' && typeof data.coins === 'number') {
          setCoins(data.coins);
          setLoading(false);
          setError(null);
          setNotifications((prev) => [...prev, 'تم تحديث عدد العملات']);
        }

        if (data.type === 'update_coins_failed') {
          setError(data.message || 'فشل تحديث العملات');
          setLoading(false);
        }
      } catch (err) {
        setError('خطأ في معالجة رد السيرفر');
        setLoading(false);
      }
    };

    ws.current.addEventListener('message', handleMessage);

    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  // دالة لجلب أو تحديث عدد العملات
  const updateCoins = (newCoins?: number) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket غير متصل');
      return;
    }

    setLoading(true);
    setError(null);

    const message: any = {
      type: 'update_or_get_coins',
      userId,
      token,
    };

    if (typeof newCoins === 'number') {
      message.newCoins = newCoins;
    }

    ws.current.send(JSON.stringify(message));
  };

  // جلب العملات عند بداية الاستخدام تلقائيًا (اختياري)
  useEffect(() => {
    if (userId && token) {
      updateCoins(); // بدون قيمة لإرسال طلب جلب فقط
    }
  }, [userId, token]);

  return { coins, loading, error, notifications, updateCoins };
}
