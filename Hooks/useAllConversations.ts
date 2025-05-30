

import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "@/context/WebSocketContext";

type ConversationSummary = {
  withUserId: string;
  withUsername: string;
  withAvatarUrl?: string;
  userStatus?:string;
  withStatus?: string;  // تأكد أن الحالة هنا اختيارية أو موجودة
  unreadCount: number;
  lastMessage: {
    messageType: string;
    _id: string;
    sender: string;
    receiver: string;
    text: string;
    timestamp: string;
    status: "sent" | "delivered" | "received" | "seen";
  } | null;
  messages?: {
    _id: string;
    sender: string;
    receiver: string;
    text: string;
    timestamp: string;
    status: "sent" | "delivered" | "received" | "seen";
  }[];
};

export function useAllConversations() {
  const { ws } = useWebSocket();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshConversations = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: "get_all_conversations",
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

        if (data.type === "all_conversations") {
          const sorted = data.conversations.sort((a: ConversationSummary, b: ConversationSummary) => {
            const aTime = new Date(a.lastMessage?.timestamp || 0).getTime();
            const bTime = new Date(b.lastMessage?.timestamp || 0).getTime();
            return bTime - aTime;
          });

          setConversations(sorted);
          setLoading(false);
        }

        if (data.type === "conversation_updated") {
          const updatedConvo = data.conversation as ConversationSummary;

          setConversations((prevConvos) => {
            const index = prevConvos.findIndex(
              (c) => c.withUserId === updatedConvo.withUserId
            );

            let newConvos;
            if (index !== -1) {
              newConvos = [...prevConvos];
              newConvos[index] = {
                ...newConvos[index],
                ...updatedConvo,
              };
            } else {
              newConvos = [updatedConvo, ...prevConvos];
            }

            return newConvos.sort((a, b) => {
              const aTime = new Date(a.lastMessage?.timestamp || 0).getTime();
              const bTime = new Date(b.lastMessage?.timestamp || 0).getTime();
              return bTime - aTime;
            });
          });
        }

        // هنا إضافة التعامل مع تحديث حالة الصديق
        if (data.type === "friend_status_updated") {
          const { userId, status } = data;

          setConversations((prevConvos) => {
            // تحديث حالة المستخدم داخل المحادثات إذا وجدناه
            return prevConvos.map((convo) => {
              if (convo.withUserId === userId) {
                return {
                  ...convo,
                  withStatus: status,
                };
              }
              return convo;
            });
          });
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };

    ws.current.addEventListener("message", handleMessage);

    // أول تحميل للمحادثات
    refreshConversations();

    return () => ws.current?.removeEventListener("message", handleMessage);
  }, [ws, refreshConversations]);

  return {
    conversations,
    loading,
    refreshConversations,
  };
}
