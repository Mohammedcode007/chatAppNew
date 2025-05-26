import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '@/components/CustomHeader';
import i18n from '@/i18n'; // نفترض ملف إعدادات الترجمة
import { useThemeMode } from '@/context/ThemeContext';

const initialGroupChats = [
  {
    id: '1',
    name: 'Work Friends',
    membersCount: 20,
    lastMessage: 'The final file was sent yesterday. Please confirm.',
    members: [
      { id: 'u1', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
      { id: 'u2', avatar: 'https://randomuser.me/api/portraits/women/45.jpg' },
      { id: 'u3', avatar: 'https://randomuser.me/api/portraits/men/12.jpg' },
    ],
  },
  {
    id: '2',
    name: 'Family',
    membersCount: 5,
    lastMessage: 'Dinner at 9?',
    members: [
      { id: 'u1', avatar: 'https://randomuser.me/api/portraits/women/41.jpg' },
      { id: 'u2', avatar: 'https://randomuser.me/api/portraits/men/23.jpg' },
    ],
  },
];

export default function GroupChatsScreen() {
  const [groupChats, setGroupChats] = useState(initialGroupChats);
  const [language, setLanguage] = useState('en');
  const { darkMode, toggleDarkMode } = useThemeMode();
  const isRTL = language === 'ar';
  const router = useRouter();

  useEffect(() => {
    const getStoredLang = async () => {
      const lang = await AsyncStorage.getItem('appLanguage');
      if (lang) {
        setLanguage(lang);
        i18n.changeLanguage(lang);
        // تغيير اتجاه النص حسب اللغة (RTL للعربية فقط)
        I18nManager.forceRTL(lang === 'ar');
      }
    };
    getStoredLang();
  }, []);

  const handlePin = (id: string) => {
    console.log('Pin group:', id);
    // منطق التثبيت
  };

  const handleMute = (id: string) => {
    console.log('Mute group:', id);
    // منطق كتم المحادثة
  };

  const handleLeave = (id: string) => {
    setGroupChats((prev) => prev.filter((group) => group.id !== id));
  };

  const renderItem = ({ item }: { item: typeof initialGroupChats[0] }) => {
    const displayAvatars = item.members.slice(0, 2);
    const remaining = item.membersCount - displayAvatars.length;

    return (
      <TouchableOpacity
        style={[styles.card, darkMode && styles.cardDark, isRTL && styles.rtlRow]}
        onPress={() =>
          router.push(`/group/${item.id}?name=${encodeURIComponent(item.name)}`)
        }
      >
        <View style={[styles.row, isRTL && styles.rtlRow]}>
          <View style={[styles.avatarsRow, isRTL && styles.rtlAvatarsRow]}>
            {displayAvatars.map((member, index) => (
              <Image
                key={member.id}
                source={{ uri: member.avatar }}
                style={[
                  styles.avatar,
                  isRTL
                    ? { marginRight: index === 0 ? 0 : -30 }
                    : { marginLeft: index === 0 ? 0 : -30 },
                ]}
              />
            ))}
            {remaining > 0 && (
              <View
                style={[
                  styles.avatar,
                  styles.remainingAvatar,
                  isRTL ? { marginRight: -30 } : { marginLeft: -30 },
                ]}
              >
                <Text style={styles.remainingText}>+{remaining}</Text>
              </View>
            )}
          </View>

          <View style={styles.info}>
            <View style={[styles.nameRow, isRTL && styles.rtlRow]}>
              <Text style={[styles.name, darkMode && styles.textDark]}>
                {item.name}
              </Text>
              <Text style={[styles.dot, darkMode && styles.textDark]}> · </Text>
              <View
                style={[
                  { flexDirection: 'row', alignItems: 'center' },
                  isRTL && { flexDirection: 'row-reverse' },
                ]}
              >
                <Ionicons
                  name="people"
                  size={16}
                  color={darkMode ? '#ccc' : '#888'}
                  style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }}
                />
                <Text style={[styles.membersCount, darkMode && styles.textDark]}>
                  {item.membersCount}
                </Text>
              </View>
            </View>
            <Text
              style={[styles.lastMessage, darkMode && styles.textDark]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {i18n.t('Last message')}: {item.lastMessage}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHiddenItem = (data: any) => (
    <View style={[styles.hiddenRow, isRTL && styles.rtlHiddenRow]}>
      <TouchableOpacity
        style={styles.actionButtonPin}
        onPress={() => handlePin(data.item.id)}
      >
        <Text style={styles.actionText}>📌</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButtonMute}
        onPress={() => handleMute(data.item.id)}
      >
        <Text style={styles.actionText}>🔕</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButtonLeave}
        onPress={() => handleLeave(data.item.id)}
      >
        <Text style={styles.actionText}>❌</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <CustomHeader />
      <SwipeListView
        data={groupChats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        leftOpenValue={240}
        stopLeftSwipe={240}
        disableRightSwipe={false}
        closeOnRowPress={false}
        closeOnScroll={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  cardDark: {
    backgroundColor: '#222',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  avatarsRow: {
    flexDirection: 'row',
    marginRight: 12,
  },
  rtlAvatarsRow: {
    marginRight: 0,
    marginLeft: 12,
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#ccc',
  },
  remainingAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddd',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  dot: {
    fontSize: 16,
    color: '#777',
  },
  membersCount: {
    fontSize: 14,
    color: '#555',
  },
  lastMessage: {
    fontSize: 13,
    color: '#333',
  },
  textDark: {
    color: '#ccc',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  hiddenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    height: '100%',
    paddingLeft: 16,
  },
  rtlHiddenRow: {
    flexDirection: 'row-reverse',
    paddingLeft: 0,
    paddingRight: 16,
  },
  actionButtonPin: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 10,
  },
  actionButtonMute: {
    backgroundColor: '#999',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 10,
  },
  actionButtonLeave: {
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
