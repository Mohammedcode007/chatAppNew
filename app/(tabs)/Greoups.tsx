import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  I18nManager,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '@/components/CustomHeader';
import i18n from '@/i18n'; // نفترض ملف إعدادات الترجمة
import { useThemeMode } from '@/context/ThemeContext';
import { useAllGroups } from '@/Hooks/useAllGroups';
import { useFavoriteGroups } from '@/Hooks/useFavoriteGroups';
import { useUserGroups } from '@/Hooks/useUserGroups';
import { useLeaveGroup } from '@/Hooks/useLeaveGroup';
import { useJoinGroup } from '@/Hooks/useJoinGroup';
import { useGroupMembers } from '@/Hooks/useGroupMembers';

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
  const [selectedTab, setSelectedTab] = useState<'favorite' | 'active' | 'popular'>('active');
  const [userData, setUserData] = useState<any>(null);
  const hasEnteredRoom = useRef(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserData(userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error('فشل في جلب التوكن:', error);
      }
    };

    fetchToken();
  }, []);

  const { groups, loading, error, fetchGroups } = useAllGroups(userData?._id);
  const { groups: favoriteGroups, loading: loadingFavorites, error: errorFavorites, fetchFavoriteGroups } = useFavoriteGroups(userData?._id);
  const { groups: userGroups, loading: loadingUserGroups, error: errorUserGroups, fetchUserGroups } = useUserGroups(userData?._id);
  const { leaveGroup: requestLeaveGroup, loading: isLeaving, error: leaveError, successMessage: leaveSuccess } = useLeaveGroup(userData?._id);
  const { joinGroup, successMessage, joinedGroupId } = useJoinGroup(userData?._id || '');
  const [groupNameForUrl, setGroupNameForUrl] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [shouldJoin, setShouldJoin] = useState(false);

  const { members, loading: loadingMembers, error: membersError } = useGroupMembers(selectedGroup?._id || null);


  const [loadingGroup, setLoadingGroup] = useState(false);

  const handleJoin = (item: any) => {
    if (item && item._id) {
      setLoadingGroup(true);
      setGroupNameForUrl(item.name);
      setSelectedGroup(item);
      hasEnteredRoom.current = false; // إعادة تعيين حالة الدخول
    } else {
      console.error('معرف المجموعة غير موجود');
    }
  };

  // تحقق ودخول الغرفة عند تحديث الأعضاء
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (!selectedGroup || !members || !userData) return;

    const memberCheck = members.some(
      (member) => String(member._id).trim() === String(userData._id).trim()
    );

    if (memberCheck) {
      setIsMember(true);
      if (!hasEnteredRoom.current) {
        router.push(`/group/${selectedGroup._id}?name=${encodeURIComponent(groupNameForUrl)}`);
        hasEnteredRoom.current = true;
        setLoadingGroup(false);
      }
    } else {
      setIsMember(false);
      // نفذ طلب الانضمام فقط ولا توجه أو تجلب رسائل
      joinGroup(selectedGroup._id);
    }
  }, [members, selectedGroup, userData]);



  // تابع نجاح الانضمام - عند نجاح الانضمام، يصبح isMember true تلقائياً بسبب تحديث أعضاء المجموعة (members)
  useEffect(() => {
    if (shouldJoin && successMessage && joinedGroupId && !hasEnteredRoom.current) {
      setIsMember(true);
      router.push(`/group/${joinedGroupId}?name=${encodeURIComponent(groupNameForUrl)}`);
      setShouldJoin(false);
      setLoadingGroup(false);
      hasEnteredRoom.current = true;
    }
  }, [successMessage, joinedGroupId, shouldJoin]);



  // خروج من المجموعة
  const handleLeaveGroup = (groupid: string) => {
    requestLeaveGroup(groupid);
  };

  useEffect(() => {
    if (userData?._id) {
      if (selectedTab === 'favorite') {
        fetchFavoriteGroups();
      } else if (selectedTab === 'popular') {
        fetchGroups();
      } else if (selectedTab === 'active') {
        fetchUserGroups();
      }
    }
  }, [userData?._id, selectedTab]);
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

  const selectedChats =
    selectedTab === 'popular'
      ? groups
      : selectedTab === 'favorite'
        ? favoriteGroups
        : selectedTab === 'active'   // هنا نتحقق إذا التبويب نشط للمجموعات الخاصة بالمستخدم
          ? userGroups
          : groupChats;


  const renderItem = ({ item }: { item: any }) => {
    const displayAvatars = (item.members || []).slice(0, 2);
    const remaining = (item.members?.length || 0) - displayAvatars.length;

    return (
      <TouchableOpacity
        style={[styles.card, darkMode && styles.cardDark, isRTL && styles.rtlRow]}
        onPress={() =>
          handleJoin(item)
        }
      >
        <View style={[styles.row, isRTL && styles.rtlRow]}>
          <View style={[styles.avatarsRow, isRTL && styles.rtlAvatarsRow]}>
            {displayAvatars.map((member: any, index: number) => {

              const key = typeof member === 'object' && member._id ? member._id : `avatar-${index}`;
              return (
                <Image
                  key={key}
                  source={{
                    uri: member?.avatar || 'https://via.placeholder.com/50',
                  }}
                  style={[
                    styles.avatar,
                    isRTL
                      ? { marginRight: index === 0 ? 0 : -30 }
                      : { marginLeft: index === 0 ? 0 : -30 },
                  ]}
                />
              );
            })}

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
                  {item.members?.length || 0}
                </Text>
              </View>
            </View>
            <Text
              style={[styles.lastMessage, darkMode && styles.textDark]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {i18n.t('Last message')}: {item.lastMessage || '—'}
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
        onPress={() => handleLeaveGroup(data.item._id)}
      >
        <Text style={styles.actionText}>❌</Text>
      </TouchableOpacity>
    </View>
  );

  const tabOptions = [
    { key: 'active', label: 'Active', icon: 'chatbubble-ellipses-outline' },
    { key: 'favorite', label: 'Favorite', icon: 'star-outline' },
    { key: 'popular', label: 'Popular', icon: 'flame-outline' },
  ];
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selectedTab) {
      rotationAnim.setValue(0); // إعادة التعيين كل مرة
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [selectedTab]);
  const rotate = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // نفّذ هنا عملية إعادة تحميل البيانات مثل جلب المحادثات من الخادم
      await fetchFavoriteGroups(); // هذه دالة وهمية، استبدلها بدالتك الحقيقية

      await fetchGroups(); // هذه دالة وهمية، استبدلها بدالتك الحقيقية
      await fetchUserGroups(); // هذه دالة وهمية، استبدلها بدالتك الحقيقية

    } catch (err) {
      console.error('Failed to refresh chats:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <CustomHeader />
      {loadingGroup && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.loadingText, darkMode && styles.textDark]}>
              {i18n.t('Loading group...')}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.tabs, isRTL && styles.rtlTabs]}>
        {tabOptions.map((tab) => {
          const isActive = selectedTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setSelectedTab(tab.key as any)}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <Animated.View style={isActive ? { transform: [{ rotate }], marginRight: 4 } : undefined}>
                <Ionicons
                  name={tab.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={isActive ? '#fff' : darkMode ? '#ccc' : '#888'}
                />
              </Animated.View>
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? '#fff' : darkMode ? '#ccc' : '#888',
                    fontWeight: isActive ? 'bold' : 'normal',
                  },
                ]}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>



      <SwipeListView
        data={selectedChats}

        keyExtractor={(item) => {
          return item._id;
        }} renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        leftOpenValue={240}
        stopLeftSwipe={240}
        disableRightSwipe={false}
        closeOnRowPress={false}

        closeOnScroll={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingVertical: 8 }}

        refreshing={refreshing}
        onRefresh={onRefresh}
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
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    flexDirection: "row",
    justifyContent: 'center',
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: '#7A3DA3', // لون بنفسجي قريب من #6A2D91
  },
  tabText: {
    color: '#FFF',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tabButtonRTL: {
    flexDirection: 'row-reverse',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  rtlTabs: {
    flexDirection: 'row-reverse',
  },


  tabIndicator: {
    height: 2,
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', // خلفية داكنة شفافة لتعتيم الخلفية
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingBox: {
    width: 160,
    paddingVertical: 20,
    paddingHorizontal: 25,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,  // للظل في أندرويد
  },
  loadingText: {
    marginTop: 15,
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
  },



});
