import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Modal,
  Text,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Colors from '@/constants/Colors';
import { useThemeMode } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function CustomHeader() {
  const { darkMode } = useThemeMode();
  const scheme = (darkMode ? 'dark' : 'light') as 'light' | 'dark';

  const [modalVisible, setModalVisible] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchText, setSearchText] = useState('');

  // فتح البحث
  const handleSearch = () => {
    setSearchActive(true);
  };

  // إغلاق البحث
  const handleCancelSearch = () => {
    setSearchActive(false);
    setSearchText('');
    Keyboard.dismiss();
  };

  // فتح مودال الإضافة
  const handleAdd = () => {
    setModalVisible(true);
  };

  // إغلاق مودال الإضافة
  const closeModal = () => {
    setModalVisible(false);
  };

  // عند الضغط على إضافة صديق
  const router = useRouter();

  const onAddFriend = () => {
    closeModal();
    router.push('/SearchUserScreen'); // غيّر المسار حسب اسم الملف الفعلي للصفحة
  };

  // عند الضغط على إضافة جروب
  const onAddGroup = () => {
    closeModal();
    alert('Opening Add Group screen...');
  };
  const onAddreqFriends = () => {
    closeModal();
    router.push('/FriendRequestsScreen'); // غيّر المسار حسب اسم الملف الفعلي للصفحة
  };

  const count = 5
  return (
    <View style={styles.container}>
      {/* حقل البحث */}
      {searchActive ? (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors[scheme].text} />
          <TextInput
            style={[styles.searchInput, { color: Colors[scheme].text }]}
            placeholder="Search..."
            placeholderTextColor={Colors[scheme].text + '99'}
            value={searchText}
            onChangeText={setSearchText}
            autoFocus={true}
            returnKeyType="search"
            onSubmitEditing={() => {
              alert(`Searching for: ${searchText}`);
            }}
          />
          <TouchableOpacity onPress={handleCancelSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <AntDesign name="close" size={20} color={Colors[scheme].text} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* الشعار */}
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
          />

          {/* أزرار البحث والإضافة */}
          <View style={styles.actions}>
            <Pressable onPress={handleSearch}>
              {({ pressed }) => (
                <View style={[styles.circle, { opacity: pressed ? 0.5 : 1 }]}>
                  <Ionicons name="search" size={20} color="#fff" />
                </View>
              )}
            </Pressable>
            <Pressable onPress={handleAdd}>
              {({ pressed }) => (
                <View style={[styles.circle, { opacity: pressed ? 0.5 : 1 }]}>
                  <AntDesign name="pluscircleo" size={20} color="#fff" />
                </View>
              )}
            </Pressable>
            <Pressable onPress={onAddreqFriends} style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="notifications-none" size={24} color="#fff" />
                {count > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {count > 99 ? '99+' : count}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          </View>
        </>
      )}

      {/* مودال الإضافة */}
      <AddModal
        visible={modalVisible}
        onClose={closeModal}
        onAddFriend={onAddFriend}
        onAddGroup={onAddGroup}
      />
    </View>
  );
}

// كومبوننت مودال الإضافة مع أيقونات
function AddModal({ visible, onClose, onAddFriend, onAddGroup }: any) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select an option</Text>

          {/* خيار إضافة صديق */}
          <TouchableOpacity
            style={styles.optionContainer}
            onPress={onAddFriend}
            activeOpacity={0.6}
          >
            <Ionicons name="person-add-outline" size={22} color="#6A2D91" />
            <Text style={styles.modalTextOption}>Add Friend</Text>
          </TouchableOpacity>

          {/* خيار إضافة جروب */}
          <TouchableOpacity
            style={styles.optionContainer}
            onPress={onAddGroup}
            activeOpacity={0.6}
          >
            <Ionicons name="people-outline" size={22} color="#6A2D91" />
            <Text style={styles.modalTextOption}>Add Group</Text>
          </TouchableOpacity>

          {/* زر إلغاء */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.6}
            style={{ marginTop: 15 }}
          >
            <Text style={[styles.modalTextOption, styles.cancelText]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#491B6D',
    paddingTop: 50,
  },
  logo: {
    width: 100,
    height: 50,
    resizeMode: 'contain',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    backgroundColor: '#6A2D91',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flex: 1,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 270,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#6A2D91',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 12,
  },
  modalTextOption: {
    fontSize: 16,
    color: '#6A2D91',
    textAlign: 'center',
  },
  cancelText: {
    color: '#888',
  },
  iconContainer: {
        backgroundColor: '#6A2D91',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
