import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text } from '@/components/Themed';
import { useThemeMode } from '@/context/ThemeContext';
import AudioMessagePlayer from '@/components/AudioMessagePlayer';
import CustomBottomSheet from './CustomBottomSheet';
import { useSendToAllGroups } from '@/Hooks/useSendToAllGroups';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export type Message = {
  _id: string;
  type: 'text' | 'image' | 'audio';
  text: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
    badge?: string;
  };
  timestamp: number;
  isTemporary?: boolean;
  senderType?: 'system' | 'user'; // ✅ تمت إضافتها
};

interface Props {
  item: Message;
  currentUserId: string;
}

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const GroupMessageItem: React.FC<Props> = ({ item, currentUserId }) => {
  const { darkMode } = useThemeMode();
  const isMyMessage = item?.sender?._id === currentUserId;
  const avatar = item?.sender?.avatar || DEFAULT_AVATAR;
  const isSystemMessage = item.senderType === 'system';
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const parsed = JSON.parse(userDataString);
          setUserData(parsed);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);
  const colors = {
    myMessageBg: darkMode ? '#3B7D64' : '#A8D5BA',
    otherMessageBg: darkMode ? '#2E2E2E' : '#F0F0F0',
    myMessageText: darkMode ? '#E0F2F1' : '#0B3D1A',
    otherMessageText: darkMode ? '#E0E0E0' : '#222',
    usernameText: darkMode ? '#bbb' : '#444',
    timestampText: darkMode ? '#888' : '#666',
    tailColorMy: darkMode ? '#3B7D64' : '#A8D5BA',
    tailColorOther: darkMode ? '#2E2E2E' : '#F0F0F0',
    avatarBorder: darkMode ? '#4CAF50' : '#6BAF91',
  };
  const { sendToAllGroups } = useSendToAllGroups(currentUserId);

  const [optionsVisible, setOptionsVisible] = React.useState(false);
  const [giftVisible, setGiftVisible] = React.useState(false);
  const router = useRouter();

  const handleCopyUsername = () => {
    // Clipboard.setString(item.sender?.username || '');
    Alert.alert('تم النسخ', 'تم نسخ اسم المستخدم');
    setOptionsVisible(false);
  };

  const handleOpenProfile = () => {
    router.push({
      pathname: '/UserProfile',
      params: { userId: item.sender._id },
    });
    setOptionsVisible(false);
  };


  const handleSendGift = () => {
    setOptionsVisible(false);
    setGiftVisible(true);
  };


  return (
    <View
      style={[
        styles.container,
        { flexDirection: isMyMessage ? 'row-reverse' : 'row' },
      ]}
    >
      {!isMyMessage && !isSystemMessage && (
        <TouchableOpacity onPress={() => setOptionsVisible(true)}>

          <Image
            source={{ uri: avatar }}
            style={[styles.avatar, { borderColor: colors.avatarBorder }]}
            resizeMode="cover"
          />
        </TouchableOpacity>

      )}
      {isSystemMessage ? (<View style={{ alignItems: 'center', marginVertical: 6, flex: 1, justifyContent: "center" }}>
        <Text style={{ color: 'red', fontSize: 10 }}>{item.text}</Text>
      </View>) : (<View style={styles.messageWrapper}>
        {/* ذيل الرسالة */}
        <View
          style={[
            styles.tail,
            isMyMessage ? styles.tailRight : styles.tailLeft,
            {
              backgroundColor: isMyMessage
                ? colors.tailColorMy
                : colors.tailColorOther,
            },
          ]}
        />

        <View
          style={[
            styles.messageContainer,
            {
              backgroundColor: isMyMessage
                ? colors.myMessageBg
                : colors.otherMessageBg,
              borderTopLeftRadius: isMyMessage ? 18 : 22,
              borderTopRightRadius: isMyMessage ? 22 : 18,
              borderBottomLeftRadius: isMyMessage ? 22 : 5,
              borderBottomRightRadius: isMyMessage ? 5 : 22,
              shadowColor: isMyMessage ? '#3B7D64' : '#000',
            },
          ]}
        >
          {/* اسم المرسل يظهر فقط للرسائل الغير خاصة بي */}
          {item.sender && (
            <View
              style={{
                backgroundColor: darkMode ? '#444' : '#ddd',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
                alignSelf: 'flex-start',
                marginBottom: 4,
              }}
            >
              <Text style={{ color: colors.usernameText, fontSize: 12 }}>
                {isMyMessage
                  ? `${item.sender?.username || 'مستخدم'} ${item.sender?.badge || ''}`
                  : `${item.sender?.badge || ''} ${item.sender?.username || 'مستخدم'}`}
              </Text>

            </View>
          )}

          {/* رسالة نصية */}
          {item.type === 'text' && (
            <Text
              style={[
                styles.messageText,
                {
                  color: isMyMessage
                    ? colors.myMessageText
                    : colors.otherMessageText,
                },
              ]}
            >
              {item.text}
            </Text>
          )}

          {/* رسالة صورة */}
          {item.type === 'image' && (
            <Image
              source={{ uri: item.text }}
              style={styles.imageMessage}
              resizeMode="cover"
            />
          )}

          {/* رسالة صوتية */}
          {item.type === 'audio' && (
            <AudioMessagePlayer uri={item.text} isMyMessage={isMyMessage} />
          )}
        </View>
      </View>)}
      <CustomBottomSheet
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
      >
        <View style={styles.optionContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={handleCopyUsername}>
            <Text style={styles.optionText}>📋 Copy Username</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={handleOpenProfile}>
            <Text style={styles.optionText}>👤 View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={handleSendGift}>
            <Text style={styles.optionText}>🎁 Send Gift</Text>
          </TouchableOpacity>
        </View>
      </CustomBottomSheet>

      {/* Gift Bottom Sheet */}
      <CustomBottomSheet
        visible={giftVisible}
        onClose={() => setGiftVisible(false)}
      >
        <Text style={styles.giftTitle}>Select a Gift:</Text>
        <ScrollView horizontal contentContainerStyle={styles.giftScroll}>
          {['🎉', '🌹', '🍫', '💎', '🎂'].map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={styles.emojiWrapper}
              onPress={() => {
                sendToAllGroups(
                  `${item?.sender?.username} received a ${emoji} gift from ${userData?.username} !`,
                  'text',
                  'system'
                );


                setGiftVisible(false);
              }}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </CustomBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  messageWrapper: {
    maxWidth: '80%',
    position: 'relative',
  },
  messageContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tail: {
    width: 14,
    height: 14,
    position: 'absolute',
    bottom: 8,
    zIndex: -1,
    transform: [{ rotate: '45deg' }],
  },
  tailRight: {
    right: -7,
    borderBottomLeftRadius: 14,
  },
  tailLeft: {
    left: -7,
    borderBottomRightRadius: 14,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
    borderWidth: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'right',     // يجعل بداية النص من اليمين
    writingDirection: 'rtl' // يدعم لغات تكتب من اليمين مثل العربية
  },

  imageMessage: {
    width: 220,
    height: 160,
    borderRadius: 20,
    marginTop: 8,
  },
  // ✅ أنماط رسائل النظام
  systemMessageContainer: {
    alignSelf: 'center',
    backgroundColor: '#FFE082',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginVertical: 8,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  systemMessageText: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  optionContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  giftTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  giftScroll: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  emojiWrapper: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  emoji: {
    fontSize: 32,
  },
});

export default GroupMessageItem;
