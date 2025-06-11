import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
type SensitiveInfoUpdates = Partial<{
  password: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  birthday: string;
  country: string;
}>;

export function useSensitiveInfoUpdater() {
  const { ws } = useWebSocket();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'sensitive_info_updated_successfully':
            setSuccessMessage('تم تحديث البيانات الحساسة بنجاح');
            break;

          case 'error':
            setErrorMessage(data.message || 'حدث خطأ غير معروف');
            break;

          case 'sensitive_info_update_failed':
            setErrorMessage(data.error || 'فشل في تحديث البيانات الحساسة');
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('خطأ في تحليل رسالة WebSocket:', err);
      }
    };

    ws.current.addEventListener('message', handleMessage);

    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  const updateSensitiveInfo = (currentPassword: string, updates: SensitiveInfoUpdates) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    ws.current?.send(
      JSON.stringify({
        type: 'update_sensitive_info',
        currentPassword,
        updates,
      })
    );
  };

  return {
    updateSensitiveInfo,
    successMessage,
    errorMessage,
  };
}
