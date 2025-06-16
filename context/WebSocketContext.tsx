
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { WS_URL } from '@/config';

type WebSocketContextType = {
  ws: React.MutableRefObject<WebSocket | null>;
  userId: string | null;
  setUserId: React.Dispatch<React.SetStateAction<string | null>>;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ws = useRef<WebSocket | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const connect = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولاً.');
        return;
      }

      ws.current = new WebSocket(`${WS_URL}/chat?token=${token}`);

      ws.current.onopen = () => console.log('WebSocket connected');
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // مثال: استقبال معرف المستخدم بعد الاتصال
          if (data.type === 'connection_ack' && data.userId) {
            setUserId(data.userId);
          }
          console.log('WS Message:', data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      ws.current.onerror = (error) => console.error('WebSocket Error:', error);
      ws.current.onclose = (e) => console.log('WebSocket closed:', e.code, e.reason);
    };

    connect();

    return () => {
      ws.current?.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws, userId, setUserId }}>
      {children}
    </WebSocketContext.Provider>
  );
};
