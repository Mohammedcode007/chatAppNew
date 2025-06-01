// components/MessageInput.tsx
import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  darkMode: boolean;
};

export default function MessageInput({ inputText, onChangeText, onSend, darkMode }: Props) {
  return (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={80}
          style={{
            backgroundColor: darkMode ? "#121212" : "#ffffff",
          }}
        >
    <View style={[styles.inputContainer, darkMode && { backgroundColor: '#222' }]}>
      <TextInput
        style={[styles.textInput, darkMode && { color: '#fff' }]}
        value={inputText}
        onChangeText={onChangeText}
        placeholder="اكتب رسالة..."
        placeholderTextColor={darkMode ? '#aaa' : '#888'}
        multiline
      />
      <TouchableOpacity
        onPress={onSend}
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
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    maxHeight: 100,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
