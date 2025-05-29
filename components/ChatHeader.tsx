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
import i18n from 'i18next';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/context/ThemeContext';
import { useBlockUser } from '@/Hooks/useBlockUser';
import Toast from 'react-native-toast-message';

interface ChatHeaderProps {
  chatName: string;
  userId: string;
  userStatus: 'online' | 'offline' | string;
  onBackPress: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatName,
  userId,
  userStatus,
  onBackPress,
}) => {
  const { darkMode } = useThemeMode();
  const [language, setLanguage] = useState('en');
  const isRTL = language === 'ar';
  const [modalVisible, setModalVisible] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  console.log(isBlocked, 'isBlocked');

  const {
    blockUser,
    unblockUser,
    fetchBlockedUsers,
    isUserBlocked,
    blockedUsers,
    loading,
  } = useBlockUser();
  useEffect(() => {
    fetchBlockedUsers(); // سيتم تحميل قائمة المحظورين عند فتح شاشة المحادثة
  }, []);

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

  useEffect(() => {
    const checkBlockStatus = async () => {
      if (userId) {
        const blocked = await isUserBlocked(userId);
        setIsBlocked(blocked);
      }
    };
    checkBlockStatus();
  }, [userId, blockedUsers]);

  const openMenu = () => setModalVisible(true);
  const closeMenu = () => setModalVisible(false);

  const handleBlock = async () => {
    closeMenu();
    try {
      if (isBlocked) {
        await unblockUser(userId);
        setIsBlocked(false);
        Toast.show({
          type: 'success',
          text1: i18n.t('unblock_success') || 'تم إلغاء الحظر بنجاح',
        });
      } else {
        await blockUser(userId);
        setIsBlocked(true);
        Toast.show({
          type: 'success',
          text1: i18n.t('block_success') || 'تم حظر المستخدم بنجاح',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: i18n.t('action_failed') || 'فشل في تنفيذ العملية',
      });
    }
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
          <Ionicons name="menu" size={28} color={darkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <View style={[styles.menuContainer, { backgroundColor: darkMode ? '#333' : '#fff' }]}>
            <TouchableOpacity onPress={handleBlock} style={styles.menuItem} disabled={loading}>
              <Text style={[styles.menuItemText, { color: darkMode ? '#fff' : '#000' }]}>
                {isBlocked
                  ? i18n.t('unblock') || 'إلغاء الحظر'
                  : i18n.t('block') || 'حظر'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Toast />
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
