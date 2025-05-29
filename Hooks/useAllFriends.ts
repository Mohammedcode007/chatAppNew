import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "@/context/WebSocketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Friend = {
  _id: string;
  username: string;
  avatar?: string;
  status?: "online" | "offline" | "busy" | string;
};

export function useAllFriends() {
  const { ws } = useWebSocket();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshFriends = useCallback(async () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.warn("توكن غير موجود");
        setLoading(false);
        return;
      }

      ws.current.send(
        JSON.stringify({
          type: "get_friends",
          token,
        })
      );
      setLoading(true);
    }
  }, [ws]);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "get_friends") {
          if (data.status === "success") {
            setFriends(data.friends);
            setLoading(false);
          } else {
            console.warn("فشل في جلب الأصدقاء:", data.message);
            setLoading(false);
          }
        }

        // --- التعديل هنا: تحديث حالة الصديق بناءً على الرسالة ---
        else if (data.type === "friend_status_updated") {
          setFriends((prevFriends) =>
            prevFriends.map((friend) =>
              friend._id === data.userId
                ? { ...friend, status: data.status }
                : friend
            )
          );
        }

      } catch (err) {
        console.error("خطأ في رسالة WebSocket:", err);
      }
    };

    ws.current.addEventListener("message", handleMessage);

    refreshFriends(); // تحميل أولي

    return () => {
      ws.current?.removeEventListener("message", handleMessage);
    };
  }, [ws, refreshFriends]);

  return {
    friends,
    loading,
    refreshFriends,
  };
}
