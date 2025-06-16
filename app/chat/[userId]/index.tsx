import React, { useEffect, useRef, useState } from "react";
import {
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardEvent,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useThemeMode } from "@/context/ThemeContext";
import { useConversation } from "@/Hooks/useConversation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import ChatHeader from "@/components/ChatHeader";

import { API_URL } from "@/config";
import axios from "axios";
import AudioMessage from "@/components/AudioMessage";
import ChatInput from "@/components/ChatInput";

interface Message {
  replyTo?: Message;
  _id: string;
  text: string;
  sender: string;
  receiver: string;
  timestamp: string;
  messageType?: "text" | "image" | "sound" | "video" | "gif";
  status: "sent" | "delivered" | "received" | "seen";
}

interface ChatScreenProps {
  chatName: string;
  userStatus: 'online' | 'offline' | string;
  currentUserId: string;
  messages: Message[];
  onBackPress: () => void;
  onMenuPress: () => void;
}
export default function ChatScreen() {
  const { userId, name, status } = useLocalSearchParams<{
    userId: string;
    name?: string;
    status?: string;
  }>(); const { darkMode } = useThemeMode();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    openChat,
    closeChat
  } = useConversation(userId);

  const [userData, setUserData] = useState<any>(null);
  const flatListRef = useRef<FlatList<Message> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const reactionsList = ["👍", "❤️", "😂", "😮", "😢", "👏"];

  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/sound/notiy-pvt.mp3")
      );
      soundRef.current = sound;
    } catch (error) {
      console.error("Failed to load sound", error);
    }
  };

  useEffect(() => {
    loadSound();

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (messages.length === 0 || !userData?._id) return;

    const lastMessage = messages[messages.length - 1];

    if (lastMessage.sender !== userData._id) {
      soundRef.current?.replayAsync();
    }
  }, [messages]);

  useEffect(() => {
    openChat();
    console.log("ChatScreen mounted - openChat called");

    return () => {
      closeChat();
      console.log("ChatScreen unmounted - closeChat called, user left chat");
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("userData");
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserData(userData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);


  const scrollToEnd = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };



  const sendTextMessage = () => {
    if (newMessage.trim().length === 0) return;

    sendMessage({
      text: newMessage.trim(),
      senderId: userData?._id,
      messageType: "text",
    });

    setNewMessage("");
    scrollToEnd();
  };


  const renderItem = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender === userData?._id;

    function formatElapsedTimeEnglish(timestamp: number): string {
      const now = Date.now();
      const diff = now - timestamp;

      const seconds = Math.floor(diff / 1000);
      if (seconds < 60) return 'Just now';

      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

      const date = new Date(timestamp);
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }


    const renderMessageContent = () => {
      switch (item.messageType) {
        case 'image':
          return (
            <Image
              source={{ uri: item.text }}
              style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 4 }}
              resizeMode="cover"
            />
          );

        case 'gif':
          return (
            <Image
              source={{ uri: item.text }}
              style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 4 }}
              resizeMode="contain"
            />
          );

        case 'sound':
          return <AudioMessage uri={item.text} />;


        default:
          return (
            <Text
              style={{
                color: isMyMessage ? '#fff' : '#000',
                fontSize: 16,
              }}
            >
              {item.text}
            </Text>
          );
      }
    };
    const getStatusIcon = (status: Message["status"]) => {
      switch (status) {
        case "sent":
          return <Ionicons name="checkmark-outline" size={14} color="#ccc" />;
        case "delivered":
          return <Ionicons name="checkmark-done-outline" size={14} color="#4caf50" />;
        case "received":
          return <Ionicons name="arrow-down-circle-outline" size={14} color="#2196f3" />;
        case "seen":
          return <Ionicons name="eye-outline" size={14} color="#fff" />;
        default:
          return null;
      }
    };

    return (
      <TouchableOpacity
        onLongPress={() => setSelectedMessage(item)}
        activeOpacity={0.7}
        style={[
          styles.messageContainer,
          { justifyContent: isMyMessage ? "flex-end" : "flex-start" },
        ]}
      >

        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isMyMessage
                ? darkMode
                  ? "#6A2D91"
                  : "#6A2D91"
                : darkMode
                  ? "#3A3A3C"
                  : "#E5E5EA",
              borderBottomRightRadius: isMyMessage ? 0 : 20,
              borderBottomLeftRadius: isMyMessage ? 20 : 0,
            },
          ]}
        >
          {item.replyTo && (
            <View style={{
              backgroundColor: darkMode ? "#555" : "#ddd",
              padding: 6,
              borderRadius: 8,
              marginBottom: 4,
            }}>
              <Text style={{ fontStyle: "italic", color: darkMode ? "#eee" : "#333" }}>
                رد على: {item.replyTo.text}
              </Text>
            </View>
          )}

          {renderMessageContent()}



          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              marginTop: 0,
            }}
          >
            <Text
              style={[
                styles.timeText,
                { color: isMyMessage ? "#d1eaff" : darkMode ? "#aaa" : "#666" },
              ]}
            >
              {formatElapsedTimeEnglish(new Date(item.timestamp).getTime())}
            </Text>
            {reactions[item._id] && reactions[item._id].length > 0 && (
              <View style={{ flexDirection: "row", marginTop: 4 }}>
                {reactions[item._id].map((reaction, idx) => (
                  <Text key={idx} style={{ marginRight: 6, fontSize: 16 }}>
                    {reaction}
                  </Text>
                ))}
              </View>
            )}

            {isMyMessage && <View style={{ marginLeft: 4 }}>{getStatusIcon(item.status)}</View>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const onBackPress = () => {
    navigation.goBack();
  };
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    } as any);

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      sendMessage({
        text: response.data.url,
        senderId: userData?._id,
        messageType: "image",
      });

      setNewMessage("");
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

      sendMessage({
        text: response.data.url,
        senderId: userData?._id,
        messageType: 'sound',
      });

      scrollToEnd();
    } catch (error) {
      console.error(`خطأ أثناء رفع ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };
  if (typeof darkMode !== 'boolean') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
        <ChatHeader
          chatName={name?.toString() ?? "اسم افتراضي"}
          userStatus={status?.toString() ?? " حاله افتراضيه"}
          onBackPress={onBackPress}
          userId={userId}
        />

        <FlatList
          ref={flatListRef}
          data={messages}
          extraData={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.flatListContent}
          onContentSizeChange={scrollToEnd}
          onLayout={scrollToEnd}
          keyboardShouldPersistTaps="handled"
        />

        <ChatInput
          darkMode={darkMode}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          pickAndUploadImage={pickAndUploadImage}
          isRecording={isRecording}
          startRecording={startRecording}
          stopRecording={stopRecording}
          sendTextMessage={sendTextMessage}
          insetsBottom={0}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flatListContent: {
    padding: 12,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 6,
    paddingHorizontal: 10,
  },
  messageBubble: {
    maxWidth: "85%",
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  iconButton: {
    paddingLeft: 12,
  },
});
