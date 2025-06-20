// import { useEffect, useState } from 'react';
// import { useWebSocket } from '@/context/WebSocketContext';

// interface JoinGroupResponse {
//   type: string;
//   groupId?: string;
//   message?: string;
// }

// export function useJoinGroup(userId: string) {
//   const { ws } = useWebSocket();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);
//   const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);

//   useEffect(() => {
//     if (!ws.current) return;

//     const handleMessage = (event: MessageEvent) => {
//       try {
//         const data: JoinGroupResponse = JSON.parse(event.data);

//         if (data.type === 'join_group_success' && data.groupId) {
//           setJoinedGroupId(data.groupId);
//           setSuccessMessage('تم الانضمام إلى المجموعة بنجاح');
//           setLoading(false);
//           setError(null);
//         }

//         if (data.type === 'join_group_failed') {
//           // إذا كان المستخدم عضوًا بالفعل، نعتبر العملية ناجحة:
//           if (data.message === 'You are already a member of this group.') {
//             setJoinedGroupId(data.groupId ?? null);
//             setSuccessMessage('أنت بالفعل عضو في هذه المجموعة');
//             setError(null);
//           } else {
//             setError(data.message || 'فشل الانضمام إلى المجموعة');
//           }
//           setLoading(false);
//         }
//       } catch (err) {
//         setError('حدث خطأ أثناء معالجة رد السيرفر');
//         setLoading(false);
//       }
//     };

//     ws.current.addEventListener('message', handleMessage);
//     return () => {
//       ws.current?.removeEventListener('message', handleMessage);
//     };
//   }, [ws]);

//  const joinGroup = (groupId: string): Promise<boolean> => {
//   return new Promise((resolve, reject) => {
//     if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
//       setError('WebSocket غير متصل');
//       return resolve(false);
//     }

//     if (!groupId.trim()) {
//       setError('معرف المجموعة لا يمكن أن يكون فارغًا');
//       return resolve(false);
//     }

//     setLoading(true);
//     setError(null);
//     setSuccessMessage(null);
//     setJoinedGroupId(null);

//     const message = {
//       type: 'join_group',
//       groupId,
//       userId,
//     };

//     const handleMessage = (event: MessageEvent) => {
//       try {
//         const data: JoinGroupResponse = JSON.parse(event.data);

//         if (data.type === 'join_group_success' && data.groupId === groupId) {
//           setJoinedGroupId(data.groupId);
//           setSuccessMessage('تم الانضمام إلى المجموعة بنجاح');
//           setLoading(false);
//           setError(null);
//           ws.current?.removeEventListener('message', handleMessage);
//           resolve(true);
//         } else if (data.type === 'join_group_failed' && data.groupId === groupId) {
//           if (data.message === 'You are already a member of this group.') {
//             setJoinedGroupId(data.groupId ?? null);
//             setSuccessMessage('أنت بالفعل عضو في هذه المجموعة');
//             setError(null);
//             setLoading(false);
//             ws.current?.removeEventListener('message', handleMessage);
//             resolve(true); // نعتبرها ناجحة
//           } else {
//             setError(data.message || 'فشل الانضمام إلى المجموعة');
//             setLoading(false);
//             ws.current?.removeEventListener('message', handleMessage);
//             resolve(false);
//           }
//         }
//       } catch (err) {
//         setError('حدث خطأ أثناء معالجة رد السيرفر');
//         setLoading(false);
//         ws.current?.removeEventListener('message', handleMessage);
//         resolve(false);
//       }
//     };

//     ws.current.addEventListener('message', handleMessage);
//     ws.current.send(JSON.stringify(message));
//   });
// };


//   return {
//     joinedGroupId,
//     loading,
//     error,
//     successMessage,
//     joinGroup,
//   };
// }

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface JoinGroupResponse {
  type: string;
  groupId?: string;
  message?: string;
}

export function useJoinGroup(userId: string) {
  const { ws } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: JoinGroupResponse = JSON.parse(event.data);

        if (data.type === 'join_group_success' && data.groupId) {
          setJoinedGroupId(data.groupId);
          setSuccessMessage('تم الانضمام إلى المجموعة بنجاح');
          setLoading(false);
          setError(null);
        }

        if (data.type === 'join_group_failed') {
          if (data.message === 'You are already a member of this group.') {
            setJoinedGroupId(data.groupId ?? null);
            setSuccessMessage('أنت بالفعل عضو في هذه المجموعة');
            setError(null);
          } else {
            setError(data.message || 'فشل الانضمام إلى المجموعة');
          }
          setLoading(false);
        }
      } catch (err) {
        setError('حدث خطأ أثناء معالجة رد السيرفر');
        setLoading(false);
      }
    };

    ws.current.addEventListener('message', handleMessage);
    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  const joinGroup = (groupId: string, password?: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        setError('WebSocket غير متصل');
        return resolve(false);
      }

      if (!groupId.trim()) {
        setError('معرف المجموعة لا يمكن أن يكون فارغًا');
        return resolve(false);
      }

      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      setJoinedGroupId(null);

      const message = {
        type: 'join_group',
        groupId,
        userId,
        ...(password ? { password } : {}),
      };

      const handleMessage = (event: MessageEvent) => {
        try {
          const data: JoinGroupResponse = JSON.parse(event.data);

          if (data.type === 'join_group_success' && data.groupId === groupId) {
            setJoinedGroupId(data.groupId);
            setSuccessMessage('تم الانضمام إلى المجموعة بنجاح');
            setLoading(false);
            setError(null);
            ws.current?.removeEventListener('message', handleMessage);
            resolve(true);
          } else if (data.type === 'join_group_failed' && data.groupId === groupId) {
            if (data.message === 'You are already a member of this group.') {
              setJoinedGroupId(data.groupId ?? null);
              setSuccessMessage('أنت بالفعل عضو في هذه المجموعة');
              setError(null);
              setLoading(false);
              ws.current?.removeEventListener('message', handleMessage);
              resolve(true);
            } else {
              setError(data.message || 'فشل الانضمام إلى المجموعة');
              setLoading(false);
              ws.current?.removeEventListener('message', handleMessage);
              resolve(false);
            }
          }
        } catch (err) {
          setError('حدث خطأ أثناء معالجة رد السيرفر');
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
    joinedGroupId,
    loading,
    error,
    successMessage,
    joinGroup,
  };
}
