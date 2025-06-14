import { useCallback, useState } from "react";
import { useWebSocket } from "@/context/WebSocketContext";

type DeleteFriendResponse = {
  success: boolean;
  message: string;
  friendId?: string;
};

export function useDeleteFriend() {
  const { ws } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteFriend = useCallback(
    (friendId: string, token: string): Promise<DeleteFriendResponse> => {
      return new Promise((resolve) => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
          resolve({ success: false, message: "WebSocket غير متصل" });
          return;
        }

        setLoading(true);
        setError(null);

        const onMessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);

            if (
              data.type === "friend_deleted_successfully" &&
              data.friendId === friendId
            ) {
              ws.current?.removeEventListener("message", onMessage);
              setLoading(false);
              resolve({ success: true, message: "تم حذف الصديق", friendId });
            }

            if (data.type === "friend_deletion_failed") {
              ws.current?.removeEventListener("message", onMessage);
              setLoading(false);
              setError(data.message);
              resolve({ success: false, message: data.message });
            }
          } catch (err) {
            ws.current?.removeEventListener("message", onMessage);
            setLoading(false);
            setError("خطأ في تحليل البيانات");
            resolve({ success: false, message: "خطأ في تحليل البيانات" });
          }
        };

        ws.current.addEventListener("message", onMessage);

        ws.current.send(
          JSON.stringify({
            type: "delete_friend",
            friendId,
            token,
          })
        );
      });
    },
    [ws]
  );

  return {
    deleteFriend,
    loading,
    error,
  };
}
