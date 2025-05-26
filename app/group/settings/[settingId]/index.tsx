
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  I18nManager,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useThemeMode } from '@/context/ThemeContext';

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member' | 'none' | 'ban';
  isAdmin?: boolean;  // لتبسيط حالة المسؤولية في الواجهة
}

interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  members: Member[];
  password?: string;   // كلمة السر، اختياري
  isLocked?: boolean;  // هل المجموعة مقفلة
}

export default function GroupSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
    const navigation = useNavigation();
  
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);
  // حالة المجموعة
  const [group, setGroup] = useState<Group>({
    id: params.id,
    name: params.name || '',
    description: '',
    avatar: '',
    members: [
      { id: 'u1', name: 'Mohamed', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', role: 'owner', isAdmin: true },
      { id: 'u2', name: 'Aya', avatar: 'https://randomuser.me/api/portraits/women/45.jpg', role: 'admin', isAdmin: true },
      { id: 'u3', name: 'Ali', avatar: 'https://randomuser.me/api/portraits/men/12.jpg', role: 'member', isAdmin: false },
            { id: 'u4', name: 'Mohamed', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', role: 'owner', isAdmin: true },
      { id: 'u5', name: 'Aya', avatar: 'https://randomuser.me/api/portraits/women/45.jpg', role: 'admin', isAdmin: true },
      { id: 'u6', name: 'Ali', avatar: 'https://randomuser.me/api/portraits/men/12.jpg', role: 'member', isAdmin: false },
    ],
  });

  const [password, setPassword] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [language, setLanguage] = useState('en');
  const [searchText, setSearchText] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>(group.members);
  const [loading, setLoading] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const { darkMode } = useThemeMode();

  const isRTL = language === 'ar';

  const originalGroupRef = useRef(group);

  useEffect(() => {
    const getStoredLang = async () => {
      const lang = await AsyncStorage.getItem('appLanguage');
      if (lang) {
        setLanguage(lang);
        I18nManager.forceRTL(lang === 'ar');
      }
    };
    getStoredLang();
  }, []);

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredMembers(group.members);
    } else {
      const filtered = group.members.filter((m) =>
        m.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredMembers(filtered);
    }
  }, [searchText, group.members]);

  useEffect(() => {
    const changed =
      JSON.stringify(group) !== JSON.stringify(originalGroupRef.current);
    setUnsavedChanges(changed);
  }, [group]);

  const pickImage = async (fromCamera: boolean) => {
    try {
      let permissionResult;
      if (fromCamera) {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permissionResult.granted) {
        Alert.alert(isRTL ? 'الصلاحيات مرفوضة' : 'Permission denied');
        return;
      }

      let result;
      if (fromCamera) {
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets.length > 0) {
        setGroup((prev) => ({ ...prev, avatar: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert(isRTL ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const confirmExit = () => {
    if (unsavedChanges) {
      Alert.alert(
        isRTL ? 'تغييرات غير محفوظة' : 'Unsaved changes',
        isRTL
          ? 'هل ترغب في حفظ التغييرات قبل الخروج؟'
          : 'Do you want to save changes before exiting?',
        [
          {
            text: isRTL ? 'لا' : 'No',
            style: 'destructive',
            onPress: () => router.back(),
          },
          {
            text: isRTL ? 'نعم' : 'Yes',
            onPress: () => {
              handleSave();
            },
          },
          { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      router.back();
    }
  };

  const removeMember = (id: string) => {
    Alert.alert(
      isRTL ? 'تأكيد' : 'Confirm',
      isRTL
        ? 'هل أنت متأكد من إزالة هذا العضو؟'
        : 'Are you sure you want to remove this member?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'إزالة' : 'Remove',
          style: 'destructive',
          onPress: () => {
            setGroup((prev) => ({
              ...prev,
              members: prev.members.filter((m) => m.id !== id),
            }));
          },
        },
      ]
    );
  };

  const promoteToAdmin = (id: string) => {
    setGroup((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === id ? { ...m, isAdmin: !m.isAdmin } : m
      ),
    }));
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(isRTL ? 'تم التحديث' : 'Refreshed');
    }, 1000);
  };

  const openInviteModal = () => {
    setInviteModalVisible(true);
  };

  const closeInviteModal = () => {
    setInviteModalVisible(false);
  };

  const inviteLink = `https://app.example.com/join-group/${group.id}`;

  const currentUserId = 'u1'; // المستخدم الحالي (مثال)
  const currentUser = group.members.find((m) => m.id === currentUserId);
  const isCurrentUserAdmin = currentUser?.isAdmin === true;

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      originalGroupRef.current = { ...group, password, isLocked };
      setUnsavedChanges(false);
      setLoading(false);
      Alert.alert(isRTL ? 'تم الحفظ' : 'Saved');
      router.back();
    }, 1500);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        darkMode ? styles.containerDark : styles.containerLight,
        isRTL && { flexDirection: 'row-reverse' },
      ]}
    >
      <Text style={[styles.header, darkMode ? styles.textLight : styles.textDark]}>
        {isRTL ? 'إعدادات المجموعة' : 'Group Settings'}
      </Text>

      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => {
          Alert.alert(
            isRTL ? 'اختر مصدر الصورة' : 'Select Image Source',
            '',
            [
              { text: isRTL ? 'الكاميرا' : 'Camera', onPress: () => pickImage(true) },
              { text: isRTL ? 'المعرض' : 'Gallery', onPress: () => pickImage(false) },
              { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
            ]
          );
        }}
      >
        {group.avatar ? (
          <Image source={{ uri: group.avatar }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              darkMode ? styles.avatarPlaceholderDark : styles.avatarPlaceholderLight,
            ]}
          >
            <Ionicons name="camera" size={40} color="#888" />
            <Text style={darkMode ? styles.textLight : styles.textDark}>
              {isRTL ? 'صورة المجموعة' : 'Group Image'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        placeholder={isRTL ? 'اسم المجموعة' : 'Group Name'}
        style={[
          styles.input,
          darkMode ? styles.inputDark : styles.inputLight,
          isRTL && { textAlign: 'right' },
        ]}
        value={group.name}
        onChangeText={(text) => setGroup((prev) => ({ ...prev, name: text }))}
      />

      <TextInput
        placeholder={isRTL ? 'الوصف (اختياري)' : 'Description (Optional)'}
        style={[
          styles.input,
          darkMode ? styles.inputDark : styles.inputLight,
          isRTL && { textAlign: 'right' },
          { height: 80, textAlignVertical: 'top' },
        ]}
        multiline
        numberOfLines={4}
        value={group.description}
        onChangeText={(text) => setGroup((prev) => ({ ...prev, description: text }))}
      />

      {/* كلمة السر والقفل */}
      <View style={styles.row}>
        <Text style={[styles.label, darkMode ? styles.textLight : styles.textDark]}>
          {isRTL ? 'قفل المجموعة' : 'Lock Group'}
        </Text>
        <TouchableOpacity
          onPress={() => setIsLocked(!isLocked)}
          style={[
            styles.lockToggle,
            isLocked ? styles.locked : styles.unlocked,
          ]}
        >
          <Ionicons
            name={isLocked ? 'lock-closed' : 'lock-open'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {isLocked && (
        <TextInput
          placeholder={isRTL ? 'كلمة السر' : 'Password'}
          style={[
            styles.input,
            darkMode ? styles.inputDark : styles.inputLight,
            isRTL && { textAlign: 'right' },
          ]}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      )}

      {/* البحث عن الأعضاء */}
      <TextInput
        placeholder={isRTL ? 'بحث في الأعضاء' : 'Search Members'}
        style={[
          styles.input,
          darkMode ? styles.inputDark : styles.inputLight,
          isRTL && { textAlign: 'right' },
          { marginTop: 10 },
        ]}
        value={searchText}
        onChangeText={setSearchText}
      />
        {/* قائمة الأعضاء */}
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={handleRefresh}
          style={{ flexGrow: 0, maxHeight: 250 }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.memberRow,
                darkMode ? styles.memberRowDark : styles.memberRowLight,
                isRTL && { flexDirection: 'row-reverse' },
              ]}
            >
              <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text
                  style={[
                    styles.memberName,
                    darkMode ? styles.textLight : styles.textDark,
                    isRTL && { textAlign: 'right' },
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.memberRole,
                    darkMode ? styles.textLightSecondary : styles.textDarkSecondary,
                    isRTL && { textAlign: 'right' },
                  ]}
                >
                  {item.role === 'owner'
                    ? isRTL ? 'مالك' : 'Owner'
                    : item.role === 'admin'
                      ? isRTL ? 'مسؤول' : 'Admin'
                      : item.role === 'ban'
                        ? isRTL ? 'محظور' : 'Banned'
                        : isRTL ? 'عضو' : 'Member'}
                </Text>
              </View>

              {/* أزرار التحكم */}
              {isCurrentUserAdmin && item.id !== currentUserId && item.role !== 'owner' && (
                <View style={styles.controls}>
                  <TouchableOpacity
                    onPress={() => promoteToAdmin(item.id)}
                    style={[
                      styles.controlButton,
                      item.isAdmin ? styles.adminActive : styles.adminInactive,
                    ]}
                  >
                    <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeMember(item.id)}
                    style={[styles.controlButton, styles.removeButton]}
                  >
                    <Ionicons name="trash" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={[styles.emptyText, darkMode ? styles.textLight : styles.textDark]}>
              {isRTL ? 'لا يوجد أعضاء' : 'No members found'}
            </Text>
          )}
        />

        {/* دعوات */}
        <TouchableOpacity style={styles.inviteButton} onPress={openInviteModal}>
          <Ionicons name="person-add" size={24} color="#fff" />
          <Text style={styles.inviteButtonText}>
            {isRTL ? 'دعوة أعضاء' : 'Invite Members'}
          </Text>
        </TouchableOpacity>

        {/* حفظ والتراجع */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            onPress={confirmExit}
            style={[styles.button, styles.cancelButton]}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.button, styles.saveButton]}
            disabled={loading || !unsavedChanges}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isRTL ? 'حفظ' : 'Save'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* مودال دعوة الأعضاء */}
        <Modal
          visible={inviteModalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeInviteModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, darkMode ? styles.containerDark : styles.containerLight]}>
              <Text style={[styles.modalTitle, darkMode ? styles.textLight : styles.textDark]}>
                {isRTL ? 'رابط الدعوة' : 'Invite Link'}
              </Text>
              <Text selectable style={[styles.inviteLink, darkMode ? styles.textLight : styles.textDark]}>
                {inviteLink}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  // نسخ الرابط للحافظة
                  navigator.clipboard.writeText(inviteLink);
                  Alert.alert(isRTL ? 'تم النسخ' : 'Copied to clipboard');
                }}
                style={styles.copyButton}
              >
                <Ionicons name="copy" size={20} color="#fff" />
                <Text style={styles.copyButtonText}>{isRTL ? 'نسخ' : 'Copy'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={closeInviteModal} style={styles.closeModalButton}>
                <Text style={[styles.closeModalText, darkMode ? styles.textLight : styles.textDark]}>
                  {isRTL ? 'إغلاق' : 'Close'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  containerLight: {
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    alignSelf: 'center',
  },
  textDark: {
    color: '#222',
  },
  textLight: {
    color: '#eee',
  },
  textDarkSecondary: {
    color: '#555',
  },
  textLightSecondary: {
    color: '#bbb',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderLight: {
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholderDark: {
    backgroundColor: '#333',
    borderColor: '#555',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginVertical: 6,
    fontSize: 16,
  },
  inputLight: {
    borderColor: '#ccc',
    color: '#222',
  },
  inputDark: {
    borderColor: '#555',
    color: '#eee',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  label: {
    fontSize: 18,
  },
  lockToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locked: {
    backgroundColor: '#e74c3c',
  },
  unlocked: {
    backgroundColor: '#27ae60',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  memberRowLight: {
    backgroundColor: '#f9f9f9',
  },
  memberRowDark: {
    backgroundColor: '#222',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberName: {
    fontWeight: '600',
    fontSize: 16,
  },
  memberRole: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    padding: 6,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  adminActive: {
    backgroundColor: '#2980b9',
  },
  adminInactive: {
    backgroundColor: '#95a5a6',
  },
  removeButton: {
    backgroundColor: '#c0392b',
  },
  emptyText: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    backgroundColor: '#34495e',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    marginHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#7f8c8d',
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  inviteLink: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    backgroundColor: '#2980b9',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  copyButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  closeModalButton: {
    alignItems: 'center',
    padding: 10,
  },
  closeModalText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

