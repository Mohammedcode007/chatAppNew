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
import MessageInput from '@/components/MessageInput';
import GroupMessageItem from '@/components/GroupMessageItem';

type Message = {
  _id: string; // معرف حقيقي أو وهمي يبدأ بـ "temp-"
  type: 'text' | 'image' | 'audio';
  text: string;
  sender: {
    _id: string;
    username: string;
  }
  timestamp: number;
  isTemporary?: boolean;
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

  // حالة الرسائل المحلية تشمل الرسائل الوهمية والحقيقية
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  console.log(localMessages, '78878787');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          setUserData(JSON.parse(userDataString));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    })();
  }, []);

  // تحديث localMessages عند استقبال رسائل جديدة من الخادم
  useEffect(() => {
    if (!messages) return;

    const realMessages: Message[] = messages.map((msg: any) => ({
      _id: msg._id,
      type: msg.messageType,
      text: msg.text,
      sender: msg.sender,
      timestamp: new Date(msg.timestamp).getTime(),
      isTemporary: false,
    }));

    setLocalMessages(prev => {
      // حذف الرسائل الوهمية التي تم استبدالها
      const realIds = new Set(realMessages.map(m => m._id));
      const filteredPrev = prev.filter(m => m.isTemporary && !realIds.has(m._id.replace('temp-', '')));

      const combined = [...filteredPrev, ...realMessages];
      combined.sort((a, b) => a.timestamp - b.timestamp);
      return combined;
    });

    // تمرير إلى آخر الرسائل
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // إرسال رسالة نصية مع عرض الرسالة الوهمية فوراً
  const sendTextMessage = async () => {
    if (!inputText.trim() || !userData?._id) return;

    const tempId = `temp-${Date.now()}`;

    const newTempMessage: Message = {
      _id: tempId,
      type: 'text',
      text: inputText.trim(),
      sender: userData._id,
      timestamp: Date.now(),
      isTemporary: true,
    };

    // عرض الرسالة الوهمية فوراً
    setLocalMessages(prev => [...prev, newTempMessage]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      await sendMessage(inputText.trim(), 'text');
      // الرسائل الحقيقية ستصل وتحدث localMessages من useEffect أعلاه
    } catch (error) {
      // حذف الرسالة الوهمية عند فشل الإرسال
      setLocalMessages(prev => prev.filter(m => m._id !== tempId));
      console.error('Failed to send message:', error);
      // هنا يمكن إضافة إعلام المستخدم بالفشل
    }
  };

  // عرض الرسائل مع التفريق بين رسائل المستخدم والآخرين
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender._id === userData?._id;

    return (
       <GroupMessageItem item={item} currentUserId={userData?._id} />

    );
  };

  return (
   <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // يمكن تعديل الرقم حسب الـ header
    >
      <GroupHeader
        title={name || 'المجموعة'}
        membersCount={12}
        settingId="45"
        userId={userData?._id}
        groupId={groupId}
      />

      <FlatList
        ref={flatListRef}
        data={localMessages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <MessageInput
        inputText={inputText}
        onChangeText={setInputText}
        onSend={sendTextMessage}
        darkMode={darkMode}
      />
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
