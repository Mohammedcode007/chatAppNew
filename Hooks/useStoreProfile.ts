import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface StoreProfileResponse {
  type: string;
  message?: string;
  profile?: any;
}

interface StoreProfileUpdatePayload {
  userId: string;
  inventory?: any;
  purchaseHistory?: any;
  selectedAvatar?: string | null;
  selectedFrame?: string | null;
  selectedEffect?: string | null;
  selectedBackground?: string | null;
  customUsernameColor?: string;
  badge?: string;
  activeCustomBadge?: string;
  subscription?: any;
  specialWelcomeMessage?: string;
  purchasedRoomFeatures?: string[];
  selectedRoomBadge?: string;
  roomBadge?: string;
  customBadge?: string;
  purchasedUserFeatures?: string[];
    verified?: boolean; // ✅ تمت إضافته هنا

  cost?: number;  // إضافة cost هنا كحقل اختياري
}

export function useStoreProfile(userId: string, token: string | null) {
  const { ws } = useWebSocket();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: StoreProfileResponse = JSON.parse(event.data);

        if (data.type === 'update_store_profile_success' && data.profile) {
          setProfile(data.profile);
          setLoading(false);
          setError(null);
          setNotifications((prev) => [...prev, data.message || 'تم تحديث البروفايل بنجاح']);
        }

        if (data.type === 'update_store_profile_failed') {
          setError(data.message || 'فشل في تحديث بيانات المتجر');
          setLoading(false);
        }
      } catch (err) {
        setError('حدث خطأ أثناء معالجة الرد');
        setLoading(false);
      }
    };

    ws.current.addEventListener('message', handleMessage);

    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  const updateStoreProfile = (updates?: Partial<StoreProfileUpdatePayload>, cost?: number) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket غير متصل');
      return;
    }

    setLoading(true);
    setError(null);

    const message: StoreProfileUpdatePayload = {
      userId,
      ...(updates || {}),
    };

    // إذا تم تمرير cost، أضفه للرسالة
    if (cost !== undefined) {
      message.cost = cost;
    }

    ws.current.send(JSON.stringify({
      type: 'update_store_profile',
      token,
      ...message
    }));
  };

  // جلب البيانات أول مرة بدون تعديل
  useEffect(() => {
    if (userId && token) {
      updateStoreProfile(); // بدون تعديلات: فقط جلب
    }
  }, [userId, token]);

  return { profile, loading, error, notifications, updateStoreProfile };
}
