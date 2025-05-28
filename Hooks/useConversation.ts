// import { useEffect, useState } from "react";
// import { useWebSocket } from "@/context/WebSocketContext";

// type Message = {
//   _id: string;
//   sender: string;
//   receiver: string;
//   text: string;
//   timestamp: string;
//   status: "sent" | "delivered" | "received" | "seen";
// };

// export function useConversation(withUserId: string) {
//   const { ws } = useWebSocket();
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState<string>("");

//   useEffect(() => {
//     if (!ws.current) return;

//     const handleMessage = (event: MessageEvent) => {
//       try {
//         const data = JSON.parse(event.data);

//         // استلام سجل المحادثة بدون شرط withUserId لأنه غير موجود في الرد من السيرفر
//         if (data.type === "conversation_history") {
//           setMessages(data.messages);
//         }

//         // استلام رسالة جديدة خاصة بين المستخدمين
//         if (
//           data.type === "new_private_message" &&
//           (data.message.receiver === withUserId || data.message.sender === withUserId)
//         ) {
//           const msg = data.message;

//           setMessages((prev) => {
//             // البحث عن رسالة مؤقتة بنفس النص لتحديثها بالرسالة الحقيقية
//             const index = prev.findIndex(
//               (m) => m._id.startsWith("temp-") && m.text === msg.text
//             );
//             if (index !== -1) {
//               const updated = [...prev];
//               updated[index] = msg;
//               return updated;
//             } else {
//               return [...prev, msg];
//             }
//           });
//         }

//         // تحديث حالة الرسالة
//         if (data.type === "message_status_updated" && data.messageId) {
//           setMessages((prev) =>
//             prev.map((msg) =>
//               msg._id === data.messageId ? { ...msg, status: data.status } : msg
//             )
//           );
//         }

//         // تحديث معرف الرسالة المؤقت بمعرف الرسالة الحقيقي عند تأكيد الإرسال
//         if (data.type === "message_sent_confirmation" && data.messageId) {
//           setMessages((prev) => {
//             const index = prev.findIndex((m) => m._id.startsWith("temp-"));
//             if (index !== -1) {
//               const updated = [...prev];
//               updated[index] = {
//                 ...updated[index],
//                 _id: data.messageId,
//                 status: data.status || updated[index].status,
//               };
//               return updated;
//             }
//             return prev;
//           });
//         }
//       } catch (err) {
//         console.error("WebSocket message error:", err);
//       }
//     };

//     ws.current.addEventListener("message", handleMessage);

//     // طلب سجل المحادثة مع النوع الصحيح من السيرفر
//     ws.current.send(
//       JSON.stringify({
//         type: "get_conversation",
//         withUserId,
//       })
//     );

//     return () => ws.current?.removeEventListener("message", handleMessage);
//   }, [ws, withUserId]);

//   // دالة إرسال رسالة جديدة مع معرف مؤقت
//   const sendMessage = ({
//     text,
//     senderId,
//   }: {
//     text: string;
//     senderId: string;
//   }) => {
//     if (!text.trim()) return;

//     const tempId = `temp-${Date.now()}`;
//     const newMsg: Message = {
//       _id: tempId,
//       sender: senderId,
//       receiver: withUserId,
//       text,
//       timestamp: new Date().toISOString(),
//       status: "sent",
//     };

//     // عرض الرسالة فورًا في الواجهة
//     setMessages((prev) => [...prev, newMsg]);

//     // إرسال الرسالة للسيرفر
//     ws.current?.send(
//       JSON.stringify({
//         type: "private_message",
//         toUserId: withUserId,
//         text,
//       })
//     );
//   };

//   // تحديث حالة الرسالة (مثل: delivered, seen ...)
//   const updateMessageStatus = (messageId: string, status: Message["status"]) => {
//     ws.current?.send(
//       JSON.stringify({
//         type: "update_message_status",
//         messageId,
//         status,
//       })
//     );
//   };

//   return {
//     messages,
//     newMessage,
//     setNewMessage,
//     sendMessage,
//     updateMessageStatus,
//   };
// }

import { useEffect, useState, useRef } from "react";
import { useWebSocket } from "@/context/WebSocketContext";

type MessageStatus = "sent" | "delivered" | "received" | "seen";

type Message = {
  _id: string;
  sender: string;
  receiver: string;
  text: string;
  timestamp: string;
  status: MessageStatus;
};

export function useConversation(withUserId: string) {
  const { ws, userId } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");

  // حفظ معرف المستخدم المقابل في ref لتفادي إعادة تفعيل useEffect بدون داعي
  const withUserIdRef = useRef(withUserId);
  useEffect(() => {
    withUserIdRef.current = withUserId;
  }, [withUserId]);

  // الاستماع لرسائل WebSocket وتحديث المحادثة فوراً
  useEffect(() => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // استقبال سجل المحادثة الكامل
        if (data.type === "conversation_history" && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }

        // استقبال رسالة جديدة بين المستخدمين مع تحقق صارم للمطابقة
        if (
          data.type === "new_private_message" &&
          (
            (data.message.receiver === withUserIdRef.current && data.message.sender === userId) ||
            (data.message.sender === withUserIdRef.current && data.message.receiver === userId)
          )
        ) {
          const msg: Message = data.message;

          setMessages((prev) => {
            // البحث عن رسالة مؤقتة بنفس النص والمرسل لاستبدالها
            const index = prev.findIndex(
              (m) =>
                m._id.startsWith("temp-") &&
                m.text === msg.text &&
                m.sender === msg.sender
            );
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = msg;
              return updated;
            } else {
              return [...prev, msg];
            }
          });

          // إرسال تأكيد استلام الرسالة (delivered)
          if (msg.receiver === userId) {
            ws.current?.send(
              JSON.stringify({
                type: "update_message_status",
                messageId: msg._id,
                status: "delivered",
              })
            );
          }
        }

        // تأكيد إرسال الرسالة وتحديث المعرف المؤقت
    if (data.type === "message_sent_confirmation" && data.message) {
  const confirmedMessage = data.message;

  setMessages((prev) => {
    // البحث عن الرسالة المؤقتة التي تطابق الـ tempId
    const index = prev.findIndex(
      (m) => m._id === data.tempId && m.sender === userId
    );

    if (index !== -1) {
      const updated = [...prev];
      updated[index] = confirmedMessage; // استبدال الرسالة المؤقتة بالرسالة الحقيقية كاملة
      return updated;
    } else {
      // إذا لم توجد رسالة مؤقتة، فقط نضيف الرسالة الجديدة
      return [...prev, confirmedMessage];
    }
  });
}


        // تحديث حالة الرسائل (delivered, seen, ...)
        if (data.type === "message_status_updated" && data.messageId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === data.messageId ? { ...msg, status: data.status } : msg
            )
          );
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };

    ws.current.addEventListener("message", handleMessage);

    // طلب سجل المحادثة مع المستخدم المحدد
    ws.current.send(
      JSON.stringify({
        type: "get_conversation",
        withUserId,
      })
    );

    return () => {
      ws.current?.removeEventListener("message", handleMessage);
    };
  }, [ws, userId, withUserId]);

  // تحديث حالة الرسائل غير المقروءة إلى "seen" عند عرض المحادثة
  useEffect(() => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    if (messages.length === 0) return;

    const unseenMessages = messages.filter(
      (msg) =>
        msg.sender === withUserId &&
        msg.receiver === userId &&
        msg.status !== "seen"
    );

    unseenMessages.forEach((msg) => {
      ws.current?.send(
        JSON.stringify({
          type: "update_message_status",
          messageId: msg._id,
          status: "seen",
        })
      );
    });
  }, [messages, withUserId, userId, ws]);

  // دالة إرسال رسالة جديدة
  const sendMessage = ({
    text,
    senderId,
  }: {
    text: string;
    senderId: string;
  }) => {
    if (!text.trim()) return;

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not connected.");
      return;
    }

    // إنشاء معرف مؤقت للرسالة
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newMsg: Message = {
      _id: tempId,
      sender: senderId,
      receiver: withUserId,
      text,
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    // إضافة الرسالة مؤقتًا إلى الحالة
    setMessages((prev) => [...prev, newMsg]);

    // إرسال الرسالة إلى السيرفر مع المعرف المؤقت
    ws.current.send(
      JSON.stringify({
        type: "private_message",
        toUserId: withUserId,
        text,
        tempId,
      })
    );

    setNewMessage(""); // تفريغ مربع الإدخال
  };

  // تحديث حالة رسالة معينة (مثلاً عند القراءة)
  const updateMessageStatus = (messageId: string, status: MessageStatus) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not connected.");
      return;
    }

    ws.current.send(
      JSON.stringify({
        type: "update_message_status",
        messageId,
        status,
      })
    );
  };

  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    updateMessageStatus,
  };
}
