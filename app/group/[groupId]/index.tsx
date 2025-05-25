import React, { useState, useEffect, useRef } from 'react';
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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import AudioMessagePlayer from '@/components/AudioMessagePlayer';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import GroupHeader from '@/components/GroupHeader';
type Message = {
  id: string;
  type: 'text' | 'image' | 'audio';
  content: string;
  sender: string;
  timestamp: number;
};

export default function GroupChatScreen() {
  const { groupId, name } = useLocalSearchParams<{ groupId: string; name?: string }>();
  const { darkMode } = useThemeMode();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const navigation = useNavigation();

useLayoutEffect(() => {
  navigation.setOptions({ headerShown: false });
}, []);
  useEffect(() => {
    const initialMessages: Message[] = [
      {
        id: '1',
        type: 'text',
        content: 'مرحبًا بكم في المجموعة!',
        sender: 'Admin',
        timestamp: Date.now() - 60000,
      },
      {
        id: '2',
        type: 'image',
        content: 'https://randomuser.me/api/portraits/men/32.jpg',
        sender: 'Ahmed',
        timestamp: Date.now() - 30000,
      },
    ];
    setMessages(initialMessages);
  }, [groupId]);

  const sendTextMessage = () => {
    if (!inputText.trim()) return;

    setSending(true);
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'text',
      content: inputText.trim(),
      sender: 'You',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setSending(false);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'image',
        content: imageUri,
        sender: 'You',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        alert('يرجى السماح بالوصول إلى الميكروفون');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: 2,
          audioEncoder: 3,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.caf',
          audioQuality: 127,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
      };

      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();

      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('حدث خطأ أثناء التسجيل:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);

      if (uri) {
        const newMessage: Message = {
          id: Date.now().toString(),
          type: 'audio',
          content: uri,
          sender: 'You',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      console.error('خطأ في إيقاف التسجيل:', error);
    }
  };

 const renderMessage = ({ item }: { item: Message }) => {
  const isMyMessage = item.sender === 'You';

  return (
    <View style={{ marginBottom: 2 }}>
      {/* 👤 اسم المرسل */}
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

      {/* 💬 الرسالة نفسها */}
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage,
          darkMode && { backgroundColor: isMyMessage ? '#0a84ff' : '#444' },
        ]}
      >
        {item.type === 'text' && (
          <Text style={[styles.messageText, darkMode && { color: '#fff' }]}>
            {item.content}
          </Text>
        )}

        {item.type === 'image' && (
          <Image
            source={{ uri: item.content }}
            style={styles.imageMessage}
            resizeMode="cover"
          />
        )}

        {item.type === 'audio' && (
          <AudioMessagePlayer uri={item.content} isMyMessage={isMyMessage} />
        )}
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
   <GroupHeader title={name || 'Group Chat'} membersCount={12} />


      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={[styles.inputContainer, darkMode && { backgroundColor: '#222' }]}>
        <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
          <Ionicons name="image" size={28} color={darkMode ? '#fff' : '#000'} />
        </TouchableOpacity>

        <TextInput
          style={[styles.textInput, darkMode && { color: '#fff' }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="اكتب رسالة..."
          placeholderTextColor={darkMode ? '#aaa' : '#888'}
          multiline
        />

        {isRecording ? (
          <TouchableOpacity onPress={stopRecording} style={styles.iconButton}>
            <MaterialIcons name="stop-circle" size={32} color="red" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startRecording} style={styles.iconButton}>
            <Ionicons name="mic" size={28} color={darkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={sendTextMessage}
          style={[styles.iconButton, { marginLeft: 8 }]}
          disabled={sending}
        >
          <Ionicons name="send" size={28} color={inputText.trim() ? (darkMode ? '#0af' : '#007aff') : '#ccc'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 2,
    padding: 4,
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
    width: 180,
    height: 120,
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  iconButton: {
    marginHorizontal: 6,
  },
});
