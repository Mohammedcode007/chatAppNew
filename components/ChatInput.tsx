import React, { useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
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
  const rotation = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const waveformAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(waveformAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(waveformAnim, {
            toValue: 0.4,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      rotation.stopAnimation();
      rotation.setValue(0);
      waveformAnim.stopAnimation();
      waveformAnim.setValue(0.4);
    }
  }, [isRecording]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
      style={{
        backgroundColor: darkMode ? "#121212" : "#ffffff",
      }}
    >
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: darkMode ? "#121212" : "#ffffff",
            paddingBottom: insetsBottom || 12,
            borderTopColor: darkMode ? "#444" : "#ddd",
          },
        ]}
      >
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: darkMode ? "#1e1e1e" : "#f0f0f0",
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                color: darkMode ? "#fff" : "#000",
              },
            ]}
            placeholder="اكتب رسالة..."
            placeholderTextColor={darkMode ? "#888" : "#999"}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.iconsWrapper}>
            <TouchableWithoutFeedback
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={pickAndUploadImage}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <MaterialIcons name="image" size={20} color="#007AFF" style={styles.icon} />
              </Animated.View>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Animated.View style={[{ marginHorizontal: 6 }, isRecording && { transform: [{ rotate: spin }] }]}>
                <MaterialIcons
                  name={isRecording ? "stop" : "keyboard-voice"}
                  size={20}
                  color={isRecording ? "red" : "#007AFF"}
                />
              </Animated.View>
            </TouchableWithoutFeedback>

            {isRecording && (
              <Animated.View
                style={[
                  styles.waveform,
                  {
                    transform: [{ scaleY: waveformAnim }],
                    backgroundColor: "red",
                  },
                ]}
              />
            )}

            <TouchableWithoutFeedback
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={sendTextMessage}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Ionicons name="send" size={20} color="#007AFF" style={styles.icon} />
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    paddingHorizontal: 12,
    borderTopWidth: 1,
    elevation: 6,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: -2 },
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 6,
    paddingHorizontal: 10,
    maxHeight: 120,
  },
  iconsWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginHorizontal: 4,
  },
  waveform: {
    width: 4,
    height: 20,
    marginHorizontal: 4,
    borderRadius: 2,
  },
});

export default ChatInput;
