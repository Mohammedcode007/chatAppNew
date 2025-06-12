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
  Alert,
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
import DraggableFAB from '@/components/DraggableFAB';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from "expo-av";
import axios from 'axios';
import { API_URL } from '@/config';

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
  senderType?: 'user' | 'system'; // ← أضف هذا الحقل هنا

};



export default function GroupChatScreen() {
  const { groupId, name, description, members } = useLocalSearchParams<{ groupId: string; name?: string, description?: string, members?: string }>();
  const { darkMode } = useThemeMode();
  const [userData, setUserData] = useState<any>(null);
  const [senderType, setSenderType] = useState<'user' | 'system'>('user');
  const insets = useSafeAreaInsets();

  const { messages, loading, error, sendMessage } = useGroupMessages(groupId, userData?._id || '');
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const scrollToEnd = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const navigation = useNavigation();

  // حالة الرسائل المحلية تشمل الرسائل الوهمية والحقيقية
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

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
      sender: msg?.sender,
      timestamp: new Date(msg.timestamp).getTime(),
      isTemporary: false,
      senderType: msg.senderType, // ← أضف هذا السطر

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
    // setLocalMessages(prev => [...prev, newTempMessage]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      await sendMessage(inputText.trim(), 'text', senderType);
      setLocalMessages(prev => prev.filter(m => m._id !== tempId));

      // الرسائل الحقيقية ستصل وتحدث localMessages من useEffect أعلاه
    } catch (error) {
      // حذف الرسالة الوهمية عند فشل الإرسال
      // setLocalMessages(prev => prev.filter(m => m._id !== tempId));
      console.error('Failed to send message:', error);
      // هنا يمكن إضافة إعلام المستخدم بالفشل
    }
  };
  const displayMessages = [
    { _id: 'static-header', type: 'header' },
    ...localMessages,
  ];



  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading1, setLoading] = useState(false);

  const pickAndUploadImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      await uploadImage(uri);
    } else {
      Alert.alert('إلغاء', 'لم يتم اختيار أي صورة');
    }
  };

  const uploadImage = async (uri: string) => {
    setLoading(true);

    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      name: `upload.${fileType}`,
      type: `image/${fileType}`,
    } as any); // لتفادي مشاكل التوافق في TypeScript

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await sendMessage(response.data.url, 'image', senderType);



      scrollToEnd();
    } catch (error) {
      console.error(error);
      Alert.alert('خطأ', 'حدث خطأ أثناء رفع الصورة');
    } finally {
      setLoading(false);
    }
  };



  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);


  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("صلاحية مطلوبة", "يجب منح صلاحية الميكروفون");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error("فشل في بدء التسجيل:", error);
      Alert.alert("خطأ", "تعذر بدء التسجيل");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);

      if (uri) {
        await uploadFile(uri, "sound");
      }
    } catch (error) {
      console.error("خطأ في إيقاف التسجيل:", error);
      Alert.alert("خطأ", "تعذر إيقاف التسجيل");
    }
  };

  const uploadFile = async (uri: string, type: "sound") => {
    setLoading(true);

    const uriParts = uri.split(".");
    const fileType = uriParts[uriParts.length - 1] || (type === "sound" ? "m4a" : "jpg");

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: `upload.${fileType}`,
      type: `${type}/${fileType}`,
    } as any);

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(response.data.url, 'response.data.url');

      await sendMessage(response.data.url, 'audio', senderType);



      scrollToEnd();
    } catch (error) {
      console.error(`خطأ أثناء رفع ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message | { _id: string, type: string } }) => {
    if (item.type === 'header') {
      if (description !== "") {
        return (
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>{description}</Text>
          </View>
        );
      } else {
        return null; // لا تعرض شيء إطلاقًا إذا كان الوصف فارغ
      }
    }

    return <GroupMessageItem item={item as Message} currentUserId={userData?._id} />;
  };



  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // يمكن تعديل الرقم حسب الـ header
    >
      <GroupHeader
        title={name || 'المجموعة'}
        membersCount={members}
        settingId="45"
        userId={userData?._id}
        groupId={groupId}
      />

      <FlatList
        ref={flatListRef}
        data={displayMessages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
             onContentSizeChange={scrollToEnd}
          onLayout={scrollToEnd}
        // onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        // onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />


      <MessageInput


        inputText={inputText}
        onChangeText={setInputText}
        onSend={sendTextMessage}
        darkMode={darkMode}
        pickAndUploadImage={pickAndUploadImage}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        insetsBottom={insets.bottom}


      // inputText={inputText}
      // onChangeText={setInputText}
      // onSend={sendTextMessage}
      // darkMode={darkMode}
      />
      {/** الزر العائم */}
      <DraggableFAB onSearchPress={() => console.log('فتح البحث')} messages={localMessages} />

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
  headerContainer: {
    padding: 10,
    backgroundColor: '#e6f7ff',
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: 'center',
  },
  headerText: {
    fontSize: 14,
    color: '#007acc',
  },

});
