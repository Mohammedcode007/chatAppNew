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
  Modal,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Text } from '@/components/Themed';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useThemeMode } from '@/context/ThemeContext';
import { Ionicons, MaterialIcons, Entypo } from '@expo/vector-icons';
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
  status?: 'sending' | 'sent' | 'seen'; // حالة الرسالة
}
type PlaybackStatus = {
  isLoaded: boolean;
  didJustFinish?: boolean;
};
export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  const { darkMode } = useThemeMode();
  const navigation = useNavigation();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'مرحباً كيف حالك؟',
      sender: 'other',
      time: '12:00',
      type: 'text',
      status: 'seen',
    },
    {
      id: '2',
      text: 'أنا بخير، شكراً! وأنت؟',
      sender: 'me',
      time: '12:01',
      type: 'text',
      status: 'seen',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // حالة تسجيل الصوت
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // لتحديث حالة الرسالة (محاكاة تأكيد الإرسال)
  const updateMessageStatus = (id: string, status: 'sending' | 'sent' | 'seen') => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, status } : msg))
    );
  };

  // إرسال رسالة نصية
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

    // محاكاة تأخير تأكيد الإرسال
    setTimeout(() => updateMessageStatus(newId, 'sent'), 1000);
  };

  // إرسال صورة
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

        // محاكاة تأكيد الإرسال
        setTimeout(() => updateMessageStatus(newId, 'sent'), 1000);
      }
    } catch (error) {
      console.warn('Error picking image:', error);
    } finally {
      setLoading(false);
    }
  };

  // تسجيل الصوت (start & stop) كما في الكود السابق مع إضافة حالة إرسال

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
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
    },
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

        // محاكاة تأكيد الإرسال
        setTimeout(() => updateMessageStatus(newId, 'sent'), 1000);
      }
    } catch (error) {
      console.warn('Error stopping recording:', error);
    }
    setIsRecording(false);
    setRecording(null);
    setLoading(false);
  };


// في داخل المكون ChatScreen:

const [sound, setSound] = useState<Audio.Sound | null>(null);
const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

const playAudio = async (message: Message) => {
  try {
    // إذا هناك صوت شغال سابقًا، أوقفه
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setPlayingMessageId(null);
      setSound(null);
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: message.uri! },
      { shouldPlay: true },
      onPlaybackStatusUpdate
    );
    setSound(newSound);
    setPlayingMessageId(message.id);
  } catch (error) {
    console.warn('Error playing audio:', error);
  }
};

const stopAudio = async () => {
  if (sound) {
    await sound.stopAsync();
    await sound.unloadAsync();
    setPlayingMessageId(null);
    setSound(null);
  }
};

const onPlaybackStatusUpdate = (status: PlaybackStatus) => {
  if (!status.isLoaded) return;
  if (status.didJustFinish) {
    setPlayingMessageId(null);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
  }
};

  // أيقونة حالة الرسالة حسب حالة الرسالة
  const MessageStatusIcon = ({ status }: { status?: Message['status'] }) => {
    switch (status) {
      case 'sending':
        return <Ionicons name="time-outline" size={14} color="#999" />;
      case 'sent':
        return <Ionicons name="checkmark-outline" size={14} color="#4caf50" />;
      case 'seen':
        return <Ionicons name="eye-outline" size={14} color="#2196f3" />;
      default:
        return null;
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender === 'me';
    const bubbleStyle: StyleProp<ViewStyle> = [
      styles.messageContainer,
      isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
      {
        alignSelf: isMyMessage
          ? isRTL
            ? 'flex-start'
            : 'flex-end'
          : isRTL
          ? 'flex-end'
          : 'flex-start',
        backgroundColor: isMyMessage
          ? darkMode
            ? '#0b93f6'
            : '#0084ff'
          : darkMode
          ? '#3a3a3a'
          : '#e5e5ea',
      },
    ];

    const textColor = isMyMessage ? '#fff' : darkMode ? '#fff' : '#000';

    return (
      <View style={bubbleStyle}>
        {item.type === 'text' && (
          <>
            <Text style={[styles.messageText, { color: textColor }]}>{item.text}</Text>
          </>
        )}

        {item.type === 'image' && item.uri && (
          <Image source={{ uri: item.uri }} style={styles.imageMessage} resizeMode="cover" />
        )}

        {item.type === 'file' && (
          <View style={styles.fileContainer}>
            <MaterialIcons name="insert-drive-file" size={32} color={textColor} />
            <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
              {item.fileName}
            </Text>
          </View>
        )}

 {item.type === 'audio' && item.uri && (
  <AudioMessagePlayer
    uri={item.uri}
    duration={item.duration}
    isMyMessage={isMyMessage}
  />
)}


        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Text style={[styles.messageTime, { color: isMyMessage ? '#d0e6ff' : darkMode ? '#ccc' : '#555' }]}>
            {item.time}
          </Text>

          {/* أيقونة حالة الرسالة تظهر فقط للرسائل المرسلة من المستخدم */}
          {isMyMessage && (
            <View style={{ marginLeft: 5 }}>
              <MessageStatusIcon status={item.status} />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.flatListContent}
          onContentSizeChange={scrollToEnd}
          onLayout={scrollToEnd}
          inverted={false}
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

        <Modal visible={loading} transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2196f3" />
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListContent: {
    padding: 12,
    paddingBottom: 70,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 10,
    marginVertical: 6,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 1,
  },
  myMessageContainer: {
    borderBottomRightRadius: 0,
  },
  otherMessageContainer: {
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 5,
  },
  audioContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  maxWidth: 150,
},

  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  iconButton: {
    padding: 6,
    marginHorizontal: 4,
  },
  imageMessage: {
    width: 200,
    height: 150,
    borderRadius: 15,
    marginBottom: 4,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    marginLeft: 10,
    fontSize: 16,
  },

  loadingOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
