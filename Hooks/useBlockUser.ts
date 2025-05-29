import { useState, useCallback, useEffect } from "react";
import { useWebSocket } from "@/context/WebSocketContext";

export function useBlockUser() {
  const { ws } = useWebSocket();

  // نضيف حالة جديدة لتخزين بيانات المستخدمين المحظورين (مع الاسم)
  const [blockedUsers, setBlockedUsers] = useState<
    { id: string; name: string }[]
  >([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const blockUser = useCallback(
    (targetUserId: string) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        setLoading(true);
        setErrorMessage(null); // إعادة تعيين رسالة الخطأ قبل الإرسال
        ws.current.send(
          JSON.stringify({
            type: "block_user",
            targetUserId,
          })
        );
      }
    },
    [ws]
  );

  const unblockUser = useCallback(
    (targetUserId: string) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        setLoading(true);
        setErrorMessage(null); // إعادة تعيين رسالة الخطأ قبل الإرسال
        ws.current.send(
          JSON.stringify({
            type: "unblock_user",
            targetUserId,
          })
        );
      }
    },
    [ws]
  );

  const isUserBlocked = useCallback(
    (userId: string) => {
      return blockedUsers.some((user) => user.id === userId);
    },
    [blockedUsers]
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "user_blocked_successfully":
            setBlockedUsers((prev) => [
              ...prev,
              { id: data.blockedUserId, name: "" }, // الاسم يمكن تحديثه لاحقًا أو تركه فارغ
            ]);
            setLoading(false);
            setErrorMessage(null);
            break;

          case "user_unblocked_successfully":
            setBlockedUsers((prev) =>
              prev.filter((user) => user.id !== data.unblockedUserId)
            );
            setLoading(false);
            setErrorMessage(null);
            break;

          case "blocked_users_list":
            console.log(data,'data55555');
            
            // تحديث قائمة المستخدمين المحظورين مع الأسماء
            setBlockedUsers(data.blockedUsers);
            setLoading(false);
            setErrorMessage(null);
            break;

          case "block_failed":
          case "unblock_failed":
            setErrorMessage(data.message || "حدث خطأ ما");
            setLoading(false);
            break;

          default:
            break;
        }
      } catch (error) {
        console.error("WebSocket block handling error:", error);
        setLoading(false);
        setErrorMessage("خطأ في معالجة الرسالة");
      }
    },
    []
  );

  useEffect(() => {
    const socket = ws.current;
    if (!socket) return;

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [ws, handleMessage]);

  // دالة لجلب المحظورين (ترسل طلب للـ WebSocket)
  const fetchBlockedUsers = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      setLoading(true);
      ws.current.send(
        JSON.stringify({
          type: "get_blocked_users",
        })
      );
    }
  }, [ws]);

  return {
    blockUser,
    unblockUser,
    isUserBlocked,
    blockedUsers,
    fetchBlockedUsers,
    loading,
    errorMessage,
  };
}
