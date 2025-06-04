import { useEffect, useState } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';

interface UpdateGroupRoleResponse {
  type: string;
  groupId?: string;
  targetUserId?: string;
  roleType?: string;
  roleAction?: string;
  message?: string;
}

interface UpdateGroupRoleParams {
  groupId: string;
  actorUserId: string;
  targetUserId: string;
  roleType: 'admin' | 'owner' | 'block';  // أو أي أنواع أخرى موجودة لديك
  roleAction: 'add' | 'remove';
}

export function useUpdateGroupRole() {
  const { ws } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ws.current) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data: UpdateGroupRoleResponse = JSON.parse(event.data);

        if (data.type === 'update_group_role_success') {
          setSuccessMessage(data.message || 'تم تحديث صلاحيات المجموعة بنجاح');
          setError(null);
          setLoading(false);
        }

        if (data.type === 'update_group_role_failed') {
          setError(data.message || 'فشل تحديث صلاحيات المجموعة');
          setSuccessMessage(null);
          setLoading(false);
        }
      } catch (err) {
        setError('حدث خطأ أثناء معالجة رد السيرفر');
        setSuccessMessage(null);
        setLoading(false);
      }
    };

    ws.current.addEventListener('message', handleMessage);
    return () => {
      ws.current?.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  const updateGroupRole = (params: UpdateGroupRoleParams): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        setError('WebSocket غير متصل');
        return resolve(false);
      }

      // تحقق من صحة البيانات الأساسية
      if (
        !params.groupId.trim() ||
        !params.actorUserId.trim() ||
        !params.targetUserId.trim() ||
        !params.roleType.trim() ||
        !params.roleAction.trim()
      ) {
        setError('جميع الحقول مطلوبة وغير صحيحة');
        return resolve(false);
      }

      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const message = {
        type: 'update_group_role',
        groupId: params.groupId,
        actorUserId: params.actorUserId,
        targetUserId: params.targetUserId,
        roleType: params.roleType,
        roleAction: params.roleAction,
      };

      const handleResponse = (event: MessageEvent) => {
        try {
          const data: UpdateGroupRoleResponse = JSON.parse(event.data);

          if (data.type === 'update_group_role_success') {
            setSuccessMessage(data.message || 'تم تحديث صلاحيات المجموعة بنجاح');
            setError(null);
            setLoading(false);
            ws.current?.removeEventListener('message', handleResponse);
            resolve(true);
          } else if (data.type === 'update_group_role_failed') {
            setError(data.message || 'فشل تحديث صلاحيات المجموعة');
            setSuccessMessage(null);
            setLoading(false);
            ws.current?.removeEventListener('message', handleResponse);
            resolve(false);
          }
        } catch {
          setError('حدث خطأ أثناء معالجة رد السيرفر');
          setSuccessMessage(null);
          setLoading(false);
          ws.current?.removeEventListener('message', handleResponse);
          resolve(false);
        }
      };

      ws.current.addEventListener('message', handleResponse);
      ws.current.send(JSON.stringify(message));
    });
  };

  return {
    loading,
    error,
    successMessage,
    updateGroupRole,
  };
}
