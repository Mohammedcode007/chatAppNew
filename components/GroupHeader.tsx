import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Pressable, TextInput } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons, Entypo, Feather, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useThemeMode } from '@/context/ThemeContext';
import { useNavigation, useRouter } from 'expo-router';
import { useLeaveGroup } from '@/Hooks/useLeaveGroup';
import { useAllFriends } from '@/Hooks/useAllFriends';
import InviteModal from './InviteModal';

type Props = {
  title: string;
  membersCount?: string;
  settingId: string;
  userId: string;
  groupId: string;

};

export default function GroupHeader({ title, membersCount, settingId, userId, groupId }: Props) {
  const { darkMode } = useThemeMode();
  const navigation = useNavigation();
  const [inviteVisible, setInviteVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { friends, loading: friendsLoading, refreshFriends } = useAllFriends();
  const filteredFriends = friends?.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
console.log(membersCount,'membersCount');

  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();
  const {
    leaveGroup,
    loading,
    error,
    successMessage,
    leftGroupId,
  } = useLeaveGroup(userId);

  const handleLeave = async () => {

    const success = await leaveGroup(groupId)

    if (success) {
      console.log('تم الخروج بنجاح');


    } else {
      console.log('فشل الخروج من المجموعة');
    }
  };
  const handleOptionPress = (option: string) => {
    setMenuVisible(false);
    switch (option) {
      case 'leave':
        handleLeave()
        break;
      case 'settings':
        router.push(`/group/settings/${settingId}?userId=${encodeURIComponent(userId)}&groupId=${encodeURIComponent(groupId)}`);

        // فتح صفحة الإعدادات
        break;
      case 'invite':
        setInviteVisible(true);
        break;
      case 'report':
        // فتح واجهة الإبلاغ
        break;
      case 'share':
        // تنفيذ مشاركة المجموعة
        break;
    }
  };

  const menuOptions = [
    // { label: 'Leave Group', value: 'leave', icon: <MaterialIcons name="exit-to-app" size={18} color={darkMode ? '#fff' : '#000'} /> },
    { label: 'Settings', value: 'settings', icon: <Feather name="settings" size={18} color={darkMode ? '#fff' : '#000'} /> },
    { label: 'Invite', value: 'invite', icon: <Feather name="user-plus" size={18} color={darkMode ? '#fff' : '#000'} /> },
    { label: 'Report', value: 'report', icon: <MaterialIcons name="report" size={18} color="red" /> },
    { label: 'Share Group', value: 'share', icon: <AntDesign name="sharealt" size={18} color={darkMode ? '#fff' : '#000'} /> },
  ];

  return (
    <View style={[styles.header, darkMode && { backgroundColor: '#111', borderBottomColor: '#333' }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={darkMode ? '#fff' : '#000'} />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Text style={[styles.title, darkMode && { color: '#fff' }]}>{title}</Text>
        {typeof membersCount === 'string' && (
          <Text style={[styles.subTitle, darkMode && { color: '#aaa' }]}>
            {membersCount} members
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
        <Entypo name="dots-three-vertical" size={20} color={darkMode ? '#fff' : '#000'} />
      </TouchableOpacity>

      <Modal transparent visible={menuVisible} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuContainer, darkMode && { backgroundColor: '#222' }]}>
            {menuOptions.map(item => (
              <TouchableOpacity
                key={item.value}
                onPress={() => handleOptionPress(item.value)}
                style={styles.menuItem}
              >
                <View style={styles.menuItemContent}>
                  {item.icon}
                  <Text style={[styles.menuText, darkMode && { color: '#fff' }]}>{item.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
      <InviteModal
        visible={inviteVisible}
        onClose={() => setInviteVisible(false)}
        groupId={groupId}
        actorUserId={userId}
      />


    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 12,
    paddingTop: 50,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 13,
    color: '#666',
  },
  menuButton: {
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    width: 200,
    elevation: 4,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
  },
  inviteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteModalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    maxHeight: '70%',
  },
  inviteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  friendName: {
    fontSize: 16,
    color: '#333',
  },

});
