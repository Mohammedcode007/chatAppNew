import { useCallback } from "react";
import { useWebSocket } from "@/context/WebSocketContext";
import { ConversationSummary } from "./useAllConversations"; // أو المسار الصحيح

type DeleteConversationHook = {
  deleteConversation: (withUserId: string) => void;
};

export function useDeleteConversation(
  conversations: ConversationSummary[],
  setConversations: React.Dispatch<React.SetStateAction<ConversationSummary[]>>
): DeleteConversationHook {
  const { ws } = useWebSocket();

  const deleteConversation = useCallback(
    (withUserId: string) => {
      // إرسال الطلب للسيرفر لحذف المحادثة من واجهة المستخدم فقط
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: "delete_conversation",
            withUserId,
          })
        );
      }

      // حذف المحادثة محليًا من القائمة
      setConversations((prev) =>
        prev.filter((convo) => convo.withUserId !== withUserId)
      );
    },
    [ws, setConversations]
  );

  return { deleteConversation };
}
