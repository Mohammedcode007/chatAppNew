import { useEffect, useState } from "react";
import { useWebSocket } from "@/context/WebSocketContext";

type Message = {
  _id: string;
  sender: string;
  receiver: string;
  text: string;
  timestamp: string;
  status: "sent" | "delivered" | "received" | "seen";
};

export function useConversation(withUserId: string) {
  const { ws } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received data:", data);

        // استلام سجل المحادثة بدون شرط withUserId لأنه غير موجود في الرد من السيرفر
        if (data.type === "conversation_history") {
          setMessages(data.messages);
        }

        if (
          data.type === "new_private_message" &&
          (data.message.receiver === withUserId || data.message.sender === withUserId)
        ) {
          const msg = data.message;

          setMessages((prev) => {
            // البحث عن رسالة مؤقتة بنفس النص لتحديثها بالرسالة الحقيقية
            const index = prev.findIndex(
              (m) => m._id.startsWith("temp-") && m.text === msg.text
            );
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = msg;
              return updated;
            } else {
              return [...prev, msg];
            }
          });
        }

        // تحديث حالة الرسالة
        if (data.type === "message_status_updated" && data.messageId) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg._id === data.messageId) {
                if (data.status === "delivered") {
                  console.log(`📩 الرسالة إلى المستخدم ${msg.receiver} تم استلامها (delivered)`);
                } else if (data.status === "seen") {
                  console.log(`👁️ الرسالة إلى المستخدم ${msg.receiver} تم قراءتها (seen)`);
                }
                return { ...msg, status: data.status };
              }
              return msg;
            })
          );
        }


        // تحديث معرف الرسالة المؤقت بمعرف الرسالة الحقيقي عند تأكيد الإرسال
        if (data.type === "message_sent_confirmation" && data.messageId) {
          setMessages((prev) => {
            const index = prev.findIndex((m) => m._id === data.tempId); // البحث عبر tempId وليس _id.startsWith("temp-")
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                _id: data.messageId,
                status: data.status || updated[index].status,
              };
              return updated;
            }
            return prev;
          });
        }


      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };

    ws.current.addEventListener("message", handleMessage);
    openConversation();
openChat()
    // طلب سجل المحادثة مع النوع الصحيح من السيرفر
    ws.current.send(
      JSON.stringify({
        type: "get_conversation",
        withUserId,
      })
    );

    return () => ws.current?.removeEventListener("message", handleMessage);
  }, [ws, withUserId]);

  // دالة إرسال رسالة جديدة مع معرف مؤقت
  const sendMessage = ({
    text,
    senderId,
  }: {
    text: string;
    senderId: string;
  }) => {
    if (!text.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const newMsg: Message = {
      _id: tempId,
      sender: senderId,
      receiver: withUserId,
      text,
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    // عرض الرسالة فورًا في الواجهة
    setMessages((prev) => [...prev, newMsg]);

    // إرسال الرسالة للسيرفر
    ws.current?.send(
      JSON.stringify({
        type: "private_message",
        toUserId: withUserId,
        text,
        tempId
      })
    );
  };

  // تحديث حالة الرسالة (مثل: delivered, seen ...)
  const updateMessageStatus = (messageId: string, status: Message["status"]) => {
    ws.current?.send(
      JSON.stringify({
        type: "update_message_status",
        messageId,
        status,
      })
    );
  };

  // دالة فتح المحادثة وجلب الرسائل وتحديث حالتها إلى seen
  const openConversation = () => {
    if (!ws.current || !withUserId) return;

    ws.current.send(
      JSON.stringify({
        type: "open_private_chat",
        withUserId,
      })
    );
  };

    const openChat = () => {
    if (!ws.current || !withUserId) return;

    ws.current.send(
      JSON.stringify({
        type: "open_chat",
        withUserId,
      })
    );
  };

      const closeChat = () => {
    if (!ws.current || !withUserId) return;

    ws.current.send(
      JSON.stringify({
        type: "close_chat",
        withUserId,
      })
    );
  };


  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    updateMessageStatus,
    openChat,
    closeChat
  };
}
