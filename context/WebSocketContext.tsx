// context/WebSocketContext.tsx
import React, { createContext, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { WS_URL } from '@/config';

type WebSocketContextType = {
  ws: React.MutableRefObject<WebSocket | null>;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولاً.');
        return;
      }

      // ws.current = new WebSocket(`ws://192.168.5.90:3000/chat?token=${token}`);
      ws.current = new WebSocket(`${WS_URL}/chat?token=${token}`);

      ws.current.onopen = () => console.log('WebSocket connected');
      ws.current.onmessage = (event) => console.log('WS Message:', JSON.parse(event.data));
      ws.current.onerror = (error) => console.error('WebSocket Error:', error);
      ws.current.onclose = (e) => console.log('WebSocket closed:', e.code, e.reason);
    };

    connect();
    return () => {
      ws.current?.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws }}>
      {children}
    </WebSocketContext.Provider>
  );
};
