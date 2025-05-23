import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface MoreItemProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  direction?: 'left' | 'right';
  showRadio?: boolean;
  checked?: boolean;
  onPress?: () => void;
  showSwitch?: boolean;
  switchEnabled?: boolean;
  onToggleSwitch?: (value: boolean) => void;
  textColor?: string; // <== أضف هذا
}

const MoreItem: React.FC<MoreItemProps> = ({
  icon,
  title,
  direction = 'right',
  showRadio = false,
  checked = false,
  onPress,
  showSwitch = false,
  switchEnabled = false,
  onToggleSwitch,
  textColor = '#000', // <== اللون الافتراضي أسود
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!!onToggleSwitch}
    >
      <Ionicons name={icon} size={24} style={[
        styles.leftIcon,
        {
          color: textColor,
          marginRight: direction === 'right' ? 10 : 0,
          marginLeft: direction === 'left' ? 10 : 0,
        }
      ]} />
      <Text style={[styles.title, { color: textColor, fontWeight: 'bold' }]}>{title}</Text>

      {showSwitch ? (
        <Switch
          value={switchEnabled}
          onValueChange={onToggleSwitch}
        />
      ) : showRadio ? (
        <FontAwesome
          name={checked ? 'dot-circle-o' : 'circle-o'}
          size={20}
          style={styles.radio}
        />
      ) : (
        <Ionicons
          name={direction === 'right' ? 'chevron-forward' : 'chevron-back'}
          size={20}
          style={[styles.arrow, { color: textColor }]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  leftIcon: {
    color: '#555',
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold', // الخط بولد
  },
  arrow: {
    color: '#888',
  },
  radio: {
    color: '#007AFF',
  },
});

export default MoreItem;
