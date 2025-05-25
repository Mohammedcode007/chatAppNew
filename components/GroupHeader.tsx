import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons, Entypo, Feather, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useThemeMode } from '@/context/ThemeContext';
import { useNavigation } from 'expo-router';

type Props = {
  title: string;
  membersCount?: number;
};

export default function GroupHeader({ title, membersCount }: Props) {
  const { darkMode } = useThemeMode();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleOptionPress = (option: string) => {
    setMenuVisible(false);
    console.log(`Selected option: ${option}`);
    switch (option) {
      case 'leave':
        // تنفيذ مغادرة المجموعة
        break;
      case 'settings':
        // فتح صفحة الإعدادات
        break;
      case 'invite':
        // فتح نافذة الدعوة
        break;
      case 'report':
        // فتح واجهة الإبلاغ
        break;
      case 'share':
        // تنفيذ مشاركة المجموعة
        break;
    }
  };

  const menuOptions = [
    { label: 'Leave Group', value: 'leave', icon: <MaterialIcons name="exit-to-app" size={18} color={darkMode ? '#fff' : '#000'} /> },
    { label: 'Settings', value: 'settings', icon: <Feather name="settings" size={18} color={darkMode ? '#fff' : '#000'} /> },
    { label: 'Invite', value: 'invite', icon: <Feather name="user-plus" size={18} color={darkMode ? '#fff' : '#000'} /> },
    { label: 'Report', value: 'report', icon: <MaterialIcons name="report" size={18} color="red" /> },
    { label: 'Share Group', value: 'share', icon: <AntDesign name="sharealt" size={18} color={darkMode ? '#fff' : '#000'} /> },
  ];

  return (
    <View style={[styles.header, darkMode && { backgroundColor: '#111', borderBottomColor: '#333' }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={darkMode ? '#fff' : '#000'} />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={[styles.title, darkMode && { color: '#fff' }]}>{title}</Text>
        {typeof membersCount === 'number' && (
          <Text style={[styles.subTitle, darkMode && { color: '#aaa' }]}>
            {membersCount} أعضاء
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
        <Entypo name="dots-three-vertical" size={20} color={darkMode ? '#fff' : '#000'} />
      </TouchableOpacity>

      <Modal transparent visible={menuVisible} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuContainer, darkMode && { backgroundColor: '#222' }]}>
            {menuOptions.map(item => (
              <TouchableOpacity
                key={item.value}
                onPress={() => handleOptionPress(item.value)}
                style={styles.menuItem}
              >
                <View style={styles.menuItemContent}>
                  {item.icon}
                  <Text style={[styles.menuText, darkMode && { color: '#fff' }]}>{item.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 12,
    paddingTop: 50,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 13,
    color: '#666',
  },
  menuButton: {
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    width: 200,
    elevation: 4,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
  },
});
