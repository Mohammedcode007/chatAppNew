
import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Image,
  I18nManager,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Text } from '@/components/Themed';
import CustomHeader from '@/components/CustomHeader';
import { useThemeMode } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import { useRouter } from 'expo-router';
import { ConversationSummary, useAllConversations } from '@/Hooks/useAllConversations';
import { useFocusEffect } from '@react-navigation/native';
import { useUserFetcherById } from '@/Hooks/useUserFetcherById';
import { useDeleteConversation } from '@/Hooks/useDeleteConversation';

function formatTime(dateTimeStr: string, locale = 'en-US') {
  const date = new Date(dateTimeStr);
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };
  const time = date.toLocaleTimeString(locale, options);
  const dateStr = date.toLocaleDateString(locale);
  return { time, date: dateStr };
}

export default function ChatsScreen() {
  const { darkMode } = useThemeMode();
  const [language, setLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

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

  const isRTL = language === 'ar';
  const dynamicStyles = styles(darkMode, isRTL);

  const { conversations, loading, refreshConversations, setConversations } = useAllConversations();
  console.log(conversations, '56564');

  useFocusEffect(
    useCallback(() => {
      refreshConversations();
    }, [refreshConversations])
  );
  const filteredConversations = conversations.filter((conv) =>
    conv.withUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [userData, setUserData] = useState<any>(null);
  const { userData: userDataNew } = useUserFetcherById(userData?._id);


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
  useEffect(() => {
    if (userDataNew && userDataNew._id) {
      setUserData(userDataNew); // تحديث دائمًا إذا كانت البيانات الجديدة موجودة
      AsyncStorage.setItem('userData', JSON.stringify(userDataNew)); // حفظ في التخزين المحلي
    }
  }, [userDataNew]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ConversationSummary | null>(null);
  const { deleteConversation } = useDeleteConversation(conversations, setConversations);

  if (loading) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={darkMode ? '#fff' : '#000'} />
        <Text style={{ marginTop: 10, color: darkMode ? '#fff' : '#000' }}>
          {i18n.t('loading') || 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <CustomHeader />

      <TextInput
        style={dynamicStyles.searchInput}
        placeholder={i18n.t('search') || 'Search...'}
        placeholderTextColor={darkMode ? '#aaa' : '#666'}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        textAlign={isRTL ? 'right' : 'left'}
      />

      {filteredConversations.length === 0 ? (
        <View style={dynamicStyles.emptyContainer}>
          <Text style={dynamicStyles.emptyText}>
            {i18n.t('noConversations') || 'لا توجد محادثات'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.withUserId}
          contentContainerStyle={dynamicStyles.listContainer}
          ItemSeparatorComponent={() => <View style={dynamicStyles.separator} />}
          renderItem={({ item }) => {

            const locale = language === 'ar' ? 'ar-EG' : 'en-US';
            const { time, date } = item.lastMessage
              ? formatTime(item.lastMessage.timestamp, locale)
              : { time: '', date: '' };

            return (
              <TouchableOpacity
                style={dynamicStyles.chatItem}
                onPress={() =>
                  router.push(
                    `/chat/${item.withUserId}?name=${encodeURIComponent(item.withUsername)}&status=${item.userStatus}`
                    // `/chat/${item.withUserId}?name=${encodeURIComponent(item.withUsername)}`
                  )
                }
                onLongPress={() => {
                  setSelectedItem(item);
                  setDeleteModalVisible(true);
                }}
              >
                <Image
                  source={{ uri: item.withAvatarUrl && item.withAvatarUrl.trim() !== '' ? item.withAvatarUrl : 'https://static.vecteezy.com/system/resources/previews/024/183/525/non_2x/avatar-of-a-man-portrait-of-a-young-guy-illustration-of-male-character-in-modern-color-style-vector.jpg' }}

                  style={dynamicStyles.avatar}
                />
                <View style={dynamicStyles.chatContent}>
                  <View style={dynamicStyles.chatHeader}>
                    <Text style={dynamicStyles.chatName} numberOfLines={1}>
                      {item.withUsername}
                    </Text>
                    <View style={dynamicStyles.dateTime}>
                      <Text style={dynamicStyles.chatDate}>{date}</Text>
                      <Text style={dynamicStyles.chatTime}>{time}</Text>
                    </View>
                  </View>
                  <View style={dynamicStyles.chatFooter}>
                    <Text style={dynamicStyles.chatMessage} numberOfLines={1}>
                      {item.lastMessage ? (
                        item.lastMessage.messageType === 'image' ? (
                          '📷 صورة'
                        ) : item.lastMessage.messageType === 'sound' ? (
                          '🎵 رسالة صوتية'
                        ) : (
                          item.lastMessage.text
                        )
                      ) : (
                        i18n.t('noMessagesYet') || 'لا توجد رسائل بعد'
                      )}
                    </Text>

                    {item.unreadCount > 0 && (
                      <View style={dynamicStyles.unreadBadge}>
                        <Text style={dynamicStyles.unreadText}>{item.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContainer}>
            <Text style={dynamicStyles.modalTitle}>
              هل تريد حذف هذه المحادثة؟
            </Text>
            <View style={dynamicStyles.modalActions}>
              <TouchableOpacity
                style={dynamicStyles.modalButton}
                onPress={() => {
                  // هنا من المفترض تنفيذ دالة الحذف
                  if (selectedItem) {
                    deleteConversation(selectedItem.withUserId);
                  }
                  setDeleteModalVisible(false);
                }}
              >
                <Text style={dynamicStyles.modalButtonText}>حذف</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={dynamicStyles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

}

const styles = (darkMode: boolean, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? '#121212' : '#fff',
      flexDirection: 'column',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    searchInput: {
      height: 40,
      marginHorizontal: 15,
      marginVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: darkMode ? '#555' : '#ccc',
      backgroundColor: darkMode ? '#1e1e1e' : '#f0f0f0',
      color: darkMode ? '#fff' : '#000',
      fontSize: 16,
    },
    listContainer: {
      paddingBottom: 20,
    },
    chatItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: darkMode ? '#1e1e1e' : '#fff',
      borderRadius: 10,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    chatContent: {
      flex: 1,
    },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    chatName: {
      fontWeight: 'bold',
      fontSize: 16,
      color: darkMode ? '#fff' : '#000',
      flexShrink: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    dateTime: {
      alignItems: 'flex-end',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    chatDate: {
      fontSize: 12,
      color: darkMode ? '#bbb' : '#999',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
    },
    emptyText: {
      fontSize: 18,
      color: darkMode ? '#ccc' : '#555',
      textAlign: 'center',
      paddingHorizontal: 20,
    },

    chatTime: {
      fontSize: 12,
      color: darkMode ? '#bbb' : '#999',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '80%',
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 20,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
      textAlign: 'center',
      marginBottom: 15,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalButton: {
      flex: 1,
      marginHorizontal: 5,
      paddingVertical: 10,
      backgroundColor: '#e53935',
      borderRadius: 8,
      alignItems: 'center',
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '500',
    },
    chatFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
      writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    chatMessage: {
      color: darkMode ? '#ccc' : '#555',
      fontSize: 14,
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    unreadBadge: {
      backgroundColor: '#ff3b30',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginLeft: isRTL ? 0 : 10,
      marginRight: isRTL ? 10 : 0,
      minWidth: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    separator: {
      height: 1,
      backgroundColor: darkMode ? '#333' : '#e0e0e0',
      marginVertical: 5,
    },
  });

