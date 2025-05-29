import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  I18nManager,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next'; // تأكد من إعداد i18n لديك
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/context/ThemeContext';

interface ChatHeaderProps {
  chatName: string;
  userStatus: 'online' | 'offline' | string;
  onBackPress: () => void;
  onMenuPress?: () => void; // الآن غير مطلوب لأننا سنستخدم داخل المكون القائمة المنبثقة
  onBlockPress: () => void; // دالة يتم تنفيذها عند الضغط على "بلوك"
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatName,
  userStatus,
  onBackPress,
  onBlockPress,
}) => {
  const { darkMode } = useThemeMode();
  const [language, setLanguage] = useState('en');
  const isRTL = language === 'ar';
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const getStoredLang = async () => {
      const lang = await AsyncStorage.getItem('appLanguage');
      if (lang) {
        setLanguage(lang);
        i18n.changeLanguage(lang);
        I18nManager.forceRTL(lang === 'ar');
      }
    };
    getStoredLang();
  }, []);

  const openMenu = () => {
    setModalVisible(true);
  };

  const closeMenu = () => {
    setModalVisible(false);
  };

  const handleBlock = () => {
    closeMenu();
    onBlockPress();
  };

  return (
    <>
      <View
        style={[
          styles.headerContainer,
          { backgroundColor: darkMode ? '#121212' : '#fff' },
          isRTL && { flexDirection: 'row-reverse' },
        ]}
      >
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.iconButton}
          accessibilityLabel={i18n.t('back') || 'Back'}
        >
          <Ionicons
            name={isRTL ? 'arrow-forward' : 'arrow-back'}
            size={24}
            color={darkMode ? '#fff' : '#000'}
          />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.chatName,
              { color: darkMode ? '#fff' : '#000', textAlign: isRTL ? 'right' : 'left' },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {chatName}
          </Text>
          <Text
            style={[
              styles.userStatus,
              { color: userStatus === 'online' ? '#4CAF50' : darkMode ? '#bbb' : '#555' },
              { textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {userStatus === 'online'
              ? i18n.t('online') || 'متصل'
              : i18n.t('offline') || 'غير متصل'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={openMenu}
          style={styles.iconButton}
          accessibilityLabel={i18n.t('menu') || 'Menu'}
        >
          <Ionicons
            name="menu"
            size={28}
            color={darkMode ? '#fff' : '#000'}
          />
        </TouchableOpacity>
      </View>

      {/* القائمة المنبثقة */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <View style={[styles.menuContainer, { backgroundColor: darkMode ? '#333' : '#fff' }]}>
            <TouchableOpacity onPress={handleBlock} style={styles.menuItem}>
              <Text style={[styles.menuItemText, { color: darkMode ? '#fff' : '#000' }]}>
                {i18n.t('block') || 'بلوك'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    height: Platform.OS === 'ios' ? 90 : 60,
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  iconButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  chatName: {
    fontSize: 18,
    fontWeight: '600',
  },
  userStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    marginTop: Platform.OS === 'ios' ? 90 : 60,
    marginRight: 15,
    borderRadius: 6,
    paddingVertical: 8,
    width: 120,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  menuItemText: {
    fontSize: 16,
  },
});

export default ChatHeader;
