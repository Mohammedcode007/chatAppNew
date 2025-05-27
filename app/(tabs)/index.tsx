

import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, Image, I18nManager, TouchableOpacity, TextInput } from 'react-native';
import { Text } from '@/components/Themed';
import CustomHeader from '@/components/CustomHeader';
import { useThemeMode } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import { useRouter } from 'expo-router';

const dummyChats = [
  {
    id: '1',
    name: 'Mohammed Abdelrahim',
    lastMessage: 'Hi there!',
    time: '2025-05-24 14:45',
    unread: 2,
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: '2',
    name: 'Ahmed Said',
    lastMessage: 'See you tomorrow.',
    time: '2025-05-24 13:20',
    unread: 0,
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
  },
  {
    id: '3',
    name: 'Nora Ali',
    lastMessage: 'Thanks a lot!',
    time: '2025-05-24 12:10',
    unread: 1,
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
  },
];

function formatTime(dateTimeStr: string) {
  const date = new Date(dateTimeStr);
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };
  const time = date.toLocaleTimeString([], options);
  const dateStr = date.toLocaleDateString();
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

  // فلترة الدردشات حسب النص المدخل في البحث (بحساسية صغيرة للحروف)
  const filteredChats = dummyChats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={dynamicStyles.container}>
      <CustomHeader />

      {/* حقل البحث */}
      <TextInput
        style={dynamicStyles.searchInput}
        placeholder={i18n.t('search') || 'Search...'}
        placeholderTextColor={darkMode ? '#aaa' : '#666'}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={dynamicStyles.listContainer}
        ItemSeparatorComponent={() => <View style={dynamicStyles.separator} />}
        renderItem={({ item }) => {
          const { time, date } = formatTime(item.time);
          return (
            <TouchableOpacity
              style={dynamicStyles.chatItem}
              onPress={() => router.push(`/chat/${item.id}?name=${encodeURIComponent(item.name)}`)}
            >
              <Image source={{ uri: item.avatar }} style={dynamicStyles.avatar} />
              <View style={dynamicStyles.chatContent}>
                <View style={dynamicStyles.chatHeader}>
                  <Text style={dynamicStyles.chatName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={dynamicStyles.dateTime}>
                    <Text style={dynamicStyles.chatDate}>{date}</Text>
                    <Text style={dynamicStyles.chatTime}>{time}</Text>
                  </View>
                </View>
                <View style={dynamicStyles.chatFooter}>
                  <Text style={dynamicStyles.chatMessage} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unread > 0 && (
                    <View style={dynamicStyles.unreadBadge}>
                      <Text style={dynamicStyles.unreadText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
      textAlign: isRTL ? 'right' : 'left',
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
    chatTime: {
      fontSize: 12,
      color: darkMode ? '#bbb' : '#999',
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
