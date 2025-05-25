import CustomHeader from '@/components/CustomHeader';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';

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

  const handlePin = (id: string) => {
    console.log('Pin group:', id);
    // هنا يمكن إضافة منطق التثبيت (مثل ترتيب العناصر)
  };

  const handleMute = (id: string) => {
    console.log('Mute group:', id);
    // هنا يمكن إضافة منطق كتم المحادثة
  };

  const handleLeave = (id: string) => {
    console.log('Leave group:', id);
    // إزالة المجموعة من القائمة عند الخروج
    setGroupChats((prev) => prev.filter((group) => group.id !== id));
  };
  const router = useRouter();

  const renderItem = ({ item }: { item: typeof initialGroupChats[0] }) => {
    const displayAvatars = item.members.slice(0, 2);
    const remaining = item.membersCount - displayAvatars.length;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/group/${item.id}?name=${encodeURIComponent(item.name)}`)}
      >
        <View style={styles.row}>
          <View style={styles.avatarsRow}>
            {displayAvatars.map((member, index) => (
              <Image
                key={member.id}
                source={{ uri: member.avatar }}
                style={[styles.avatar, { marginLeft: index === 0 ? 0 : -30 }]}
              />
            ))}
            {remaining > 0 && (
              <View style={[styles.avatar, styles.remainingAvatar, { marginLeft: -30 }]}>
                <Text style={styles.remainingText}>+{remaining}</Text>
              </View>
            )}
          </View>

          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.dot}> · </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="people" size={16} color="#888" style={{ marginRight: 4 }} />
                <Text style={styles.membersCount}>{item.membersCount}</Text>
              </View>
            </View>
            <Text
              style={styles.lastMessage}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Last message: {item.lastMessage}
            </Text>
          </View>
        </View>
      </TouchableOpacity>);
  };

  const renderHiddenItem = (data: any) => (
    <View style={styles.hiddenRow}>
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
    <View style={styles.container}>
      <CustomHeader />
      <SwipeListView
        data={groupChats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        leftOpenValue={240} // يسمح بعرض 3 أزرار
        stopLeftSwipe={240} // يمنع السحب الزائد
        disableRightSwipe={false} // يمنع السحب لليسار
        closeOnRowPress={false}  // منع الإغلاق عند الضغط على الصف
        closeOnScroll={false}    // منع الإغلاق عند التمرير
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
  card: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarsRow: {
    flexDirection: 'row',
    marginRight: 12,
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
