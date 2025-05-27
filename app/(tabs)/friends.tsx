

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, Image, TextInput, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import CustomHeader from '@/components/CustomHeader';
import { useThemeMode } from '@/context/ThemeContext';
import { useFriendStatuses } from '@/Hooks/useFriendStatuses';
import { useRouter } from 'expo-router';

type Friend = {
  _id: string;
  username: string;
  status: string;
  avatar?: string;  // افتراضياً يمكن تضيف خاصية صورة الافاتار لو موجودة في بياناتك
  isOnline: boolean;
};

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Friends() {
  const { darkMode } = useThemeMode();
  const user = useSelector((state: RootState) => state.user);
  const { friendStatuses } = useFriendStatuses();

  console.log(user, 'user');
  console.log(friendStatuses, "friendStatuses");

  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchText, setSearchText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const language = 'ar';
  const isRTL = language === 'ar';
  useEffect(() => {
    if (user && user.userData && user.userData.friends) {
      const friendsList = user.userData.friends.map((f: any) => ({
        _id: f._id,
        username: f.username,
        status: f.status || '',
        avatar: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 100)}.jpg`,
        isOnline: friendStatuses[f._id] === 'online',
      }));

      const sortedFriends = friendsList.sort((a, b) => a.username.localeCompare(b.username));
      setFriends(sortedFriends);
    }
  }, [user, friendStatuses]); // لاحظ إضافة friendStatuses هنا

  // useEffect(() => {
  //   if (user && user.userData && user.userData.friends) {
  //     // تحويل بيانات الأصدقاء من الـ Redux إلى الصيغة المطلوبة، وترتيب أبجدي
  //     const friendsList = user.userData.friends.map((f: any) => ({
  //       _id: f._id,
  //       username: f.username,
  //       status: f.status || '',
  //       avatar: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 100)}.jpg`, // مثال صورة عشوائية مؤقتة
  //       isOnline: f.status === 'online',
  //     }));

  //     const sortedFriends = friendsList.sort((a, b) => a.username.localeCompare(b.username));
  //     setFriends(sortedFriends);
  //   }
  // }, [user]);

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchText.toLowerCase())
  );
  console.log(filteredFriends, '787987987');


  const scrollToLetter = (letter: string) => {
    const index = filteredFriends.findIndex(friend => friend.username[0].toUpperCase() === letter);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0 });
    }
  };

  const handleScrollToIndexFailed = (info: any) => {
    const wait = new Promise(resolve => setTimeout(resolve, 100));
    wait.then(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: info.index, animated: true });
      }
    });
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity style={[styles.friendItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      onPress={() => router.push(`/chat/${item._id}?name=${encodeURIComponent(item.username)}`)}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View
          style={[
            styles.onlineIndicator,
            { backgroundColor: item.isOnline ? 'green' : 'gray' },
          ]}
        />
      </View>
      <View
        style={[
          styles.infoContainer,
          {
            marginLeft: isRTL ? 0 : 15,
            marginRight: isRTL ? 15 : 0,
            alignItems: isRTL ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <Text style={[styles.friendName, { color: darkMode ? '#fff' : '#000' }]}>{item.username}</Text>
        <Text style={[styles.statusMessage, { color: darkMode ? '#aaa' : '#666' }]}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  if (user.loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#121212' : '#fff', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: darkMode ? '#fff' : '#000' }}>{isRTL ? 'جاري التحميل...' : 'Loading...'}</Text>
      </SafeAreaView>
    );
  }

  if (user.error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#121212' : '#fff', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'red' }}>{isRTL ? `خطأ: ${user.error}` : `Error: ${user.error}`}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#121212' : '#fff' }]}>
      <CustomHeader />

      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: darkMode ? '#1E1E1E' : '#fff',
            borderColor: darkMode ? '#333' : '#ccc',
            color: darkMode ? '#fff' : '#000',
            textAlign: isRTL ? 'right' : 'left',
          },
        ]}
        placeholder={isRTL ? "ابحث عن الأصدقاء..." : "Search friends..."}
        placeholderTextColor={darkMode ? '#555' : '#999'}
        value={searchText}
        onChangeText={setSearchText}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      <View style={[styles.listContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <FlatList
          ref={flatListRef}
          data={filteredFriends}
          keyExtractor={(item) => item._id}
          renderItem={renderFriend}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: darkMode ? '#777' : '#999' }]}>
              {isRTL ? "لا يوجد أصدقاء للعرض" : "No friends to display"}
            </Text>
          }
          onScrollToIndexFailed={handleScrollToIndexFailed}
          initialNumToRender={20}
        />

        <View
          style={[
            styles.lettersContainer,
            { backgroundColor: darkMode ? '#222' : '#f8f8f8' },
            isRTL && { marginRight: 0, marginLeft: 10 },
          ]}
        >
          {alphabet.map((letter) => (
            <TouchableOpacity key={letter} onPress={() => scrollToLetter(letter)}>
              <Text style={[styles.letter, { color: darkMode ? '#4da6ff' : '#007AFF' }]}>
                {letter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchInput: {
    height: 45,
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  listContainer: { flex: 1 },
  friendItem: {
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingHorizontal: 15,
    flex: 1,
  },
  avatarContainer: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  onlineIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoContainer: { flex: 1 },
  friendName: { fontSize: 18, fontWeight: '600' },
  statusMessage: { fontSize: 14, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  lettersContainer: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  letter: { fontSize: 12, paddingVertical: 2, textAlign: 'center' },
});
