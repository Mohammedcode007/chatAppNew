import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams } from 'expo-router';
import { useThemeMode } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AudioMessagePlayer from '@/components/AudioMessagePlayer';
import { useNavigation } from 'expo-router';
import GroupHeader from '@/components/GroupHeader';
import { useGroupMessages } from '@/Hooks/useGroupMessages';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Message = {
  _id: string; // المعرف الحقيقي أو معرف وهمي يبدأ بـ "temp-"
  type: 'text' | 'image' | 'audio';
  text: string;
  sender: string;
  timestamp: number;
  isTemporary?: boolean; // رسالة مؤقتة
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const isAM = hours < 12;
  const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const period = isAM ? 'ص' : 'م';
  return `${formattedHours}:${formattedMinutes} ${period}`;
};

export default function GroupChatScreen() {
  const { groupId, name } = useLocalSearchParams<{ groupId: string; name?: string }>();
  const { darkMode } = useThemeMode();
  const [userData, setUserData] = useState<any>(null);

  const { messages, loading, error, sendMessage } = useGroupMessages(groupId, userData?._id || '');
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();

  // الحالة التي تحتوي الرسائل المعروضة (بما في ذلك الرسائل الوهمية)
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          setUserData(JSON.parse(userDataString));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  // كل مرة تصل رسائل من الخادم (useGroupMessages)، ندمجها مع localMessages
  useEffect(() => {
    // الرسائل التي ليست وهمية مع المعرف الحقيقي فقط
    const realMessages = messages.map((msg: any) => ({
      _id: msg._id,
      type: msg.messageType,
      text: msg.text,
      sender: msg.sender,
      timestamp: new Date(msg.timestamp).getTime(),
      isTemporary: false,
    }));

    setLocalMessages((prev) => {
      // استبعاد الرسائل الوهمية التي تم استبدالها برسائل حقيقية
      const realIds = realMessages.map(m => m._id);
      const filteredPrev = prev.filter(m =>
        m.isTemporary && !realIds.includes(m._id.replace('temp-', ''))
      );

      // دمج الرسائل الحقيقية مع الوهمية المتبقية
      const combined = [...filteredPrev, ...realMessages];

      // فرز حسب التوقيت
      combined.sort((a, b) => a.timestamp - b.timestamp);

      return combined;
    });
  }, [messages]);

  // إرسال رسالة نصية
  const sendTextMessage = async () => {
    if (!inputText.trim()) return;

    const tempId = `temp-${Date.now()}`;

    const newTempMessage: Message = {
      _id: tempId,
      type: 'text',
      text: inputText.trim(),
      sender: userData?._id || 'unknown',
      timestamp: Date.now(),
      isTemporary: true,
    };

    // عرض الرسالة الوهمية فوراً
    // setLocalMessages(prev => [...prev, newTempMessage]);
    setInputText('');

    try {
      // انتظار تأكيد الإرسال (تأكد أن sendMessage يعيد Promise<رسالة>)
      await sendMessage(inputText.trim(), 'text');
      // لن تحتاج لتعديل هنا لأن useEffect سيراقب messages ويحدث localMessages
    } catch (error) {
      // حذف الرسالة الوهمية عند فشل الإرسال
      setLocalMessages(prev => prev.filter(m => m._id !== tempId));
      console.error('Failed to send message:', error);
      // يمكنك عرض رسالة خطأ للمستخدم حسب الحاجة
    }

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  };

  // عرض الرسالة
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender === userData?._id;

    return (
      <View style={{ marginBottom: 8, opacity: item.isTemporary ? 0.6 : 1 }}>
        <Text
          style={{
            fontSize: 13,
            color: darkMode ? '#aaa' : '#666',
            alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
            marginBottom: 2,
          }}
        >
          {isMyMessage ? 'أنت' : item.sender}
        </Text>

        <View
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessage : styles.otherMessage,
            darkMode && { backgroundColor: isMyMessage ? '#0a84ff' : '#444' },
          ]}
        >
          {item.type === 'text' && (
            <Text style={[styles.messageText, darkMode && { color: '#fff' }]}>
              {item.text}
            </Text>
          )}

          {item.type === 'image' && (
            <Image source={{ uri: item.text }} style={styles.imageMessage} resizeMode="cover" />
          )}

          {item.type === 'audio' && (
            <AudioMessagePlayer uri={item.text} isMyMessage={isMyMessage} />
          )}

          <Text
            style={{
              fontSize: 11,
              color: darkMode ? '#aaa' : '#999',
              alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
              marginTop: 2,
              marginHorizontal: 4,
            }}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, darkMode && { backgroundColor: '#000' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <GroupHeader title={name || 'المجموعة'} membersCount={12} settingId="45" />

      <FlatList
        ref={flatListRef}
        data={localMessages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={[styles.inputContainer, darkMode && { backgroundColor: '#222' }]}>
        <TextInput
          style={[styles.textInput, darkMode && { color: '#fff' }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="اكتب رسالة..."
          placeholderTextColor={darkMode ? '#aaa' : '#888'}
          multiline
        />

        <TouchableOpacity
          onPress={sendTextMessage}
          style={[styles.iconButton, { marginLeft: 8 }]}
          disabled={!inputText.trim()}
        >
          <Ionicons
            name="send"
            size={28}
            color={inputText.trim() ? (darkMode ? '#0af' : '#007aff') : '#ccc'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesList: {
    padding: 16,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 2,
    padding: 8,
    borderRadius: 18,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  myMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  otherMessage: {
    backgroundColor: '#eee',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  imageMessage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
