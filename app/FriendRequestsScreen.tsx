import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FriendRequest {
  _id: string;
  sender: {
    _id: string;
    username: string;
  };
}

const FriendRequestsScreen: React.FC = () => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const ws = useRef<WebSocket | null>(null);

  const fetchRequests = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const res = await axios.get('http://192.168.80.248:3000/friends/requests', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRequests(res.data);
  };

  const connectWebSocket = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const userId = await AsyncStorage.getItem('userId');
    if (!token || !userId) return;

    const socket = new WebSocket(`ws://192.168.80.248:3000?token=${token}&room=friends`);

    socket.onopen = () => {
      console.log('WebSocket connected [FriendRequestsScreen]');
    };

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'friend_request_received') {
          console.log('Received new friend request');
          fetchRequests(); // تحديث القائمة مباشرة
        }
      } catch (err) {
        console.log('Invalid WS message', err);
      }
    };

    socket.onerror = (e) => console.log('WebSocket error:', e);
    socket.onclose = () => console.log('WebSocket closed [FriendRequestsScreen]');
    ws.current = socket;
  };

  const respondRequest = async (requestId: string, accepted: boolean) => {
    const token = await AsyncStorage.getItem('authToken');
    await axios.post(
      `http://192.168.80.248:3000/friends/respond`,
      { requestId, accepted },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    Alert.alert('تم', accepted ? 'تم قبول الطلب' : 'تم رفض الطلب');
    fetchRequests();
  };

  useEffect(() => {
    fetchRequests();
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>طلبات الصداقة</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.username}>{item.sender.username}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.accept}
                onPress={() => respondRequest(item._id, true)}
              >
                <Text style={styles.btnText}>قبول</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reject}
                onPress={() => respondRequest(item._id, false)}
              >
                <Text style={styles.btnText}>رفض</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>لا توجد طلبات</Text>}
      />
    </View>
  );
};

export default FriendRequestsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: { fontSize: 16 },
  actions: { flexDirection: 'row' },
  accept: {
    backgroundColor: '#28a745',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  reject: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#777' },
});
