// import { useEffect, useState } from 'react';
// import { useWebSocket } from '@/context/WebSocketContext';

// interface UpdateGroupResponse {
//   type: string;
//   group?: any;
//   message?: string;
// }

// interface UpdateGroupFields {
//   description?: string;
//   welcomeMessageText?: string;
//   isPublic?:boolean;
// }

// export function useUpdateGroupInfo(userId: string) {
//   const { ws } = useWebSocket();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);
//   const [updatedGroup, setUpdatedGroup] = useState<any>(null);

//   const updateGroupInfo = (
//     groupId: string,
//     fields: UpdateGroupFields
//   ): Promise<boolean> => {
//     return new Promise((resolve) => {
//       if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
//         setError('WebSocket غير متصل');
//         return resolve(false);
//       }

//       if (!groupId || !userId) {
//         setError('يجب تقديم معرف المستخدم ومعرف المجموعة');
//         return resolve(false);
//       }

//       setLoading(true);
//       setError(null);
//       setSuccessMessage(null);
//       setUpdatedGroup(null);

//       const message = {
//         type: 'update_group_info',
//         groupId,
//         userId,
//         ...fields,
//       };

//       const handleMessage = (event: MessageEvent) => {
//         try {
//           const data: UpdateGroupResponse = JSON.parse(event.data);

//           if (data.type === 'update_group_success' && data.group?._id === groupId) {
//             setUpdatedGroup(data.group);
//             setSuccessMessage('تم تحديث إعدادات المجموعة بنجاح');
//             setLoading(false);
//             ws.current?.removeEventListener('message', handleMessage);
//             resolve(true);
//           } else if (data.type === 'update_group_failed') {
//             setError(data.message || 'فشل في تحديث إعدادات المجموعة');
//             setLoading(false);
//             ws.current?.removeEventListener('message', handleMessage);
//             resolve(false);
//           }
//         } catch (error) {
//           setError('حدث خطأ أثناء قراءة رد السيرفر');
//           setLoading(false);
//           ws.current?.removeEventListener('message', handleMessage);
//           resolve(false);
//         }
//       };

//       ws.current.addEventListener('message', handleMessage);
//       ws.current.send(JSON.stringify(message));
//     });
//   };

//   return {
//     updateGroupInfo,
//     loading,
//     error,
//     successMessage,
//     updatedGroup,
//   };
// }

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface UpdateGroupResponse {
  type: string;
  group?: any;
  message?: string;
}

interface UpdateGroupFields {
  description?: string;
  welcomeMessageText?: string;
  isPublic?: boolean;
  password?: string;  // أضفت حقل كلمة المرور هنا
}

export function useUpdateGroupInfo(userId: string) {
  const { ws } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatedGroup, setUpdatedGroup] = useState<any>(null);

  const updateGroupInfo = (
    groupId: string,
    fields: UpdateGroupFields
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        setError('WebSocket غير متصل');
        return resolve(false);
      }

      if (!groupId || !userId) {
        setError('يجب تقديم معرف المستخدم ومعرف المجموعة');
        return resolve(false);
      }

      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      setUpdatedGroup(null);

      const message = {
        type: 'update_group_info',
        groupId,
        userId,
        ...fields,  // هنا سيتم إرسال الحقول بما فيها isPublic و password عند تزويدها
      };

      const handleMessage = (event: MessageEvent) => {
        try {
          const data: UpdateGroupResponse = JSON.parse(event.data);

          if (data.type === 'update_group_success' && data.group?._id === groupId) {
            setUpdatedGroup(data.group);
            setSuccessMessage('تم تحديث إعدادات المجموعة بنجاح');
            setLoading(false);
            ws.current?.removeEventListener('message', handleMessage);
            resolve(true);
          } else if (data.type === 'update_group_failed') {
            setError(data.message || 'فشل في تحديث إعدادات المجموعة');
            setLoading(false);
            ws.current?.removeEventListener('message', handleMessage);
            resolve(false);
          }
        } catch (error) {
          setError('حدث خطأ أثناء قراءة رد السيرفر');
          setLoading(false);
          ws.current?.removeEventListener('message', handleMessage);
          resolve(false);
        }
      };

      ws.current.addEventListener('message', handleMessage);
      ws.current.send(JSON.stringify(message));
    });
  };

  return {
    updateGroupInfo,
    loading,
    error,
    successMessage,
    updatedGroup,
  };
}
