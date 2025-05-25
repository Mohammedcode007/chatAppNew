import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
  Image,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useThemeMode } from '@/context/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import AudioMessagePlayer from '@/components/AudioMessagePlayer';

interface Message {
  id: string;
  text?: string;
  sender: 'me' | 'other';
  time: string;
  type: 'text' | 'image' | 'file' | 'audio';
  uri?: string;
  fileName?: string;
  duration?: number;
  status?: 'sending' | 'sent' | 'seen';
}

export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  const { darkMode } = useThemeMode();
  const navigation = useNavigation();
const [audioProgress, setAudioProgress] = useState(0); // قيمة بين 0 و 1

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: name || 'الدردشة',
      headerShown: true,
      animation: 'slide_from_right',
    });
  }, [name]);

  const isRTL = I18nManager.isRTL;

  const scrollToEnd = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const updateMessageStatus = (id: string, status: 'sending' | 'sent' | 'seen') => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, status } : msg))
    );
  };

  const sendTextMessage = () => {
    if (inputText.trim().length === 0) return;
    const newId = Date.now().toString();
    const newMessage: Message = {
      id: newId,
      text: inputText.trim(),
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      status: 'sending',
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    scrollToEnd();
    setTimeout(() => updateMessageStatus(newId, 'sent'), 1000);
  };

  const sendImage = async () => {
    try {
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const newId = Date.now().toString();
        const newMessage: Message = {
          id: newId,
          sender: 'me',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'image',
          uri: asset.uri,
          status: 'sending',
        };
        setMessages((prev) => [...prev, newMessage]);
        scrollToEnd();
        setTimeout(() => updateMessageStatus(newId, 'sent'), 1000);
      }
    } catch (error) {
      console.warn('Error picking image:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordingOptions = {
    android: {
      extension: '.m4a', outputFormat: 2, audioEncoder: 3,
      sampleRate: 44100, numberOfChannels: 2, bitRate: 128000,
    },
    ios: {
      extension: '.caf', audioQuality: 127, sampleRate: 44100,
      numberOfChannels: 2, bitRate: 128000, linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false, linearPCMIsFloat: false,
    },
    web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
  };

  const startRecording = async () => {
    try {
      setLoading(true);
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        alert('لم يتم منح الإذن لتسجيل الصوت');
        setLoading(false);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.warn('Error starting recording:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        const statusRec = await recording.getStatusAsync();
        const durationSec = statusRec.durationMillis ? statusRec.durationMillis / 1000 : 0;
        const newId = Date.now().toString();
        const newMessage: Message = {
          id: newId,
          sender: 'me',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'audio',
          uri,
          duration: Math.round(durationSec),
          status: 'sending',
        };
        setMessages((prev) => [...prev, newMessage]);
        scrollToEnd();
        setTimeout(() => updateMessageStatus(newId, 'sent'), 1000);
      }
    } catch (error) {
      console.warn('Error stopping recording:', error);
    }
    setIsRecording(false);
    setRecording(null);
    setLoading(false);
  };

  const MessageStatusIcon = ({ status }: { status?: Message['status'] }) => {
    switch (status) {
      case 'sending': return <Ionicons name="time-outline" size={14} color="#999" />;
      case 'sent': return <Ionicons name="checkmark-outline" size={14} color="#4caf50" />;
      case 'seen': return <Ionicons name="eye-outline" size={14} color="#2196f3" />;
      default: return null;
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender === 'me';
    const bubbleStyle: StyleProp<ViewStyle> = [
      styles.messageContainer,
      isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
      {
        alignSelf: isMyMessage
          ? isRTL ? 'flex-start' : 'flex-end'
          : isRTL ? 'flex-end' : 'flex-start',
        backgroundColor: isMyMessage
          ? darkMode ? '#0b93f6' : '#0084ff'
          : darkMode ? '#3a3a3a' : '#e5e5ea',
      },
    ];
    const textColor = isMyMessage ? '#fff' : darkMode ? '#fff' : '#000';
    return (
      <View style={bubbleStyle}>
        {item.type === 'text' && (
          <Text style={[styles.messageText, { color: textColor }]}>{item.text}</Text>
        )}
        {item.type === 'image' && item.uri && (
          <Image source={{ uri: item.uri }} style={styles.imageMessage} resizeMode="cover" />
        )}
        {item.type === 'file' && (
          <View style={styles.fileContainer}>
            <MaterialIcons name="insert-drive-file" size={32} color={textColor} />
            <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>{item.fileName}</Text>
          </View>
        )}
        {item.type === 'audio' && item.uri && (
          <AudioMessagePlayer uri={item.uri} duration={item.duration} isMyMessage={isMyMessage} />
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Text style={[styles.messageTime, { color: isMyMessage ? '#d0e6ff' : darkMode ? '#ccc' : '#555' }]}>{item.time}</Text>
          {isMyMessage && <View style={{ marginLeft: 5 }}><MessageStatusIcon status={item.status} /></View>}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.flatListContent}
        onContentSizeChange={scrollToEnd}
        onLayout={scrollToEnd}
      />
      <View style={[styles.inputContainer, { backgroundColor: darkMode ? '#121212' : '#f2f2f2' }]}>
        <TouchableOpacity onPress={sendImage} style={styles.iconButton}>
          <Ionicons name="image-outline" size={24} color={darkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { color: darkMode ? '#fff' : '#000' }]}
          placeholder="اكتب رسالة..."
          placeholderTextColor={darkMode ? '#888' : '#999'}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        {!isRecording ? (
          <TouchableOpacity onPress={sendTextMessage} style={styles.iconButton}>
            <Ionicons name="send" size={24} color={darkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={stopRecording} style={styles.iconButton}>
            <Ionicons name="stop-circle" size={28} color="#f44336" />
          </TouchableOpacity>
        )}
        {!isRecording && (
          <TouchableOpacity onPress={startRecording} style={styles.iconButton}>
            <Ionicons name="mic-outline" size={24} color={darkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
        )}
      </View>
      {loading && <ActivityIndicator size="large" color="#007aff" style={{ position: 'absolute', top: '50%', left: '50%' }} />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flatListContent: { padding: 10 },
  messageContainer: { borderRadius: 10, padding: 10, marginVertical: 5, maxWidth: '75%' },
  myMessageContainer: {},
  otherMessageContainer: {},
  messageText: { fontSize: 16 },
  messageTime: { fontSize: 12, marginTop: 4, textAlign: 'right' },
  imageMessage: { width: 200, height: 200, borderRadius: 10 },
  fileContainer: { flexDirection: 'row', alignItems: 'center' },
  fileName: { marginLeft: 10, flex: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  input: { flex: 1, fontSize: 16, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20 },
  iconButton: { marginHorizontal: 6 },
});
