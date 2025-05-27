import React, { useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useWebSocket } from '@/context/WebSocketContext'; // تأكد من المسار الصحيح حسب مشروعك
import { API_URL } from '@/config';

interface User {
  _id: string;
  username: string;
}

const SearchUserScreen: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { ws } = useWebSocket();

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
        `${API_URL}/search?query=${query}`,
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
          type: 'friend_request_sent',
          toUserId: userId,
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
