import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

type ChatInputProps = {
  darkMode: boolean;
  newMessage: string;
  setNewMessage: (text: string) => void;
  pickAndUploadImage: () => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  sendTextMessage: () => void;
  insetsBottom: number;
};

const ChatInput: React.FC<ChatInputProps> = ({
  darkMode,
  newMessage,
  setNewMessage,
  pickAndUploadImage,
  isRecording,
  startRecording,
  stopRecording,
  sendTextMessage,
  insetsBottom,
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
      style={{ backgroundColor: darkMode ? "#121212" : "#f2f2f2" }}
    >
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: darkMode ? "#121212" : "#f2f2f2",
            paddingBottom: insetsBottom || 12,
            borderTopColor: darkMode ? "#444" : "#ccc",
            shadowColor: darkMode ? "#000" : "#aaa",
            shadowOpacity: 0.1,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: -2 },
            elevation: 5,
          },
        ]}
      >
        <TouchableOpacity
          onPress={pickAndUploadImage}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="image" size={28} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={isRecording ? "stop" : "keyboard-voice"}
            size={28}
            color={isRecording ? "red" : "#007AFF"}
          />
        </TouchableOpacity>

        <TextInput
          style={[
            styles.input,
            {
              color: darkMode ? "#fff" : "#000",
              minHeight: 40,
              maxHeight: 120,
            },
          ]}
          placeholder="اكتب رسالة..."
          placeholderTextColor={darkMode ? "#888" : "#999"}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          scrollEnabled={true}
          textAlignVertical="top"
        />

        <TouchableOpacity
          onPress={sendTextMessage}
          style={[styles.iconButton, { marginLeft: 8 }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="send" size={24} color={darkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  iconButton: {
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatInput;
