import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface User {
  _id: string;
  username: string;
}

const SearchUserScreen: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const ws = useRef<WebSocket | null>(null);

  // إنشاء اتصال WebSocket عند تحميل المكون
  useEffect(() => {
    const connectWebSocket = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولاً.');
        return;
      }
      console.log(token);
      

      // مثال رابط اتصال WebSocket مع التوكن واسم الغرفة
      console.log('Connecting WS to:', `ws://192.168.80.248:3000/chat?token=${token}`);

      ws.current = new WebSocket(`ws://192.168.80.248:3000/chat?token=${token}`);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        // يمكنك التعامل مع الرسائل الواردة هنا (مثلاً ردود طلب الصداقة)
        console.log('Received WS message:', msg);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onclose = (e) => {
        console.log('WebSocket closed', e.code, e.reason);
      };
    };

    connectWebSocket();

    // تنظيف الاتصال عند الخروج
    return () => {
      ws.current?.close();
    };
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('خطأ', 'الرجاء تسجيل الدخول أولاً.');
        setLoading(false);
        return;
      }

      const response = await axios.get<User[]>(
        `http://192.168.80.248:3000/search?query=${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('خطأ', 'فشل البحث عن المستخدمين.');
    }
    setLoading(false);
  };

  const sendFriendRequest = (userId: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: 'friend_request_sent',  // نوع الرسالة لتحديدها في السيرفر
          toUserId: userId,             // المعرف الخاص بالمستخدم المستلم
        })
      );
      Alert.alert('تم', 'تم إرسال طلب الصداقة عبر WebSocket!');
    } else {
      Alert.alert('خطأ', 'الاتصال غير متوفر الآن.');
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.label}>ابحث عن مستخدم</Text>
      <TextInput
        style={styles.input}
        placeholder="أدخل اسم المستخدم"
        placeholderTextColor="#888"
        value={query}
        onChangeText={setQuery}
      />
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.searchButtonText}>بحث</Text>
        )}
      </TouchableOpacity>

      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          !loading && query.length > 0 ? (
            <Text style={styles.emptyText}>لا يوجد نتائج</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <Text style={styles.username}>{item.username}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => sendFriendRequest(item._id)}
            >
              <Text style={styles.addButtonText}>إضافة</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default SearchUserScreen;

// ... (نفس الستايلات التي زودتني بها)


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  label: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    color: '#000',
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultItem: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  username: {
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#777',
  },
});
