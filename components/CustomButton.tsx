import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  width?: number | string;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

const isDimensionValue = (value: any): value is number | `${number}%` => {
  if (typeof value === 'number') return true;
  if (typeof value === 'string' && /^\d+%$/.test(value)) return true;
  return false;
};

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  width = '100%',
  borderWidth = 0,
  borderColor = 'transparent',
  backgroundColor = '#007AFF',
  color = '#fff',
  style,
  textStyle,
  disabled = false,
}) => {
  const widthStyle = isDimensionValue(width) ? { width } : {};

  return (
    <TouchableOpacity
      style={[
        styles.button,
        widthStyle,
        {
          borderWidth,
          borderColor,
          backgroundColor: disabled ? '#a1a1a1' : backgroundColor,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          { color: disabled ? '#e1e1e1' : color },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
