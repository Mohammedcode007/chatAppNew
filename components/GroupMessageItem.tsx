import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Text } from '@/components/Themed';
import { useThemeMode } from '@/context/ThemeContext';
import AudioMessagePlayer from '@/components/AudioMessagePlayer';
// إذا تستخدم مكتبة LinearGradient
// import LinearGradient from 'react-native-linear-gradient';

export type Message = {
  _id: string;
  type: 'text' | 'image' | 'audio';
  text: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
  };
  timestamp: number;
  isTemporary?: boolean;
};

interface Props {
  item: Message;
  currentUserId: string;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const isAM = hours < 12;
  const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const period = isAM ? 'ص' : 'م';
  return `${formattedHours}:${formattedMinutes} ${period}`;
};

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const GroupMessageItem: React.FC<Props> = ({ item, currentUserId }) => {
  const { darkMode } = useThemeMode();
  const isMyMessage = item.sender._id === currentUserId;
  const avatar = item.sender.avatar || DEFAULT_AVATAR;

  // ألوان الوضع الليلي / الفاتح
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

  return (
    <View
      style={[
        styles.container,
        { flexDirection: isMyMessage ? 'row-reverse' : 'row' },
      ]}
    >
      {!isMyMessage && (
        <Image
          source={{ uri: avatar }}
          style={[styles.avatar, { borderColor: colors.avatarBorder }]}
          resizeMode="cover"
        />
      )}

      <View style={styles.messageWrapper}>
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
          {!isMyMessage && (
            <Text style={[styles.username, { color: colors.usernameText }]}>
              {item.sender?.username || 'مستخدم'}
            </Text>
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

          {/* مؤشر تحميل إذا الرسالة مؤقتة */}
          {item.isTemporary && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.myMessageText} />
              <Text
                style={[
                  styles.sendingText,
                  { color: colors.myMessageText },
                ]}
              >
                جاري الإرسال...
              </Text>
            </View>
          )}

          {/* توقيت الرسالة */}
          <View style={styles.timeContainer}>
            <Text style={[styles.timestamp, { color: colors.timestampText }]}>
              {formatTime(item.timestamp)}
            </Text>
            {/* أيقونة ساعة صغيرة */}
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/2921/2921222.png',
              }}
              style={styles.clockIcon}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 10,
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
  username: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  imageMessage: {
    width: 220,
    height: 160,
    borderRadius: 20,
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sendingText: {
    marginLeft: 8,
    fontSize: 13,
    fontStyle: 'italic',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 11,
    marginRight: 4,
  },
  clockIcon: {
    width: 12,
    height: 12,
    tintColor: '#888',
    marginTop: Platform.OS === 'ios' ? 1 : 0,
  },
});

export default GroupMessageItem;
