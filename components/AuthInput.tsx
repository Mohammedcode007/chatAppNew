import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthInputProps extends TextInputProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  darkMode?: boolean;  // ← إضافة خاصية الوضع الليلي
}

export default function AuthInput({ iconName, style, darkMode = false, ...props }: AuthInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.inputContainer,
        isFocused && { borderColor: darkMode ? '#bb86fc' : '#491B6D' },
        { backgroundColor: darkMode ? '#1e1e1e' : '#fff' },
      ]}
    >
      <Ionicons
        name={iconName}
        size={20}
        color={isFocused ? (darkMode ? '#bb86fc' : '#007AFF') : (darkMode ? '#888' : '#888')}
        style={styles.icon}
      />
      <TextInput
        {...props}
        style={[
          styles.input,
          style,
          { color: darkMode ? '#fff' : '#000' }
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor={darkMode ? '#aaa' : '#999'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
  },
});
