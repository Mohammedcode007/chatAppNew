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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useThemeMode } from "@/context/ThemeContext";
import { useConversation } from "@/Hooks/useConversation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import ChatHeader from "@/components/ChatHeader";
import * as Clipboard from 'expo-clipboard';

interface Message {
  replyTo?: Message;  // الآن اختيارية
  _id: string;
  text: string;
  sender: string;
  receiver: string;
  timestamp: string;
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
    // soundRef.current?.replayAsync();

    // لو كانت آخر رسالة واردة وليست مرسلة من المستخدم الحالي
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
    sendMessage({ text: newMessage.trim(), senderId: userData?._id });
    setNewMessage("");
    scrollToEnd();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "م" : "ص";
    const h = hours % 12 || 12;
    const m = minutes < 10 ? "0" + minutes : minutes;
    return `${h}:${m} ${ampm}`;
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender === userData?._id;

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

          <Text
            style={[
              styles.messageText,
              { color: isMyMessage ? "#fff" : darkMode ? "#fff" : "#000" },
            ]}
          >
            {item.text}
          </Text>
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
              {formatTime(item.timestamp)}
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

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const MAX_KEYBOARD_HEIGHT = 90;

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  function onMenuPress(): void {
    throw new Error("Function not implemented.");
  }

  const onBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
      <ChatHeader
        chatName={name?.toString() ?? "اسم افتراضي"}
        userStatus={status?.toString() ?? " حاله افتراضيه"}
        onBackPress={onBackPress}
        userId={userId}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1, paddingBottom: Math.min(keyboardHeight, MAX_KEYBOARD_HEIGHT) }}>
            <FlatList<Message>
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

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: darkMode ? "#121212" : "#f2f2f2",
                  paddingBottom: insets.bottom || 12, // **هنا تم إضافة مساحة آمنة في الأسفل**
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: darkMode ? "#fff" : "#000" }]}
                placeholder="اكتب رسالة..."
                placeholderTextColor={darkMode ? "#888" : "#999"}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />
              <TouchableOpacity onPress={sendTextMessage} style={styles.iconButton}>
                <Ionicons name="send" size={24} color={darkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      {/* قائمة خيارات التفاعل */}
      <Modal
        visible={!!selectedMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMessage(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedMessage(null)}>
          <View style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}>
            <View style={{
              backgroundColor: darkMode ? "#333" : "#fff",
              borderRadius: 12,
              padding: 16,
              width: "100%",
              maxWidth: 300,
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 12,
                color: darkMode ? "#fff" : "#000",
                textAlign: "center",
              }}>
                اختر خياراً
              </Text>

              {/* زر الرد */}
              <TouchableOpacity
                style={{ paddingVertical: 10 }}
                onPress={() => {
                  setNewMessage(`@${selectedMessage?.sender}: `);
                  setSelectedMessage(null);
                }}
              >
                <Text style={{ fontSize: 16, color: "#007aff", textAlign: "center" }}>
                  رد على الرسالة
                </Text>
              </TouchableOpacity>

              {/* قائمة ردود الفعل */}
              <View style={{ flexDirection: "row", justifyContent: "center", marginVertical: 12 }}>
                {reactionsList.map((reaction) => (
                  <TouchableOpacity
                    key={reaction}
                    style={{ marginHorizontal: 6 }}
                    onPress={() => {
                      if (!selectedMessage) return;
                      const msgId = selectedMessage._id;
                      setReactions((prev) => {
                        const currentReactions = prev[msgId] || [];
                        return {
                          ...prev,
                          [msgId]: currentReactions.includes(reaction)
                            ? currentReactions.filter(r => r !== reaction)
                            : [...currentReactions, reaction],
                        };
                      });
                      setSelectedMessage(null);
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{reaction}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* زر النسخ */}
              <TouchableOpacity
                style={{ paddingVertical: 10 }}
                onPress={async () => {
                  if (selectedMessage) {
                    await Clipboard.setStringAsync(selectedMessage.text);

                    Alert.alert("تم النسخ", "تم نسخ نص الرسالة إلى الحافظة");
                    setSelectedMessage(null);
                  }
                }}

              >
                <Text style={{ fontSize: 16, color: "#007aff", textAlign: "center" }}>
                  نسخ نص الرسالة
                </Text>
              </TouchableOpacity>

              {/* زر إلغاء */}
              <TouchableOpacity
                style={{ paddingVertical: 10 }}
                onPress={() => setSelectedMessage(null)}
              >
                <Text style={{ fontSize: 16, color: darkMode ? "#aaa" : "#555", textAlign: "center" }}>
                  إلغاء
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
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
