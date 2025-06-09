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
      {!isMyMessage && !isSystemMessage && (
        <Image
          source={{ uri: avatar }}
          style={[styles.avatar, { borderColor: colors.avatarBorder }]}
          resizeMode="cover"
        />
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
});

export default GroupMessageItem;
