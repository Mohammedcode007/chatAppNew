import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

type UserProfile = {
  _id: string;
  username: string;
  profilePic: string;
  status: string;
  coins: number;
  selectedAvatar?: { name: string; imageUrl: string };
  selectedFrame?: { name: string; imageUrl: string };
  selectedEffect?: { name: string; imageUrl: string };
  selectedBackground?: { name: string; imageUrl: string };
  subscription?: string;
};

export function useUserProfile(initialProfile?: UserProfile) {
  const { ws } = useWebSocket();
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || null);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'profile_updated_successfully':
            setProfile(data.user);
            setNotifications((prev) => [
              ...prev,
              'تم تحديث الملف الشخصي بنجاح',
            ]);
            break;

          case 'friend_profile_updated':
            // يمكنك تحديث بيانات صديق معين هنا إن لزم الأمر
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

  const updateProfile = (updates: Partial<UserProfile>) => {
    ws.current?.send(
      JSON.stringify({
        type: 'update_profile',
        updates,
      })
    );
  };

  return {
    profile,
    notifications,
    updateProfile,
  };
}
